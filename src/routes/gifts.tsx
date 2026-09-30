import { useRef, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { GiftPage } from "@/components/wedding/GiftPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitGift } from "@/lib/gifts.functions";
import { giftBank, giftIdentitySchema, naira } from "@/lib/gifts.shared";
export const Route = createFileRoute("/gifts")({
  head: () => ({ meta: [{ title: "Gift registry | Danielle & Obi" }] }),
  component: GiftRegistry,
});
function GiftRegistry() {
  const [kind, setKind] = useState("money");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pledged, setPledged] = useState<number | null>(null);
  const request = useRef<string | null>(null);
  const send = useServerFn(submitGift);
  const navigate = useNavigate();
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setError("");
    const f = new FormData(e.currentTarget);
    const identity = giftIdentitySchema.safeParse({
      fullName: f.get("name"),
      email: f.get("email"),
    });
    if (!identity.success) {
      setError("Please enter your name and a valid email address.");
      return;
    }
    if (kind === "items") {
      try {
        sessionStorage.setItem("gift-identity", JSON.stringify(identity.data));
        await navigate({ to: "/gift-list" });
      } catch {
        setError("Please allow browser storage, then try again.");
      }
      return;
    }
    setBusy(true);
    try {
      request.current ??= crypto.randomUUID();
      const result = await send({
        data: {
          ...identity.data,
          kind: "money",
          amount: Number(f.get("amount")),
          requestId: request.current,
        },
      });
      if (result.ok) setPledged(Number(result.amount));
      else setError(result.message);
    } catch {
      setError("We could not confirm your pledge. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <GiftPage
      title="A gift, with love"
      subtitle="Your presence is our greatest gift. Thank you for thinking of our new home."
    >
      <div className="mx-auto max-w-lg">
        {pledged !== null ? (
          <section
            role="status"
            className="space-y-7 border border-gold/25 bg-card px-6 py-9 text-center sm:p-10"
          >
            <h2 className="font-serif text-3xl text-wine">Thank you, with love</h2>
            <p>
              To send your gift of <strong>{naira(pledged)}</strong>, please use the details below.
            </p>
            <dl className="grid gap-y-2 border-y border-gold/25 py-7">
              <dt className="mt-3 text-xs uppercase tracking-widest text-foreground/65">Bank</dt>
              <dd className="font-semibold">{giftBank.bank}</dd>
              <dt className="mt-3 text-xs uppercase tracking-widest text-foreground/65">
                Account name
              </dt>
              <dd className="font-semibold">{giftBank.name}</dd>
              <dt className="mt-3 text-xs uppercase tracking-widest text-foreground/65">
                Account number
              </dt>
              <dd className="select-all break-all font-serif text-3xl tracking-wider text-wine">
                {giftBank.number}
              </dd>
            </dl>
            <p className="text-sm">Please use your name as the transfer reference.</p>
            <Button asChild>
              <Link to="/">Back to the invitation</Link>
            </Button>
          </section>
        ) : (
          <form
            onSubmit={submit}
            className="space-y-7 border border-gold/25 bg-card px-6 py-8 sm:p-10"
          >
            <div>
              <Label htmlFor="gift-name">Full name</Label>
              <Input
                id="gift-name"
                name="name"
                required
                minLength={2}
                maxLength={120}
                autoComplete="name"
                className="mt-3 h-12 bg-transparent"
              />
            </div>
            <div>
              <Label htmlFor="gift-email">Email</Label>
              <Input
                id="gift-email"
                name="email"
                type="email"
                required
                maxLength={255}
                autoComplete="email"
                className="mt-3 h-12 bg-transparent"
              />
            </div>
            <div>
              <Label htmlFor="gift-kind">Gift type</Label>
              <select
                id="gift-kind"
                value={kind}
                onChange={(e) => setKind(e.target.value)}
                className="mt-3 h-12 w-full rounded-md border border-input bg-transparent px-3"
              >
                <option value="money">Monetary gift</option>
                <option value="items">Choose a gift</option>
              </select>
            </div>
            {kind === "money" && (
              <div>
                <Label htmlFor="gift-amount">Amount (₦)</Label>
                <Input
                  id="gift-amount"
                  name="amount"
                  type="number"
                  min="0.01"
                  max="100000000"
                  step="0.01"
                  required
                  className="mt-3 h-12 bg-transparent"
                  placeholder="Enter your gift amount"
                />
              </div>
            )}
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button disabled={busy} className="h-12 w-full bg-wine text-cream hover:bg-wine-deep">
              {busy ? "Saving…" : kind === "items" ? "Browse gifts" : "Continue"}
            </Button>
          </form>
        )}
      </div>
    </GiftPage>
  );
}
