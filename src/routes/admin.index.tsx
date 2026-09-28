import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, RefreshCw, Users, QrCode } from "lucide-react";
import { listRsvps } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/")({ component: Dashboard });

function Dashboard() {
  const list = useServerFn(listRsvps);
  const { data, isPending, isError, isFetching, refetch } = useQuery({ queryKey: ["rsvps"], queryFn: () => list(), refetchInterval: 30000 });
  const rows = data?.rows ?? [];
  const attending = rows.filter((r) => r.attending);
  const arrived = attending.filter((r) => r.checked_in);
  const stats = [
    ["RSVPs received", rows.length, "All responses"],
    ["Guests expected", attending.reduce((n, r) => n + r.guest_count, 0), `${attending.length} attending parties`],
    ["Parties checked in", arrived.length, `${Math.max(0, attending.length - arrived.length)} parties still expected`],
    ["Not attending", rows.length - attending.length, "Declined invitations"],
  ] as const;
  return <main className="space-y-6 pt-6">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div><p className="eyebrow text-wine">DANIELLE & OBI</p><h1 className="mt-1 font-serif text-4xl text-wine">Wedding dashboard</h1><p className="mt-2 text-sm">Your guest responses and arrivals, at a glance.</p></div>
      <Button variant="outline" onClick={() => refetch()} disabled={isFetching}><RefreshCw className={isFetching ? "animate-spin" : ""} />Refresh</Button>
    </header>
    {isError ? <p role="alert" className="border border-destructive/30 bg-card p-4 text-destructive">The latest summary could not be loaded. Please try Refresh.</p>
      : isPending ? <p role="status" className="p-6">Loading your summary…</p>
      : <>
        <section aria-label="RSVP summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">{stats.map(([label, value, detail]) => <div key={label} className="rounded-md border border-gold/25 bg-card p-5"><p className="text-sm font-medium text-wine">{label}</p><p className="my-2 font-serif text-4xl text-wine">{value}</p><p className="text-xs">{detail}</p></div>)}</section>
        <section className="rounded-md border border-gold/25 bg-card p-5" aria-label="Arrival progress"><div className="flex justify-between gap-3 text-sm"><h2 className="font-semibold text-wine">Arrival progress</h2><span>{arrived.length} of {attending.length} parties</span></div><progress className="mt-3 h-3 w-full accent-wine" value={arrived.length} max={attending.length || 1} aria-label="Attending parties checked in" /><p className="mt-2 text-xs">Check-in is recorded for the whole party, rather than each individual guest.</p></section>
      </>}
    <section aria-label="Quick actions" className="grid gap-4 sm:grid-cols-2">
      {([{ to: "/admin/rsvps", title: "Guest list", description: "View responses, manage records and download your guest list.", Icon: Users }, { to: "/admin/checkin", title: "Check-in", description: "Scan a QR code or enter a confirmation code to welcome guests.", Icon: QrCode }] as const).map(({ to, title, description, Icon }) => <Link key={to} to={to} className="group rounded-md border border-gold/30 bg-card p-5 text-wine transition-colors hover:bg-wine hover:text-cream active:bg-wine-deep active:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"><Icon className="mb-3 size-6" /><h2 className="flex items-center justify-between font-serif text-2xl">{title}<ArrowRight className="size-5" /></h2><p className="mt-2 text-sm">{description}</p></Link>)}
    </section>
    {!isPending && !isError && <section className="rounded-md border border-gold/25 bg-card p-5"><h2 className="font-serif text-2xl text-wine">Latest responses</h2>{rows.length ? <ul className="mt-3 divide-y divide-gold/20">{rows.slice(0, 5).map((r) => <li key={r.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><span className="font-medium">{r.full_name}</span><span>{r.attending ? `Attending · Party of ${r.guest_count}` : "Not attending"}</span></li>)}</ul> : <p className="mt-3 text-sm">No RSVPs yet. New responses will appear here.</p>}<p className="mt-4 text-xs">Updates automatically every 30 seconds.</p></section>}
  </main>;
}
