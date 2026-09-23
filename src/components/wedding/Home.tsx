import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { EnvelopeGate, type GatePhase } from "./EnvelopeGate";
import { InvitationCard } from "./InvitationCard";
import { Details } from "./Details";
import { Story } from "./Story";
import { Venue } from "./Venue";
import { Rsvp } from "./Rsvp";
import { Gifts } from "./Gifts";
import { GateClose } from "./CloseInvitation";
import { closeDuration, closingTiming, revealTiming, useNavVisibility } from "./shared";

function resetScroll() {
  const root = document.documentElement;
  const previousBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = "auto";
  window.scrollTo(0, 0);
  root.scrollTop = 0;
  document.body.scrollTop = 0;
  window.requestAnimationFrame(() => { root.style.scrollBehavior = previousBehavior; });
}

export function Home() {
  const [phase, setPhase] = useState<GatePhase>("folded");
  const [sequenceId, setSequenceId] = useState(0);
  const reduceMotion = useReducedMotion();
  const sealRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const hasOpened = useRef(false);
  const { setHidden } = useNavVisibility();

  useEffect(() => { setHidden(phase !== "open"); }, [phase, setHidden]);
  useEffect(() => () => setHidden(false), [setHidden]);
  useEffect(() => { document.body.style.overflow = phase === "open" ? "" : "hidden"; return () => { document.body.style.overflow = ""; }; }, [phase]);
  useEffect(() => { if (phase === "folded" && hasOpened.current) window.requestAnimationFrame(() => sealRef.current?.focus({ preventScroll: true })); }, [phase]);

  const toggleGate = () => {
    if (phase === "folded") { hasOpened.current = true; setSequenceId(id => id + 1); setPhase(reduceMotion ? "open" : "opening"); }
    else if (phase === "opening") setPhase(reduceMotion ? "folded" : "closing");
  };
  const closeGate = () => {
    if (phase !== "open" && phase !== "opening") return;
    resetScroll();
    if (phase === "open") setSequenceId(id => id + 1);
    if (reduceMotion) { setPhase("folded"); window.requestAnimationFrame(() => sealRef.current?.focus({ preventScroll: true })); }
    else setPhase("closing");
  };
  const finishSequence = () => {
    if (phase === "opening") {
      setPhase("open");
      const target = window.location.hash.slice(1) || "invitation";
      window.requestAnimationFrame(() => document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
    if (phase === "closing") { setPhase("folded"); resetScroll(); window.requestAnimationFrame(() => { resetScroll(); sealRef.current?.focus({ preventScroll: true }); }); }
  };

  useEffect(() => {
    if (phase !== "opening" && phase !== "closing") return;
    const duration = phase === "opening" ? revealTiming.total : closeDuration;
    const timer = window.setTimeout(finishSequence, duration * 1000);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "open") return;
    closeRef.current?.focus({ preventScroll: true });
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") closeGate(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [phase]);

  const revealed = phase === "open" || phase === "opening";
  const closeAvailable = phase === "opening" || phase === "open";
  const { delay, duration } = revealTiming.card;
  const closeTransition = closingTiming(delay, duration);
  return <main className="overflow-clip pb-28 md:pb-10 md:pt-16">
    <AnimatePresence>{phase !== "open" && <EnvelopeGate key={`gate-${sequenceId}`} phase={phase} onToggle={toggleGate} sealRef={sealRef}/>}</AnimatePresence>
    <motion.div
      id="invitation-content"
      animate={{ opacity: revealed ? 1 : 0, scale: revealed ? 1 : 1.015, y: revealed ? 0 : 10 }}
      transition={{
        duration: reduceMotion ? 0 : phase === "closing" ? closeTransition.duration : duration,
        delay: phase === "opening" ? delay : phase === "closing" ? closeTransition.delay : 0,
        ease: [0.22, 0.8, 0.24, 1],
      }}
      aria-hidden={phase !== "open"}
      inert={phase !== "open" ? true : undefined}
    >
      <InvitationCard ready={phase === "open"}/>
      <section id="details" className="scroll-mt-16"><Details /></section>
      <section id="story" className="scroll-mt-16"><Story /></section>
      <section id="venue" className="scroll-mt-16"><Venue /></section>
      <section id="rsvp" className="scroll-mt-16"><Rsvp /></section>
      <section id="gifts" className="scroll-mt-16"><Gifts /></section>
    </motion.div>
    {closeAvailable && <GateClose onClose={closeGate} buttonRef={closeRef} />}
  </main>;
}
