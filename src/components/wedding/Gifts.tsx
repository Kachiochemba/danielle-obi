import { useRef, useState, type FormEvent } from "react";
import { Banknote, Gift, Heart } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { submitGift } from "@/lib/gifts.functions";
import { giftBank, giftIdentitySchema, giftSubmissionSchema, naira } from "@/lib/gifts.shared";
import { wedding } from "@/data/wedding";
import { CulturalDivider, Reveal, SectionTitle } from "./shared";

const icons = { bank: Banknote, gift: Gift, heart: Heart };
type GiftMode = keyof typeof icons;

export function Gifts() {
  const [mode, setMode] = useState<GiftMode | null>(null);
  const [busy, setBusy] = useState(false);
  const trigger = useRef<HTMLButtonElement | null>(null);
  return (
    <div className="bg-background px-5 py-20">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <SectionTitle
            eyebrow="WITH LOVE"
            title="Gifts"
            subtitle="Your presence means everything"
          />
        </Reveal>
        <div className="grid gap-5 md:grid-cols-3">
          {wedding.gifts.map((item) => {
            const Icon = icons[item.icon];
            return (
              <Reveal key={item.title}>
                <button
                  type="button"
                  aria-haspopup="dialog"
                  onClick={(e) => {
                    trigger.current = e.currentTarget;
                    setMode(item.icon);
                  }}
                  className="group h-full w-full border border-gold/25 bg-card px-6 py-8 text-center transition-colors hover:border-gold hover:bg-cream/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine focus-visible:ring-offset-4"
                >
                  <Icon className="mx-auto size-6 text-gold" strokeWidth={1.25} />
                  <h3 className="mt-5 font-serif text-xl text-wine">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-foreground/65">{item.text}</p>
                </button>
              </Reveal>
            );
          })}
        </div>
        <CulturalDivider />
        <p className="text-center font-script text-5xl text-wine">
          {wedding.couple.bride} &amp; {wedding.couple.groom}
        </p>
      </div>
      <Dialog
        open={mode !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setMode(null);
        }}
      >
        <DialogContent
          className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-sm border-gold/30 bg-card p-7 sm:p-10"
          onEscapeKeyDown={(e) => {
            e.stopPropagation();
            if (busy) e.preventDefault();
          }}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            trigger.current?.focus({ preventScroll: true });
          }}
        >
          {mode && (
            <GiftForm
              key={mode}
              mode={mode}
              busy={busy}
              setBusy={setBusy}
              close={() => setMode(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GiftForm({
  mode,
  busy,
  setBusy,
  close,
}: {
  mode: GiftMode;
  busy: boolean;
  setBusy: (value: boolean) => void;
  close: () => void;
}) {
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [amount, setAmount] = useState(0);
  const request = useRef<string | null>(null);
  const send = useServerFn(submitGift);
  const navigate = useNavigate();
  const title =
    mode === "bank" ? "A Little Blessing" : mode === "gift" ? "Gift Registry" : "Your Good Wishes";
  const subtitle =
    mode === "bank"
      ? "A little something for our next chapter."
      : mode === "gift"
        ? "Choose something special for our new home."
        : "A few words we will treasure.";
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setError("");
    const form = new FormData(e.currentTarget);
    const identity = {
      fullName: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
    };
    if (mode === "gift") {
      const valid = giftIdentitySchema.safeParse(identity);
      if (!valid.success) {
        setError("Please enter your name and a valid email address.");
        return;
      }
      setBusy(true);
      try {
        sessionStorage.setItem("gift-identity", JSON.stringify(valid.data));
        await navigate({ to: "/gift-list" });
      } catch {
        setError("We could not open the gift list. Please try again.");
      } finally {
        setBusy(false);
      }
      return;
    }
    request.current ??= crypto.randomUUID();
    const parsed = giftSubmissionSchema.safeParse(
      mode === "bank"
        ? {
            requestId: request.current,
            fullName: identity.fullName,
            kind: "money",
            amount: Number(form.get("amount")),
          }
        : {
            ...identity,
            requestId: request.current,
            kind: "wish",
            wish: String(form.get("wish") ?? ""),
          },
    );
    if (!parsed.success) {
      setError("Please check the form and try again.");
      return;
    }
    setBusy(true);
    try {
      const result = await send({ data: parsed.data });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setAmount(Number(result.amount));
      setDone(true);
    } catch {
      setError("We could not confirm your submission. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <DialogTitle className="pr-4 text-center font-serif text-3xl font-normal leading-tight text-wine">
        {done ? "Thank you, with love" : title}
      </DialogTitle>
      <DialogDescription className="text-center text-sm leading-7 text-foreground/70">
        {done
          ? mode === "bank"
            ? `To send your gift of ${naira(amount)}, please use the details below.`
            : "Your kind words mean so much to us."
          : subtitle}
      </DialogDescription>
      {done ? (
        <div role="status" className="mt-3 space-y-6 text-center">
          {mode === "bank" && (
            <>
              <dl className="space-y-2 border-y border-gold/25 py-6">
                <dt className="text-xs uppercase tracking-widest text-foreground/65">
                  {giftBank.bank}
                </dt>
                <dd className="select-all font-serif text-4xl tracking-wide text-wine">
                  {giftBank.number}
                </dd>
                <dd className="text-sm">{giftBank.name}</dd>
              </dl>
              <p className="text-xs leading-6 text-foreground/70">
                Please use your name as the transfer reference.
              </p>
            </>
          )}
          <Button className="h-12 w-full" onClick={close}>
            Done
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-4 space-y-6">
          <div>
            <Label htmlFor="gift-popup-name">Full name</Label>
            <Input
              id="gift-popup-name"
              name="name"
              autoComplete="name"
              required
              minLength={2}
              maxLength={120}
              className="mt-2 h-12 bg-transparent"
            />
          </div>
          {mode !== "bank" && (
            <div>
              <Label htmlFor="gift-popup-email">Email</Label>
              <Input
                id="gift-popup-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={255}
                className="mt-2 h-12 bg-transparent"
              />
            </div>
          )}
          {mode === "bank" && (
            <div>
              <Label htmlFor="gift-popup-amount">Amount (₦)</Label>
              <Input
                id="gift-popup-amount"
                name="amount"
                type="number"
                min="0.01"
                max="100000000"
                step="0.01"
                required
                className="mt-2 h-12 bg-transparent"
              />
            </div>
          )}
          {mode === "heart" && (
            <div>
              <Label htmlFor="gift-popup-wish">Your wish</Label>
              <Textarea
                id="gift-popup-wish"
                name="wish"
                required
                maxLength={3000}
                className="mt-2 min-h-32 bg-transparent"
                placeholder="A little love for Danielle & Obi…"
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
              ? "Please wait…"
              : mode === "bank"
                ? "Submit pledge"
                : mode === "gift"
                  ? "Select a gift"
                  : "Submit wish"}
          </Button>
        </form>
      )}
    </>
  );
}
