import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reset password | Danielle & Obi" },
      { name: "description", content: "Choose a new password for your usher account." },
      { property: "og:title", content: "Reset password | Danielle & Obi" },
      { property: "og:description", content: "Choose a new password for your usher account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "PASSWORD_RECOVERY" || (s && event === "SIGNED_IN")) setReady(true);
    });
    const t = setTimeout(() => {
      supabase.auth.getSession().then(({ data: d }) => setReady((r) => r ?? Boolean(d.session)));
    }, 1200);
    return () => { clearTimeout(t); data.subscription.unsubscribe(); };
  }, []);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const pw = String(f.get("password"));
    if (pw.length < 8) return setError("Use at least 8 characters.");
    if (pw !== String(f.get("confirm"))) return setError("The passwords do not match.");
    setBusy(true); setError("");
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) {
      setError(/pwned|leak|weak/i.test(error.message) ? "That password appears in leaked password lists. Please choose another." : "Could not update the password. Request a new link and try again.");
      return;
    }
    navigate({ to: "/admin/checkin" });
  }

  const box = "mx-auto mt-16 max-w-sm space-y-4 border border-gold/25 bg-card p-6";
  return <div className="min-h-screen bg-background px-4 pb-16 pt-4">
    {ready === null ? <p className="mt-20 text-center text-muted-label">Checking your link…</p>
      : !ready ? <div className={box}>
          <h1 className="text-center font-serif text-3xl text-wine">Link expired</h1>
          <p className="text-center text-sm text-muted-foreground">This reset link is invalid or has already been used. Request a new one from the sign-in page.</p>
          <Button className="h-12 w-full bg-wine text-cream hover:bg-wine/90" onClick={() => navigate({ to: "/admin" })}>Go to sign in</Button>
        </div>
      : <form onSubmit={submit} className={box}>
          <p className="eyebrow text-center text-muted-label">USHERS ONLY</p>
          <h1 className="text-center font-serif text-3xl text-wine">New password</h1>
          <div><Label htmlFor="r-pass">New password</Label><Input id="r-pass" name="password" type="password" required minLength={8} autoComplete="new-password" className="mt-1 h-12" /></div>
          <div><Label htmlFor="r-confirm">Confirm password</Label><Input id="r-confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" className="mt-1 h-12" /></div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button disabled={busy} className="h-12 w-full bg-wine text-cream hover:bg-wine/90">{busy ? "Saving…" : "Save password"}</Button>
        </form>}
  </div>;
}
