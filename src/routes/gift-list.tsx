import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
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
    <main className="min-h-screen bg-background px-5 py-10">
      <div className="mx-auto max-w-5xl">
        <Link to="/gifts" className="text-sm text-wine underline">
          Back to gift registry
        </Link>
        <header className="my-9 text-center">
          <p className="eyebrow text-wine">FOR OUR NEW HOME</p>
          <h1 className="mt-2 font-serif text-5xl text-wine">Choose a little joy</h1>
          <p className="mx-auto mt-4 max-w-xl leading-7">
            Choose one or more gifts. Once you submit, we will reserve them in your name so another
            guest does not choose the same gift.
          </p>
        </header>
        {done ? (
          <section
            role="status"
            className="mx-auto max-w-xl space-y-5 border border-gold/30 bg-card p-8 text-center"
          >
            <h2 className="font-serif text-3xl text-wine">Thank you for your thoughtful gift!</h2>
            <p>You have reserved {done.map((i) => i.name).join(", ")} for Danielle & Obi.</p>
            <p className="text-sm">
              Your selection has been shared with the couple. Please arrange purchase and delivery
              with them. Reserving here does not place a Jumia order.
            </p>
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
            <p className="mb-5 text-center text-sm">
              Choosing for {identity.fullName}. Jumia prices checked 30 September 2026; prices and
              stock may change. Delivery is extra.
            </p>
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
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {gifts.map((g) => {
                  const checked = selected.includes(g.id);
                  return (
                    <article
                      key={g.id}
                      className={`flex flex-col overflow-hidden rounded-md border bg-card ${g.reserved ? "border-border opacity-55" : "border-gold/30"} ${checked && !g.reserved ? "ring-2 ring-wine" : ""}`}
                    >
                      <img
                        src={g.image}
                        alt={g.model}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className={`h-56 w-full bg-white object-contain p-4 ${g.reserved ? "grayscale" : ""}`}
                      />
                      <div className="flex flex-1 flex-col gap-3 p-5">
                        <h2 className="font-serif text-2xl text-wine">{g.name}</h2>
                        <p className="text-sm leading-6">{g.description}</p>
                        <p className="font-semibold text-wine">
                          {naira(g.price)} <span className="text-xs font-normal">estimated</span>
                        </p>
                        <a
                          href={g.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-wine underline"
                        >
                          View details on Jumia
                        </a>
                        <label
                          className={`mt-auto flex min-h-12 items-center gap-3 rounded-md border p-3 ${g.reserved ? "cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          <input
                            type="checkbox"
                            checked={checked && !g.reserved}
                            disabled={g.reserved || busy}
                            onChange={(e) =>
                              setSelected((ids) =>
                                e.target.checked ? [...ids, g.id] : ids.filter((id) => id !== g.id),
                              )
                            }
                            className="size-5 accent-wine"
                          />
                          {g.reserved ? "Already reserved" : `Select ${g.name.toLowerCase()}`}
                        </label>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
            <div className="sticky bottom-0 mt-6 rounded-md border border-gold/30 bg-card p-4 shadow-lg">
              {error && (
                <p role="alert" className="mb-3 text-sm text-destructive">
                  {error}
                </p>
              )}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p>
                  {selected.filter((id) => gifts.some((g) => g.id === id && !g.reserved)).length}{" "}
                  gift(s) selected
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
                  {busy ? "Reserving…" : "Submit selected gifts"}
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
          </>
        )}
      </div>
    </main>
  );
}
