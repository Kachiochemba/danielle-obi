import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AdminAccess } from "@/components/AdminAccess";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { listGiftHistory, retryGiftNotification } from "@/lib/gifts.functions";
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
  const query = useQuery({
    queryKey: ["gift-history"],
    queryFn: () => list(),
    refetchInterval: 30000,
  });
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const rows = query.data ?? [];
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
    <main className="space-y-6">
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
        <p className="eyebrow text-wine">PRIVATE · FOR THE COUPLE</p>
        <h1 className="mt-2 font-serif text-4xl text-wine">Gifting history</h1>
        <p className="mt-3 text-sm">
          Monetary pledges and reserved gifts. These records do not confirm payment or delivery.
        </p>
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
          <div className="overflow-x-auto border border-gold/30 bg-card">
            <table className="w-full min-w-[750px] text-left text-sm">
              <thead className="bg-cream">
                <tr>
                  {["Name", "Email", "Gift / pledge", "Status", "Submitted", "Notification"].map(
                    (h) => (
                      <th className="p-3" key={h}>
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {!rows.length && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center">
                      No gifts recorded yet.
                    </td>
                  </tr>
                )}
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-gold/20 align-top">
                    <td className="p-3">{r.full_name}</td>
                    <td className="p-3">{r.email}</td>
                    <td className="p-3">
                      {r.kind === "money"
                        ? naira(Number(r.amount))
                        : r.items.map((i) => i.name).join(", ")}
                    </td>
                    <td className="p-3">
                      {r.kind === "money"
                        ? "Pledged — transfer unverified"
                        : "Reserved — delivery unverified"}
                    </td>
                    <td className="p-3">
                      {new Date(r.created_at).toLocaleString("en-NG", {
                        timeZone: "Africa/Lagos",
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="p-3">
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <Button variant="outline" disabled={query.isFetching} onClick={() => query.refetch()}>
        Refresh history
      </Button>
      {notice && <p role="status">{notice}</p>}
    </main>
  );
}
