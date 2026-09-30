import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AdminAccess } from "@/components/AdminAccess";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { listGiftHistory, retryGiftNotification, deleteGiftRecords } from "@/lib/gifts.functions";
import { Trash2, RefreshCw } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { naira } from "@/lib/gifts.shared";
export const Route = createFileRoute("/gift-history")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Private gifting history | Danielle & Obi" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => (
    <AdminAccess>
      <GiftHistory />
    </AdminAccess>
  ),
});
function GiftHistory() {
  const list = useServerFn(listGiftHistory);
  const retry = useServerFn(retryGiftNotification);
  const remove = useServerFn(deleteGiftRecords);
  const qc = useQueryClient();
  const [deletion, setDeletion] = useState<{ ids: string[]; label: string } | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const query = useQuery({
    queryKey: ["gift-history"],
    queryFn: () => list(),
    refetchInterval: 30000,
  });
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const rows = query.data ?? [];
  function confirmDelete(ids: string[], label: string) {
    setDeleteError("");
    setDeletion({ ids, label });
  }
  async function erase() {
    if (!deletion || busy) return;
    setBusy("delete");
    setDeleteError("");
    try {
      const result = await remove({ data: { ids: deletion.ids } });
      setDeletion(null);
      setNotice(
        `${result.deleted} record${result.deleted === 1 ? "" : "s"} cleared. Reserved gifts are available again.`,
      );
      await Promise.all([query.refetch(), qc.invalidateQueries({ queryKey: ["gift-catalog"] })]);
    } catch {
      setDeleteError("Could not clear these records. Please try again.");
    } finally {
      setBusy(null);
    }
  }
  async function resend(id: string) {
    setBusy(id);
    try {
      const result = await retry({ data: { id } });
      setNotice(
        result.sent
          ? "Notification accepted for delivery."
          : "Notification is still pending. Please try again later.",
      );
      await query.refetch();
    } catch {
      setNotice("Could not retry the notification.");
    } finally {
      setBusy(null);
    }
  }
  return (
    <main className="space-y-8 py-4 sm:py-6">
      <nav className="flex flex-wrap items-center justify-between gap-3 border-b border-gold/30 pb-4">
        <span className="font-script text-3xl text-wine">D & O</span>
        <Link to="/admin" className="text-sm text-wine underline">
          RSVP dashboard
        </Link>
        <Button variant="outline" onClick={() => supabase.auth.signOut()}>
          Sign out
        </Button>
      </nav>
      <header>
        <p className="eyebrow text-wine/70">FOR THE COUPLE</p>
        <h1 className="mt-2 font-serif text-4xl text-wine">Gifting history</h1>
        <p className="mt-3 text-sm">Gift pledges and reservations, all in one place.</p>
      </header>
      {query.isPending ? (
        <p role="status">Loading gifts…</p>
      ) : query.isError ? (
        <p role="alert">Could not load gifting history.</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Gift submissions", rows.length],
              [
                "Money pledged",
                naira(rows.reduce((n, r) => n + (r.kind === "money" ? Number(r.amount) : 0), 0)),
              ],
              ["Items reserved", rows.reduce((n, r) => n + r.items.length, 0)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md border border-gold/30 bg-card p-5">
                <p className="text-sm">{label}</p>
                <p className="mt-2 font-serif text-3xl text-wine">{value}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-foreground/70">
              Pledges do not confirm payment or delivery.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                disabled={query.isFetching || busy !== null}
                onClick={() => query.refetch()}
              >
                <RefreshCw className="mr-2 size-4" />
                Refresh
              </Button>
              <Button
                variant="destructive"
                disabled={!rows.length || busy !== null}
                onClick={() =>
                  confirmDelete(
                    rows.map((r) => r.id),
                    "all gift records",
                  )
                }
              >
                <Trash2 className="mr-2 size-4" />
                Clear all
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto border border-gold/30 bg-card">
            <table className="w-full min-w-[750px] text-left text-sm">
              <thead className="bg-cream">
                <tr>
                  {["Guest", "Gift / pledge", "Submitted", "Notification", ""].map((h) => (
                    <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider" key={h}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!rows.length && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-foreground/65">
                      No gifts recorded yet.
                    </td>
                  </tr>
                )}
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-gold/20 align-top">
                    <td className="px-5 py-5">
                      <p className="font-medium text-wine">{r.full_name}</p>
                      <p className="mt-2 text-xs text-foreground/70">{r.email}</p>
                    </td>
                    <td className="px-5 py-5">
                      {r.kind === "money"
                        ? naira(Number(r.amount))
                        : r.items.map((i) => i.name).join(", ")}
                      <p className="mt-2 text-xs text-foreground/65">
                        {r.kind === "money" ? "Pledged" : "Reserved"}
                      </p>
                    </td>
                    <td className="px-5 py-5">
                      {new Date(r.created_at).toLocaleString("en-NG", {
                        timeZone: "Africa/Lagos",
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="px-5 py-5">
                      {r.notification_sent_at ? (
                        "Sent to Obi"
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={busy !== null}
                          onClick={() => resend(r.id)}
                        >
                          {busy === r.id ? "Sending…" : "Retry notification"}
                        </Button>
                      )}
                    </td>
                    <td className="px-5 py-5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        disabled={busy !== null}
                        onClick={() => confirmDelete([r.id], `${r.full_name}’s gift record`)}
                        aria-label={`Delete gift record for ${r.full_name}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {notice && <p role="status">{notice}</p>}
      <AlertDialog
        open={deletion !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setDeletion(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear {deletion?.label}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes{" "}
              {deletion?.ids.length === 1
                ? "this record"
                : `these ${deletion?.ids.length ?? 0} records`}{" "}
              and makes any reserved gifts available again. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p role="alert" className="text-sm text-destructive">
              {deleteError}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy !== null}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy !== null}
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                void erase();
              }}
            >
              {busy === "delete" ? "Clearing…" : "Yes, clear"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
