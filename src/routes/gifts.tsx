import { useRef, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Heart } from "lucide-react";
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
    <main className="min-h-screen bg-background px-5 py-10">
      <div className="mx-auto max-w-xl">
        <Link to="/" className="text-sm text-wine underline">
          Back to the invitation
        </Link>
        <header className="my-10 text-center">
          <Heart className="mx-auto mb-4 size-8 text-gold" />
          <p className="eyebrow text-wine">DANIELLE & OBI</p>
          <h1 className="mt-2 font-serif text-5xl text-wine">A gift, with love</h1>
          <p className="mt-4 leading-7">
            Your presence is our greatest gift. If you would like to bless our new home, we are
            truly grateful.
          </p>
        </header>
        {pledged !== null ? (
          <section
            role="status"
            className="space-y-5 rounded-md border border-gold/30 bg-card p-7 text-center"
          >
            <h2 className="font-serif text-3xl text-wine">Thank you for your generosity!</h2>
            <p>
              Your pledge of <strong>{naira(pledged)}</strong> has been recorded. To send your gift,
              please transfer to:
            </p>
            <dl className="space-y-2 rounded-md bg-background p-5">
              <dt className="text-sm">Bank</dt>
              <dd className="font-semibold">{giftBank.bank}</dd>
              <dt className="text-sm">Account name</dt>
              <dd className="font-semibold">{giftBank.name}</dd>
              <dt className="text-sm">Account number</dt>
              <dd className="select-all break-all font-serif text-3xl tracking-wider text-wine">
                {giftBank.number}
              </dd>
            </dl>
            <p className="text-sm">
              Please use your name as the transfer reference and confirm the account name in your
              banking app. This page records your pledge; it does not confirm receipt of a transfer.
            </p>
            <Button asChild>
              <Link to="/">Back to the invitation</Link>
            </Button>
          </section>
        ) : (
          <form
            onSubmit={submit}
            className="space-y-5 rounded-md border border-gold/30 bg-card p-7"
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
                className="mt-2 h-12"
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
                className="mt-2 h-12"
              />
            </div>
            <div>
              <Label htmlFor="gift-kind">How would you like to give?</Label>
              <select
                id="gift-kind"
                value={kind}
                onChange={(e) => setKind(e.target.value)}
                className="mt-2 h-12 w-full rounded-md border border-input bg-background px-3"
              >
                <option value="money">Monetary gift</option>
                <option value="items">Choose from the gift list</option>
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
                  className="mt-2 h-12"
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
              {busy ? "Saving…" : "Submit"}
            </Button>
            <p className="text-xs leading-5">
              Your details and gift choice will be shared privately with the couple. No gift
              confirmation email will be sent to you.
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
