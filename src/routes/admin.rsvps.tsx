import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowUpDown, Download } from "lucide-react";
import { listRsvps } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";

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
  const { data, isLoading } = useQuery({ queryKey: ["rsvps"], queryFn: () => fn() });
  const rows = data?.rows ?? [];
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
    </div>
    <div className="mt-4 overflow-x-auto border border-gold/25 bg-card">
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead className="bg-cream text-xs uppercase tracking-wider text-muted-label"><tr>
          <th className="p-3">Name</th><th className="p-3">Email</th>
          <th className="p-3"><button onClick={() => toggle("guest_count")} className="inline-flex items-center gap-1 uppercase">Party <ArrowUpDown className="size-3" /></button></th>
          <th className="p-3">Attending</th><th className="p-3">Notes</th>
          <th className="p-3"><button onClick={() => toggle("submitted_at")} className="inline-flex items-center gap-1 uppercase">Submitted <ArrowUpDown className="size-3" /></button></th>
          <th className="p-3">Checked in</th>
        </tr></thead>
        <tbody>
          {isLoading && <tr><td colSpan={7} className="p-6 text-center text-muted-label">Loading…</td></tr>}
          {!isLoading && !filtered.length && <tr><td colSpan={7} className="p-6 text-center text-muted-label">No RSVPs match.</td></tr>}
          {filtered.map((r) => <tr key={r.id} className="border-t border-gold/15 align-top">
            <td className="p-3 font-medium">{r.full_name}</td><td className="p-3">{r.email}</td><td className="p-3">{r.guest_count}</td>
            <td className="p-3">{r.attending ? "Yes" : "No"}</td><td className="max-w-[220px] p-3 text-foreground/70">{r.notes}</td>
            <td className="p-3 whitespace-nowrap">{when(r.submitted_at)}</td>
            <td className="p-3 whitespace-nowrap">{r.checked_in ? when(r.checked_in_at) : "No"}</td>
          </tr>)}
        </tbody>
      </table>
    </div>
  </div>;
}
