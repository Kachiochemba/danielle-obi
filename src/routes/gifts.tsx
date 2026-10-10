import { useEffect, useRef, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { GiftPage } from "@/components/wedding/GiftPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { submitGift } from "@/lib/gifts.functions";
import { giftBank, giftIdentitySchema, giftSubmissionSchema, naira } from "@/lib/gifts.shared";
export const Route = createFileRoute("/gifts")({
  validateSearch: (search: Record<string, unknown>): { kind?: "money" | "items" | "wish" } => {
    const kind = search["kind"];
    return kind === "money" || kind === "items" || kind === "wish" ? { kind } : {};
  },
  head: () => ({ meta: [{ title: "Gift registry | Danielle & Obi" }] }),
  component: GiftRegistry,
});
function GiftRegistry() {
  const search = Route.useSearch();
  const [kind, setKind] = useState<string>(search.kind ?? "");
  const [identityValues, setIdentityValues] = useState({ fullName: "", email: "" });
  const [wishDone, setWishDone] = useState(false);
  const [bankOpen, setBankOpen] = useState(false);
  useEffect(() => {
    try {
      const stored = giftIdentitySchema.safeParse(
        JSON.parse(sessionStorage.getItem("gift-identity") || "null"),
      );
      if (stored.success) setIdentityValues(stored.data);
    } catch {
      /* Guests can enter their details normally. */
    }
  }, []);
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
    const parsed = giftSubmissionSchema.safeParse({
      ...identity.data,
      requestId: request.current ?? crypto.randomUUID(),
      kind,
      ...(kind === "money"
        ? { amount: Number(f.get("amount")) }
        : { wish: String(f.get("wish") ?? "") }),
    });
    if (!parsed.success) {
      setError("Please check your details and choose an option.");
      return;
    }
    request.current = parsed.data.requestId;
    setBusy(true);
    try {
      request.current ??= crypto.randomUUID();
      const result = await send({
        data: parsed.data,
      });
      if (result.ok) {
        if (kind === "money") {
          setPledged(Number(result.amount));
          setBankOpen(true);
        } else setWishDone(true);
      } else setError(result.message);
    } catch {
      setError("We could not confirm your submission. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <GiftPage
      title="A little love"
      subtitle="A wish, a gift, or a little blessing—only if you’d like."
    >
      <div className="mx-auto max-w-lg">
        {wishDone || pledged !== null ? (
          <div role="status" className="space-y-6 border border-gold/25 bg-card p-8 text-center">
            <h2 className="font-serif text-3xl text-wine">Thank you, with love</h2>
            <p>
              {wishDone
                ? "Your kind words mean so much to us."
                : "Thank you for your thoughtful pledge."}
            </p>
            {pledged !== null && (
              <Button onClick={() => setBankOpen(true)}>View bank details</Button>
            )}
            <Button asChild variant="outline">
              <Link to="/">Back to the invitation</Link>
            </Button>
          </div>
        ) : null}
        <Dialog open={bankOpen} onOpenChange={setBankOpen}>
          <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-sm border-gold/30 bg-card motion-reduce:animate-none">
            <DialogTitle className="font-serif text-3xl font-normal text-wine">
              A Little Blessing
            </DialogTitle>
            <DialogDescription>Thank you for thinking of our next chapter.</DialogDescription>
            {pledged !== null && (
              <section
                role="status"
                className="space-y-5 py-3 text-center"
              >
                <p>
                  To send your gift of <strong>{naira(pledged)}</strong>, please use the details
                  below.
                </p>
                <dl className="grid gap-y-2 border-y border-gold/25 py-7">
                  <dt className="mt-3 text-xs uppercase tracking-widest text-foreground/65">
                    Bank
                  </dt>
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
                <Button className="w-full" onClick={() => setBankOpen(false)}>Done</Button>
              </section>
            )}
          </DialogContent>
        </Dialog>
        {!wishDone && pledged === null && (
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
                value={identityValues.fullName}
                onChange={(e) => setIdentityValues((v) => ({ ...v, fullName: e.target.value }))}
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
                value={identityValues.email}
                onChange={(e) => setIdentityValues((v) => ({ ...v, email: e.target.value }))}
                className="mt-3 h-12 bg-transparent"
              />
            </div>
            <div>
              <Label htmlFor="gift-kind">How would you like to share your love?</Label>
              <select
                id="gift-kind"
                value={kind}
                required
                disabled={busy}
                onChange={(e) => {
                  setKind(e.target.value);
                  setError("");
                  request.current = null;
                }}
                className="mt-3 h-12 w-full rounded-md border border-input bg-transparent px-3"
              >
                <option value="" disabled>
                  Choose an option
                </option>
                <option value="wish">A prayer or kind wish</option>
                <option value="items">Gift registry</option>
                <option value="money">A Little Blessing · bank transfer</option>
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
            {kind === "wish" && (
              <div>
                <Label htmlFor="gift-wish">Your message</Label>
                <Textarea
                  id="gift-wish"
                  name="wish"
                  required
                  maxLength={3000}
                  className="mt-3 min-h-36 bg-transparent"
                  placeholder="A prayer, encouragement, or a few words of love…"
                />
              </div>
            )}
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button disabled={busy} className="h-12 w-full bg-wine text-cream hover:bg-wine-deep">
              {busy
                ? "Saving…"
                : kind === "items"
                  ? "Select a gift"
                  : kind === "wish"
                    ? "Send your wish"
                    : kind === "money"
                      ? "Submit pledge"
                      : "Continue"}
            </Button>
          </form>
        )}
      </div>
    </GiftPage>
  );
}
