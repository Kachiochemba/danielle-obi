import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowUpDown, Download, Trash2 } from "lucide-react";
import { clearRsvps, deleteRsvp, listRsvps } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin/rsvps")({ component: RsvpList });

type Tri = "all" | "yes" | "no";
type SortKey = "submitted_at" | "guest_count";
const cols = ["full_name", "email", "guest_count", "attending", "notes", "submitted_at", "checked_in", "checked_in_at"] as const;
const csvCell = (v: unknown) => { const s = v == null ? "" : String(v); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const when = (t: string | null) => t ? new Date(t).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "";

function Select({ label, value, onChange }: { label: string; value: Tri; onChange: (v: Tri) => void }) {
  return <label className="flex items-center gap-2 text-sm">{label}<select value={value} onChange={(e) => onChange(e.target.value as Tri)} className="h-10 rounded-sm border border-gold/30 bg-card px-2"><option value="all">All</option><option value="yes">Yes</option><option value="no">No</option></select></label>;
}

function RsvpList() {
  const fn = useServerFn(listRsvps);
  const deleteFn = useServerFn(deleteRsvp);
  const clearFn = useServerFn(clearRsvps);
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ["rsvps"], queryFn: () => fn() });
  const rows = data?.rows ?? [];
  const [target, setTarget] = useState<{ kind: "one"; id: string; name: string } | { kind: "all"; before: string; count: number } | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [notice, setNotice] = useState("");
  const [att, setAtt] = useState<Tri>("all");
  const [chk, setChk] = useState<Tri>("all");
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: "submitted_at", desc: true });

  const filtered = useMemo(() => rows
    .filter((r) => att === "all" || r.attending === (att === "yes"))
    .filter((r) => chk === "all" || r.checked_in === (chk === "yes"))
    .sort((a, b) => { const d = sort.key === "guest_count" ? a.guest_count - b.guest_count : a.submitted_at.localeCompare(b.submitted_at); return sort.desc ? -d : d; }),
  [rows, att, chk, sort]);

  const attending = rows.filter((r) => r.attending);
  const stats = [
    ["RSVPs received", rows.length],
    ["Attending", attending.length],
    ["Not attending", rows.length - attending.length],
    ["Guests attending", attending.reduce((s, r) => s + r.guest_count, 0)],
    ["Checked in", rows.filter((r) => r.checked_in).length],
  ] as const;

  function toggle(key: SortKey) { setSort((s) => ({ key, desc: s.key === key ? !s.desc : true })); }
  function confirmDelete(next: NonNullable<typeof target>) {
    setTarget(next); setConfirmation(""); setDeleteError(""); setNotice("");
  }
  async function remove() {
    if (!target || deleting || (target.kind === "all" && confirmation !== "DELETE ALL")) return;
    setDeleting(true); setDeleteError("");
    try {
      const result = target.kind === "one"
        ? await deleteFn({ data: { id: target.id } })
        : await clearFn({ data: { confirmation: "DELETE ALL", before: target.before } });
      setTarget(null);
      setNotice(`${result.deleted} RSVP${result.deleted === 1 ? "" : "s"} deleted.`);
      await queryClient.invalidateQueries();
    } catch {
      setDeleteError("The deletion could not be confirmed. Refresh the list before trying again.");
    } finally { setDeleting(false); }
  }
  function download() {
    const csv = [cols.join(","), ...filtered.map((r) => cols.map((c) => csvCell(r[c])).join(","))].join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = `rsvps-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return <div className="pt-5">
    <div className="grid grid-cols-2 gap-2 md:grid-cols-5">{stats.map(([l, v]) => <div key={l} className="border border-gold/25 bg-card p-3 text-center"><p className="font-serif text-3xl text-wine">{v}</p><p className="eyebrow mt-1 text-[10px] text-muted-label">{l.toUpperCase()}</p></div>)}</div>
    <div className="mt-5 flex flex-wrap items-center gap-4">
      <Select label="Attending" value={att} onChange={setAtt} />
      <Select label="Checked in" value={chk} onChange={setChk} />
      <Button onClick={download} disabled={!filtered.length} className="ml-auto bg-wine text-cream hover:bg-wine/90"><Download className="size-4" /> Download CSV</Button>
      <Button variant="destructive" disabled={isLoading || isError || !rows.length || deleting || !data?.snapshotAt} onClick={() => data?.snapshotAt && confirmDelete({ kind: "all", before: data.snapshotAt, count: rows.length })}><Trash2 className="size-4" /> Clear all</Button>
    </div>
    {notice && <p role="status" className="mt-4 text-sm text-wine">{notice}</p>}
    {isError && <p role="alert" className="mt-4 text-sm text-destructive">Could not load the guest list. Please refresh the page.</p>}
    <div className="mt-4 overflow-x-auto border border-gold/25 bg-card">
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead className="bg-cream text-xs uppercase tracking-wider text-muted-label"><tr>
          <th className="p-3">Name</th><th className="p-3">Email</th>
          <th className="p-3"><button onClick={() => toggle("guest_count")} className="inline-flex items-center gap-1 uppercase">Party <ArrowUpDown className="size-3" /></button></th>
          <th className="p-3">Attending</th><th className="p-3">Notes</th>
          <th className="p-3"><button onClick={() => toggle("submitted_at")} className="inline-flex items-center gap-1 uppercase">Submitted <ArrowUpDown className="size-3" /></button></th>
          <th className="p-3">Checked in</th><th className="p-3">Actions</th>
        </tr></thead>
        <tbody>
          {isLoading && <tr><td colSpan={8} className="p-6 text-center text-muted-label">Loading…</td></tr>}
          {!isLoading && !isError && !filtered.length && <tr><td colSpan={8} className="p-6 text-center text-muted-label">No RSVPs match.</td></tr>}
          {filtered.map((r) => <tr key={r.id} className="border-t border-gold/15 align-top">
            <td className="p-3 font-medium">{r.full_name}</td><td className="p-3">{r.email}</td><td className="p-3">{r.guest_count}</td>
            <td className="p-3">{r.attending ? "Yes" : "No"}</td><td className="max-w-[220px] p-3 text-foreground/70">{r.notes}</td>
            <td className="p-3 whitespace-nowrap">{when(r.submitted_at)}</td>
            <td className="p-3 whitespace-nowrap">{r.checked_in ? when(r.checked_in_at) : "No"}</td>
            <td className="p-3"><Button variant="outline" size="sm" className="text-destructive" disabled={deleting} aria-label={`Delete RSVP for ${r.full_name}`} onClick={() => confirmDelete({ kind: "one", id: r.id, name: r.full_name })}><Trash2 className="size-4" /> Delete</Button></td>
          </tr>)}
        </tbody>
      </table>
    </div>
    <AlertDialog open={target !== null} onOpenChange={(open) => { if (!open && !deleting) setTarget(null); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{target?.kind === "all" ? "Clear all RSVPs?" : "Delete this RSVP?"}</AlertDialogTitle>
          <AlertDialogDescription>
            {target?.kind === "all"
              ? `This permanently deletes all ${target.count} RSVPs from the loaded guest list, including entries hidden by filters. New submissions received since the list loaded will be kept. Download a CSV first if you need a backup.`
              : `This permanently deletes ${target?.kind === "one" ? target.name : "this guest"}'s RSVP and check-in record. Their confirmation code will stop working.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {target?.kind === "all" && <label className="space-y-2 text-sm">Type DELETE ALL to confirm<Input aria-label="Type DELETE ALL to confirm" autoComplete="off" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} disabled={deleting} /></label>}
        {deleteError && <p role="alert" className="text-sm text-destructive">{deleteError}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <Button variant="destructive" disabled={deleting || (target?.kind === "all" && confirmation !== "DELETE ALL")} onClick={remove}>{deleting ? "Deleting…" : target?.kind === "all" ? "Delete all RSVPs" : "Delete RSVP"}</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>;
}
