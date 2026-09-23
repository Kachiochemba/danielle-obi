import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Scanner } from "@yudiel/react-qr-scanner";
import { AlertTriangle, CheckCircle2, SearchX } from "lucide-react";
import { z } from "zod";
import { checkInRsvp, getCheckinTally, lookupRsvp } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/checkin")({
  validateSearch: z.object({ code: z.string().optional() }),
  component: CheckIn,
});

type Guest = { confirmation_code: string; full_name: string; guest_count: number; attending: boolean; checked_in: boolean; checked_in_at: string | null };
type Result = { kind: "found"; guest: Guest; justCheckedIn?: boolean } | { kind: "missing"; code: string } | null;

function extractCode(raw: string) {
  const m = raw.trim().match(/checkin\/([A-Za-z0-9]+)/);
  return (m?.[1] ?? raw.trim()).toUpperCase();
}
const fmt = (t: string | null) => t ? new Date(t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "";

function CheckIn() {
  const { code: initialCode } = Route.useSearch();
  const qc = useQueryClient();
  const tallyFn = useServerFn(getCheckinTally);
  const lookupFn = useServerFn(lookupRsvp);
  const checkInFn = useServerFn(checkInRsvp);
  const tally = useQuery({ queryKey: ["tally"], queryFn: () => tallyFn() });
  const [result, setResult] = useState<Result>(null);
  const [busy, setBusy] = useState(false);
  const [paused, setPaused] = useState(false);

  async function lookup(raw: string) {
    const code = extractCode(raw);
    if (!/^[A-Z0-9]{4,16}$/.test(code)) { setResult({ kind: "missing", code: raw }); return; }
    setBusy(true); setPaused(true);
    try {
      const { guest } = await lookupFn({ data: { code } });
      setResult(guest ? { kind: "found", guest } : { kind: "missing", code });
    } finally { setBusy(false); }
  }
  useEffect(() => { if (initialCode) void lookup(initialCode); }, [initialCode]); // eslint-disable-line react-hooks/exhaustive-deps

  async function confirm(code: string) {
    setBusy(true);
    try {
      const res = await checkInFn({ data: { code } });
      if (res.guest) setResult({ kind: "found", guest: res.guest, justCheckedIn: !res.alreadyCheckedIn });
      qc.setQueryData(["tally"], res.tally);
      void qc.invalidateQueries({ queryKey: ["rsvps"] });
    } finally { setBusy(false); }
  }
  function next() { setResult(null); setPaused(false); }
  function manual(e: FormEvent<HTMLFormElement>) { e.preventDefault(); void lookup(String(new FormData(e.currentTarget).get("code") ?? "")); }

  return <div className="mx-auto max-w-md pt-5">
    <div className="bg-wine px-4 py-3 text-center text-cream">
      {tally.data ? <p className="text-sm"><span className="font-serif text-2xl text-gold">{tally.data.checkedIn}</span> of <span className="font-serif text-2xl">{tally.data.attending}</span> confirmed parties checked in</p> : <p className="text-sm">Loading tally…</p>}
    </div>

    {!result && <div className="mt-4 overflow-hidden border border-gold/30 bg-black">
      <Scanner paused={paused} onScan={(codes) => { const v = codes[0]?.rawValue; if (v && !busy) void lookup(v); }} constraints={{ facingMode: "environment" }} styles={{ container: { aspectRatio: "1 / 1" } }} />
    </div>}
    {!result && <form onSubmit={manual} className="mt-3 flex gap-2"><Input name="code" placeholder="Or type the code" className="h-12 uppercase tracking-widest" autoCapitalize="characters" /><Button disabled={busy} className="h-12 bg-wine text-cream hover:bg-wine/90">Look up</Button></form>}

    {result?.kind === "missing" && <div role="alert" className="mt-4 border-2 border-destructive bg-card p-6 text-center">
      <SearchX className="mx-auto size-10 text-destructive" />
      <p className="mt-3 font-serif text-2xl text-destructive">Not found. Check the code.</p>
      <p className="mt-1 text-sm text-muted-label">{result.code}</p>
      <Button onClick={next} variant="outline" className="mt-5 h-12 w-full">Scan again</Button>
    </div>}

    {result?.kind === "found" && <div role="status" aria-live="polite" className={`mt-4 border-2 bg-card p-6 text-center ${result.justCheckedIn ? "border-emerald" : result.guest.checked_in ? "border-gold" : "border-wine/40"}`}>
      <p className="eyebrow text-muted-label">{result.guest.confirmation_code}</p>
      <p className="mt-2 font-serif text-3xl text-wine">{result.guest.full_name}</p>
      <p className="mt-1 text-lg">Party of {result.guest.guest_count}</p>
      {!result.guest.attending && <p className="mt-2 text-sm font-semibold text-destructive">This RSVP said they could not attend.</p>}
      {result.justCheckedIn
        ? <p className="mt-5 flex items-center justify-center gap-2 text-lg font-semibold text-emerald"><CheckCircle2 className="size-6" /> Checked in at {fmt(result.guest.checked_in_at)}</p>
        : result.guest.checked_in
          ? <p className="mt-5 flex items-center justify-center gap-2 text-lg font-semibold text-gold"><AlertTriangle className="size-6" /> Already checked in at {fmt(result.guest.checked_in_at)}</p>
          : <Button disabled={busy} onClick={() => confirm(result.guest.confirmation_code)} className="mt-6 h-16 w-full bg-emerald text-lg text-cream hover:bg-emerald/90">Confirm Check-In</Button>}
      <Button onClick={next} variant="outline" className="mt-3 h-12 w-full">Scan next guest</Button>
    </div>}
  </div>;
}
