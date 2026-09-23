import { useEffect, useRef, useState, type FormEvent } from "react";
import { Sparkles } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitRsvp } from "@/lib/rsvp.functions";
import { Reveal, SectionTitle } from "./shared";

export function Rsvp() {
  const [attending, setAttending] = useState(true);
  const [status, setStatus] = useState<"idle"|"saving"|"success"|"error">("idle");
  const [code, setCode] = useState("");
  const thankYouRef = useRef<HTMLHeadingElement>(null);
  const send = useServerFn(submitRsvp);
  useEffect(() => { if (status === "success") thankYouRef.current?.focus({ preventScroll: true }); }, [status]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "saving") return;
    const form = new FormData(e.currentTarget);
    const fullName = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const guests = Number(form.get("guests"));
    const notes = String(form.get("notes") ?? "").trim();
    if (fullName.length < 2 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || guests < 1 || guests > 10 || notes.length > 1000) { setStatus("error"); return; }
    setStatus("saving");
    try {
      const res = await send({ data: { fullName, email, guests, attending, notes: notes || undefined } });
      if (res.ok) { setCode(res.code); setStatus("success"); } else setStatus("error");
    } catch { setStatus("error"); }
  }
  const checkinUrl = typeof window !== "undefined" ? `${window.location.origin}/checkin/${code}` : `/checkin/${code}`;
  return <div className="bg-surface px-5 py-20 md:px-8">
    <div className="mx-auto max-w-xl">
      <Reveal><SectionTitle eyebrow="KINDLY RESPOND" title="RSVP" subtitle="We hope you can join us" /></Reveal>
      {status === "success"
        ? <div role="status" aria-live="polite" className="border border-gold/35 bg-card px-6 py-14 text-center md:px-10 md:py-16"><Sparkles className="mx-auto size-10 text-gold"/><p className="eyebrow mt-6 text-muted-label">RESPONSE RECEIVED</p><h3 ref={thankYouRef} tabIndex={-1} className="mt-3 font-script text-6xl leading-none text-wine outline-none">Thank you!</h3><p className="mx-auto mt-5 max-w-sm font-serif text-lg leading-8 text-foreground/70">We have received your response and can't wait to celebrate with you.</p>
            <div className="mx-auto mt-8 inline-block border border-gold/30 bg-background p-4"><QRCodeSVG value={checkinUrl} size={184} fgColor="#4a1424" bgColor="transparent" title={`Check-in QR code ${code}`} /></div>
            <p className="eyebrow mt-5 text-muted-label">CONFIRMATION CODE</p>
            <p className="mt-1 font-serif text-3xl tracking-[0.25em] text-wine">{code}</p>
            <p className="mx-auto mt-4 max-w-xs text-sm leading-6 text-foreground/70">Save this or check your email. You'll need it at the entrance.</p></div>
        : <form onSubmit={submit} className="space-y-5 border border-gold/25 bg-card p-6 md:p-8">
            <div><Label htmlFor="name" className="eyebrow text-muted-label">FULL NAME</Label><Input id="name" name="name" required minLength={2} maxLength={120} className="mt-2 h-12 rounded-sm border-gold/30 bg-background" placeholder="Your name"/></div>
            <div><Label htmlFor="email" className="eyebrow text-muted-label">EMAIL</Label><Input id="email" name="email" type="email" required maxLength={255} autoComplete="email" className="mt-2 h-12 rounded-sm border-gold/30 bg-background" placeholder="you@example.com"/></div>
            <div><Label htmlFor="guests" className="eyebrow text-muted-label">NUMBER OF GUESTS</Label><Input id="guests" name="guests" required type="number" min={1} max={10} defaultValue={1} className="mt-2 h-12 rounded-sm border-gold/30 bg-background"/></div>
            <fieldset><legend className="eyebrow text-muted-label">ATTENDING?</legend><div className="mt-2 grid grid-cols-2 gap-2"><Button type="button" variant={attending ? "default" : "outline"} onClick={() => setAttending(true)} className={`h-11 ${attending ? "bg-wine text-cream hover:bg-wine/90" : "border-gold/30"}`}>Joyfully, yes</Button><Button type="button" variant={!attending ? "default" : "outline"} onClick={() => setAttending(false)} className={`h-11 ${!attending ? "bg-wine text-cream hover:bg-wine/90" : "border-gold/30"}`}>Sadly, no</Button></div></fieldset>
            <div><Label htmlFor="notes" className="eyebrow text-muted-label">DIETARY NOTES · OPTIONAL</Label><Textarea id="notes" name="notes" maxLength={1000} className="mt-2 min-h-28 rounded-sm border-gold/30 bg-background" placeholder="Anything we should know?"/></div>
            {status === "error" && <p role="alert" className="text-sm text-destructive">Please check your details and try again.</p>}
            <Button disabled={status === "saving"} className="h-13 w-full rounded-sm bg-wine text-cream hover:bg-wine/90">{status === "saving" ? "SENDING…" : "SEND RSVP"}</Button>
          </form>}
    </div>
  </div>;
}
