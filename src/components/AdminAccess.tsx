import { useEffect, useState, type FormEvent } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { checkIsAdmin } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SignIn() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"signin" | "forgot" | "sent">("signin");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    const raw = String(f.get("email")).trim().toLowerCase();
    const email = raw.includes("@") ? raw : `${raw}@danielleandobi.com.ng`;
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: String(f.get("password")),
    });
    setBusy(false);
    if (error) setError("Those details did not match. Please try again.");
  }
  async function forgot(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    await supabase.auth.resetPasswordForEmail(String(f.get("email")).trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    // Same message whether or not the account exists, so emails can't be probed.
    setMode("sent");
  }
  const box = "mx-auto mt-16 max-w-sm space-y-4 border border-gold/25 bg-card p-6";
  if (mode === "sent")
    return (
      <div className={box} role="status">
        <h1 className="text-center font-serif text-3xl text-wine">Check your email</h1>
        <p className="text-center text-sm text-muted-foreground">
          If that address has an account, a reset link is on its way. The link works once and
          expires after an hour.
        </p>
        <Button variant="outline" className="h-12 w-full" onClick={() => setMode("signin")}>
          Back to sign in
        </Button>
      </div>
    );
  if (mode === "forgot")
    return (
      <form onSubmit={forgot} className={box}>
        <p className="eyebrow text-center text-muted-label">STAFF ACCESS</p>
        <h1 className="text-center font-serif text-3xl text-wine">Reset password</h1>
        <div>
          <Label htmlFor="f-email">Email</Label>
          <Input
            id="f-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="mt-1 h-12"
          />
        </div>
        <Button disabled={busy} className="h-12 w-full bg-wine text-cream hover:bg-wine/90">
          {busy ? "Sending…" : "Send reset link"}
        </Button>
        <button
          type="button"
          onClick={() => setMode("signin")}
          className="block w-full text-center text-sm text-wine underline"
        >
          Back to sign in
        </button>
      </form>
    );
  return (
    <form onSubmit={submit} className={box}>
      <p className="eyebrow text-center text-muted-label">STAFF ACCESS</p>
      <h1 className="text-center font-serif text-3xl text-wine">Sign in</h1>
      <div>
        <Label htmlFor="a-email">Username or email</Label>
        <Input
          id="a-email"
          name="email"
          type="text"
          required
          autoComplete="username"
          autoCapitalize="none"
          className="mt-1 h-12"
        />
      </div>
      <div>
        <Label htmlFor="a-pass">Password</Label>
        <Input
          id="a-pass"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-1 h-12"
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button disabled={busy} className="h-12 w-full bg-wine text-cream hover:bg-wine/90">
        {busy ? "Signing in…" : "Sign in"}
      </Button>
      <button
        type="button"
        onClick={() => {
          setError("");
          setMode("forgot");
        }}
        className="block w-full text-center text-sm text-wine underline"
      >
        Forgot password?
      </button>
    </form>
  );
}

type StaffAccess = { admin: boolean; usher: boolean };
export function AdminAccess({
  children,
  allowUsher = false,
}: {
  children: React.ReactNode | ((access: StaffAccess) => React.ReactNode);
  allowUsher?: boolean;
}) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const qc = useQueryClient();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      if (
        event === "SIGNED_IN" ||
        event === "SIGNED_OUT" ||
        event === "USER_UPDATED" ||
        event === "INITIAL_SESSION"
      ) {
        setSession(s);
        qc.clear();
      }
    });
    return () => data.subscription.unsubscribe();
  }, [qc]);
  const isAdminFn = useServerFn(checkIsAdmin);
  const admin = useQuery({
    queryKey: ["is-admin", session?.user.id],
    queryFn: () => isAdminFn(),
    enabled: Boolean(session),
  });

  return (
    <div className="min-h-screen bg-background px-4 pb-16 pt-4">
      {session === undefined ? (
        <p className="mt-20 text-center text-muted-label">Loading…</p>
      ) : !session ? (
        <SignIn />
      ) : admin.isLoading ? (
        <p className="mt-20 text-center text-muted-label">Checking access…</p>
      ) : !(admin.data?.admin || (allowUsher && admin.data?.usher)) ? (
        <div className="mx-auto mt-20 max-w-sm text-center">
          <p className="font-serif text-2xl text-wine">
            This account does not have access to this page.
          </p>
          <Button variant="outline" className="mt-6" onClick={() => supabase.auth.signOut()}>
            Sign out
          </Button>
        </div>
      ) : (
        <div className="mx-auto max-w-5xl">
          {typeof children === "function" ? children(admin.data!) : children}
        </div>
      )}
    </div>
  );
}
