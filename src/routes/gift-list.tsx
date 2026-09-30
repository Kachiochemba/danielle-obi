import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { GiftPage } from "@/components/wedding/GiftPage";
import { Button } from "@/components/ui/button";
import { getGiftCatalog, submitGift } from "@/lib/gifts.functions";
import { giftIdentitySchema, naira } from "@/lib/gifts.shared";
export const Route = createFileRoute("/gift-list")({
  head: () => ({ meta: [{ title: "Choose a gift | Danielle & Obi" }] }),
  component: GiftList,
});
function GiftList() {
  const [identity, setIdentity] = useState<{ fullName: string; email: string } | null>(null);
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ id: string; name: string }[] | null>(null);
  const request = useRef<string | null>(null);
  const get = useServerFn(getGiftCatalog);
  const send = useServerFn(submitGift);
  const catalog = useQuery({
    queryKey: ["gift-catalog"],
    queryFn: () => get(),
    refetchInterval: 15000,
  });
  useEffect(() => {
    try {
      const parsed = giftIdentitySchema.safeParse(
        JSON.parse(sessionStorage.getItem("gift-identity") || "null"),
      );
      if (parsed.success) setIdentity(parsed.data);
    } catch {}
    setReady(true);
  }, []);
  async function reserve() {
    if (!identity || busy || !selected.length) return;
    setBusy(true);
    setError("");
    try {
      request.current ??= crypto.randomUUID();
      const result = await send({
        data: { ...identity, requestId: request.current, kind: "items", items: selected },
      });
      if (result.ok) {
        setDone(result.items);
        sessionStorage.removeItem("gift-identity");
      } else {
        setError(result.message);
        await catalog.refetch();
      }
    } catch {
      setError("We could not confirm your selection. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  const gifts = catalog.data ?? [];
  return (
    <GiftPage
      title="For our new home"
      subtitle="A few things we would love. Choose one or more gifts."
      back="/gifts"
    >
      <div className="mx-auto max-w-6xl">
        {done ? (
          <section
            role="status"
            className="mx-auto max-w-xl space-y-5 border border-gold/30 bg-card p-8 text-center"
          >
            <h2 className="font-serif text-3xl text-wine">Thank you, with love</h2>
            <p>You have reserved {done.map((i) => i.name).join(", ")} for Danielle & Obi.</p>
            <p className="text-sm">Please arrange purchase and delivery with Danielle & Obi.</p>
            <ul className="space-y-3">
              {done.map((item) => {
                const g = gifts.find((g) => g.id === item.id);
                return (
                  <li key={item.id}>
                    {g && (
                      <a
                        href={g.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-wine underline"
                      >
                        View {item.name} on Jumia
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
            <Button asChild>
              <Link to="/">Back to the invitation</Link>
            </Button>
          </section>
        ) : !ready ? (
          <p role="status">Loading…</p>
        ) : !identity ? (
          <p className="text-center">
            Please{" "}
            <Link to="/gifts" className="text-wine underline">
              enter your name and email
            </Link>{" "}
            before choosing a gift.
          </p>
        ) : (
          <>
            {catalog.isPending ? (
              <p role="status">Loading available gifts…</p>
            ) : catalog.isError ? (
              <div role="alert">
                We could not load gift availability.{" "}
                <Button variant="outline" onClick={() => catalog.refetch()}>
                  Try again
                </Button>
              </div>
            ) : (
              <div className="grid gap-7 sm:grid-cols-2 lg:gap-9 lg:grid-cols-3">
                {gifts.map((g) => {
                  const checked = selected.includes(g.id);
                  return (
                    <article
                      key={g.id}
                      className={`flex flex-col overflow-hidden border bg-card ${g.reserved ? "border-border opacity-55" : "border-gold/30"} ${checked && !g.reserved ? "ring-2 ring-wine" : ""}`}
                    >
                      <img
                        src={g.image}
                        alt={g.model}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className={`h-60 w-full bg-white object-contain p-7 ${g.reserved ? "grayscale" : ""}`}
                      />
                      <div className="flex flex-1 flex-col gap-4 p-6">
                        <h2 className="font-serif text-2xl text-wine">{g.name}</h2>
                        <p className="text-sm leading-6 text-foreground/75">{g.description}</p>
                        <p className="font-semibold text-wine">{naira(g.price)}</p>
                        <a
                          href={g.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-wine underline"
                        >
                          View on Jumia
                        </a>
                        <label
                          className={`mt-2 flex min-h-12 items-center gap-3 rounded-md border p-3 ${g.reserved ? "cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          <input
                            type="checkbox"
                            aria-label={`Select ${g.name.toLowerCase()}`}
                            checked={checked && !g.reserved}
                            disabled={g.reserved || busy}
                            onChange={(e) =>
                              setSelected((ids) =>
                                e.target.checked ? [...ids, g.id] : ids.filter((id) => id !== g.id),
                              )
                            }
                            className="size-5 accent-wine"
                          />
                          {g.reserved ? "Reserved" : checked ? "Selected" : "Choose this gift"}
                        </label>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
            <p className="mt-8 text-center text-xs leading-6 text-foreground/65">
              Prices are indicative. See Jumia for current prices and delivery.
            </p>
            {selected.length > 0 && (
              <div className="sticky bottom-4 z-20 mt-10 border border-gold/30 bg-card/95 p-5 shadow-sm backdrop-blur sm:p-6">
                {error && (
                  <p role="alert" className="mb-3 text-sm text-destructive">
                    {error}
                  </p>
                )}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p>
                    {selected.filter((id) => gifts.some((g) => g.id === id && !g.reserved)).length}{" "}
                    selected
                  </p>
                  <Button
                    disabled={
                      busy ||
                      !selected.length ||
                      catalog.isError ||
                      selected.some((id) => gifts.some((g) => g.id === id && g.reserved))
                    }
                    onClick={reserve}
                    className="bg-wine text-cream hover:bg-wine-deep"
                  >
                    {busy ? "Reserving…" : "Reserve gifts"}
                  </Button>
                </div>
                {selected.some((id) => gifts.some((g) => g.id === id && g.reserved)) && (
                  <Button
                    variant="link"
                    onClick={() =>
                      setSelected((ids) =>
                        ids.filter((id) => gifts.some((g) => g.id === id && !g.reserved)),
                      )
                    }
                  >
                    Remove unavailable gifts from selection
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </GiftPage>
  );
}

