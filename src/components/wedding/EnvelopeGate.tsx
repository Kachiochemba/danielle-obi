import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { wedding } from "@/data/wedding";
import { closeDuration, closeTimeScale, closingTiming, easeOut, revealTiming } from "./shared";
import collagePhoto1 from "@/assets/gallery/gallery-1.jpg";
import collagePhoto2 from "@/assets/gallery/gallery-3.jpg";
import collagePhoto3 from "@/assets/gallery/gallery-5.jpg";

export type GatePhase = "folded" | "opening" | "open" | "closing";

const particles = [
  { x: -108, lift: 104, drift: -11, delay: 0.02, kind: "dash", tone: "gold" },
  { x: -82, lift: 146, drift: 18, delay: 0.08, kind: "dot", tone: "cream" },
  { x: -62, lift: 92, drift: -8, delay: 0.14, kind: "petal", tone: "wine" },
  { x: -39, lift: 160, drift: 16, delay: 0.04, kind: "dash", tone: "wine" },
  { x: -18, lift: 120, drift: -4, delay: 0.18, kind: "dot", tone: "gold" },
  { x: 8, lift: 172, drift: 12, delay: 0.1, kind: "petal", tone: "cream" },
  { x: 28, lift: 112, drift: -10, delay: 0.2, kind: "dot", tone: "wine" },
  { x: 48, lift: 154, drift: 13, delay: 0.05, kind: "dash", tone: "gold" },
  { x: 72, lift: 98, drift: -6, delay: 0.16, kind: "petal", tone: "wine" },
  { x: 96, lift: 132, drift: 15, delay: 0.11, kind: "dot", tone: "cream" },
  { x: 118, lift: 82, drift: 8, delay: 0.22, kind: "dash", tone: "gold" },
  { x: -126, lift: 72, drift: -14, delay: 0.19, kind: "dot", tone: "wine" },
  { x: 3, lift: 102, drift: 3, delay: 0.26, kind: "dash", tone: "gold" },
  { x: 132, lift: 64, drift: 12, delay: 0.25, kind: "dot", tone: "gold" },
] as const;

const particleAnimations = particles.map((particle, index) => {
  const rotation = index % 2 ? 78 : -86;
  const opening = {
    opacity: [0, 1, 0.82, 0],
    x: [0, particle.x * 0.72, particle.x, particle.x + particle.drift],
    y: [0, -particle.lift * 0.72, -particle.lift, -particle.lift + 34],
    scale: [0.65, 1, 1, 0.75],
    rotate: [0, rotation * 0.49, rotation * 0.75, rotation],
  };
  return {
    ...particle,
    rotation,
    opening,
    closing: {
      opacity: [...opening.opacity].reverse(),
      x: [...opening.x].reverse(),
      y: [...opening.y].reverse(),
      scale: [...opening.scale].reverse(),
      rotate: [...opening.rotate].reverse(),
    },
  };
});

/** Slow drifting star points behind the envelope. */
const stars = [
  { left: 6, top: 14, size: 3, dur: 13, delay: 0, tone: "gold" },
  { left: 18, top: 62, size: 2, dur: 17, delay: 1.4, tone: "cream" },
  { left: 27, top: 28, size: 4, dur: 15, delay: 2.6, tone: "gold" },
  { left: 36, top: 84, size: 2, dur: 19, delay: 0.8, tone: "cream" },
  { left: 45, top: 8, size: 3, dur: 14, delay: 3.2, tone: "gold" },
  { left: 54, top: 71, size: 2, dur: 18, delay: 1.1, tone: "gold" },
  { left: 63, top: 34, size: 3, dur: 16, delay: 2.1, tone: "cream" },
  { left: 72, top: 18, size: 2, dur: 20, delay: 0.4, tone: "gold" },
  { left: 81, top: 58, size: 4, dur: 15, delay: 2.9, tone: "gold" },
  { left: 90, top: 30, size: 2, dur: 17, delay: 1.8, tone: "cream" },
  { left: 12, top: 41, size: 2, dur: 21, delay: 3.6, tone: "gold" },
  { left: 33, top: 52, size: 2, dur: 16, delay: 0.6, tone: "cream" },
  { left: 68, top: 88, size: 3, dur: 18, delay: 2.4, tone: "gold" },
  { left: 88, top: 78, size: 2, dur: 14, delay: 1.6, tone: "cream" },
  { left: 50, top: 47, size: 2, dur: 22, delay: 4.1, tone: "gold" },
  { left: 22, top: 6, size: 2, dur: 19, delay: 2.2, tone: "gold" },
  { left: 60, top: 94, size: 2, dur: 15, delay: 3.8, tone: "cream" },
  { left: 95, top: 8, size: 3, dur: 20, delay: 0.9, tone: "gold" },
] as const;

function StarField() {
  return <div className="starfield pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
    <span className="light-bloom bloom-a" />
    <span className="light-bloom bloom-b" />
    {stars.map((star, i) => <i
      key={i}
      className={`star star-${star.tone}`}
      style={{ left: `${star.left}%`, top: `${star.top}%`, width: star.size, height: star.size, animationDuration: `${star.dur}s`, animationDelay: `-${star.delay}s` }}
    />)}
  </div>;
}

function ribbonTransition(key: "knot" | "loops" | "tails" | "bands", opening: boolean, extra = 0) {
  const { delay, duration } = revealTiming[key];
  const closing = closingTiming(delay, duration);
  return { duration: opening ? duration : closing.duration, delay: (opening ? delay : closing.delay) + (opening ? extra : extra * closeTimeScale), ease: easeOut };
}

function CornerBow({ opening, closing }: { opening: boolean; closing: boolean }) {
  const state = (open: Record<string, number>, shut: Record<string, number>) => ({
    initial: closing ? open : shut,
    animate: opening ? open : shut,
  });
  const stem = state({ opacity: 0, scaleY: 1.08 }, { opacity: 1, scaleY: 1 });
  const leftLoop = state({ opacity: 0, x: -9, y: 7, rotate: -16, scale: 0.8 }, { opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 });
  const rightLoop = state({ opacity: 0, x: 9, y: 7, rotate: 16, scale: 0.8 }, { opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 });
  const leftTail = state({ opacity: 0, x: -7, y: 15 }, { opacity: 1, x: 0, y: 0 });
  const rightTail = state({ opacity: 0, x: 7, y: 15 }, { opacity: 1, x: 0, y: 0 });
  const knot = state({ opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1 });
  return <svg className="corner-bow pointer-events-none absolute z-[6]" viewBox="0 0 120 120" aria-hidden="true">
    <motion.path className="bow-stem" d="M60 52 C 52 70, 44 88, 30 104" {...stem} transition={ribbonTransition("bands", opening)} style={{ originY: 0 }} />
    <motion.path className="bow-tail" d="M58 46 C 50 58, 44 66, 32 74" {...leftTail} transition={ribbonTransition("tails", opening)} />
    <motion.path className="bow-tail" d="M64 46 C 74 56, 82 62, 94 66" {...rightTail} transition={ribbonTransition("tails", opening, 0.02)} />
    <motion.path className="bow-loop" d="M60 42 C 34 18, 16 40, 36 56 C 50 66, 56 54, 60 42 Z" {...leftLoop} transition={ribbonTransition("loops", opening)} style={{ originX: "60px", originY: "42px" }} />
    <motion.path className="bow-loop" d="M60 42 C 86 18, 104 40, 84 56 C 70 66, 64 54, 60 42 Z" {...rightLoop} transition={ribbonTransition("loops", opening, 0.02)} style={{ originX: "60px", originY: "42px" }} />
    <motion.ellipse className="bow-knot" cx="61" cy="44" rx="7" ry="6" {...knot} transition={ribbonTransition("knot", opening)} style={{ originX: "61px", originY: "44px" }} />
  </svg>;
}

function envelopeTransition(key: "stage" | "flap" | "letter" | "collage", opening: boolean, extra = 0) {
  const { delay, duration } = revealTiming[key];
  const closing = closingTiming(delay, duration);
  return {
    duration: opening ? duration : closing.duration,
    delay: (opening ? delay : closing.delay) + (opening ? extra : extra * closeTimeScale),
    ease: [0.4, 0, 0.2, 1] as const,
  };
}

const collagePieces = [
  { key: "lace", open: { x: -6, y: -34, rotate: 0, scale: 1, z: 4 } },
  { key: "photo-a", open: { x: -82, y: -12, rotate: -11, scale: 1, z: 16 } },
  { key: "arch", open: { x: 64, y: -28, rotate: 7, scale: 1, z: 10 } },
  { key: "photo-c", open: { x: 6, y: -40, rotate: 2, scale: 0.92, z: 13 } },
  { key: "photo-b", open: { x: -20, y: 34, rotate: -4, scale: 1, z: 22 } },
  { key: "medallion", open: { x: 86, y: 14, rotate: 5, scale: 1, z: 28 } },
] as const;

function collagePiece(index: number, opening: boolean, closing: boolean) {
  const piece = collagePieces[index]!;
  const shut = { x: 0, y: 10, z: 0, rotate: 0, scale: 0.88, opacity: 0 };
  const open = { ...piece.open, opacity: 1 };
  return {
    initial: closing ? open : shut,
    animate: opening ? open : shut,
    transition: envelopeTransition("collage", opening, opening ? index * 0.035 : 0),
  };
}

export function EnvelopeGate({ phase, onToggle, sealRef }: { phase: GatePhase; onToggle: () => void; sealRef: React.RefObject<HTMLButtonElement | null> }) {
  const opening = phase === "opening";
  const closing = phase === "closing";
  const opened = phase === "open" || opening;
  const moving = opening || closing;
  const headingClosing = closingTiming(revealTiming.heading.delay, revealTiming.heading.duration);
  const cardClosing = closingTiming(revealTiming.card.delay, revealTiming.card.duration);
  const sealClosing = closingTiming(revealTiming.seal.delay, revealTiming.seal.duration);
  const captionClosing = closingTiming(revealTiming.caption.delay, revealTiming.caption.duration);
  const headingSwap = { duration: opening ? revealTiming.heading.duration : headingClosing.duration, delay: opening ? revealTiming.heading.delay : headingClosing.delay, ease: easeOut };
  const gateFade = { duration: opening ? revealTiming.card.duration : cardClosing.duration, delay: opening ? revealTiming.card.delay : cardClosing.delay, ease: easeOut };
  return <motion.section className="gate fixed inset-0 z-50 grid min-h-[100svh] place-items-center overflow-hidden px-5 py-12" aria-label="Wedding invitation opening" initial={closing ? { opacity: 0 } : { opacity: 1 }} animate={{ opacity: opening ? 0 : 1 }} transition={gateFade}>
    <div className="gate-bg absolute inset-0" />
    <div className="scatter" aria-hidden="true" />
    <StarField />
    <div className="relative z-10 flex w-full max-w-sm flex-col items-center text-center">
      <div className="relative h-4 w-full">
        <motion.p className="eyebrow absolute inset-x-0 top-0 text-cream/75" initial={closing ? { opacity: 0 } : false} animate={{ opacity: opened ? 0 : 1 }} transition={headingSwap}>{wedding.gate.closedEyebrow}</motion.p>
        <motion.p className="eyebrow absolute inset-x-0 top-0 text-cream/75" initial={closing ? { opacity: 1 } : false} animate={{ opacity: opened ? 1 : 0 }} transition={headingSwap}>{wedding.gate.openEyebrow}</motion.p>
      </div>
      <p className="mt-5 font-script text-6xl leading-[0.95] text-cream">{wedding.couple.bride} &amp;<br/>{wedding.couple.groom}</p>
      <motion.div className="flat-stage relative mt-9" initial={closing ? { rotateX: -4, rotateY: 3, scale: 1.02 } : false} animate={{ rotateX: opened ? -4 : 0, rotateY: opened ? 3 : 0, scale: opened ? 1.02 : 1 }} transition={envelopeTransition("stage", opening)}>
        <div className="envelope-object absolute inset-x-0 bottom-0" aria-hidden="true">
          <div className="envelope-back absolute inset-0"><div className="envelope-lining absolute inset-0" /></div>
          <motion.div className="env-collage absolute" initial={closing ? { y: -132 } : false} animate={{ y: opened ? -132 : 32 }} transition={envelopeTransition("letter", opening)}>
            <motion.span className="collage-lace" {...collagePiece(0, opening, closing)} />
            <motion.figure className="collage-photo" {...collagePiece(1, opening, closing)}>
              <img src={collagePhoto1} alt="" loading="lazy" width={606} height={809} />
            </motion.figure>
            <motion.div className="collage-arch" {...collagePiece(2, opening, closing)}>
              <span className="font-script text-2xl leading-tight text-wine">{wedding.gate.saveLine}<br/>{wedding.gate.saveWord}</span>
            </motion.div>
            <motion.figure className="collage-photo" {...collagePiece(3, opening, closing)}>
              <img src={collagePhoto2} alt="" loading="lazy" width={635} height={796} />
            </motion.figure>
            <motion.figure className="collage-photo" {...collagePiece(4, opening, closing)}>
              <img src={collagePhoto3} alt="" loading="lazy" width={642} height={800} />
            </motion.figure>
            <motion.div className="collage-medallion" {...collagePiece(5, opening, closing)}>
              <span>{wedding.gate.medallion.map((line) => <span key={line}>{line}</span>)}</span>
            </motion.div>
          </motion.div>
          <motion.div
            className="envelope-flap absolute inset-x-0 top-0"
            initial={closing ? { rotateX: 180, zIndex: 1 } : false}
            animate={opening || phase === "open"
              ? { rotateX: [0, 88, 92, 180], zIndex: [4, 4, 1, 1] }
              : closing
                ? { rotateX: [180, 92, 88, 0], zIndex: [1, 1, 4, 4] }
                : { rotateX: 0, zIndex: 4 }}
            transition={{ ...envelopeTransition("flap", opening), times: [0, 0.49, 0.51, 1] }}
          >
            <div className="envelope-flap-face envelope-flap-front">
              <div className="lace-trim absolute inset-0" />
            </div>
            <div className="envelope-flap-face envelope-flap-back" />
          </motion.div>
          <div className="envelope-pocket absolute inset-0 z-[5]">
            <span className="flat-card-line absolute inset-x-12 bottom-8 h-px" />
          </div>
        </div>
        <CornerBow opening={opening} closing={closing} />
        {moving && <div className="flat-particles pointer-events-none absolute inset-0 z-30" aria-hidden="true">{particleAnimations.map((particle, i) => {
          const particleDelay = particle.delay * revealTiming.particleDelayScale;
          const closingParticle = closingTiming(particleDelay, revealTiming.particleDuration);
          return <motion.i key={i} className={`particle-${particle.kind} particle-${particle.tone}`} initial={closing ? { opacity: 0, x: particle.x + particle.drift, y: -particle.lift + 34, scale: 0.75, rotate: particle.rotation } : { opacity: 0, x: 0, y: 0, scale: 0.65, rotate: 0 }} animate={closing ? particle.closing : particle.opening} transition={{ duration: opening ? revealTiming.particleDuration : closingParticle.duration, delay: opening ? particleDelay : closingParticle.delay, times: [0, 0.32, 0.62, 1], ease: ["easeOut", "easeInOut", "easeIn"] }} />;
        })}</div>}
        <motion.div className="absolute inset-0 z-40 grid place-items-center" initial={closing ? { opacity: 0, scale: 0.92 } : { opacity: 1, scale: 1 }} animate={{ opacity: opening ? 0 : 1, scale: opening ? 0.92 : 1 }} transition={{ duration: opening ? revealTiming.seal.duration : sealClosing.duration, delay: opening ? revealTiming.seal.delay : sealClosing.delay, ease: easeOut }}>
          <span className={`wax-seal font-serif ${phase === "folded" ? "is-inviting" : ""}`} aria-hidden="true">{wedding.gate.monogram}</span>
          <Button ref={sealRef} type="button" variant="ghost" disabled={moving} onClick={onToggle} aria-label="Open wedding invitation" aria-controls="invitation-content" aria-expanded="false" className="seal-hitbox absolute size-24 rounded-full p-0 hover:bg-transparent focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2" />
        </motion.div>
      </motion.div>
      <motion.p className="eyebrow mt-9 text-cream/70" initial={closing ? { opacity: 0 } : false} animate={{ opacity: opened ? 0 : 1 }} transition={{ duration: opening ? revealTiming.caption.duration : captionClosing.duration, delay: opening ? revealTiming.caption.delay : captionClosing.delay, ease: easeOut }}>{wedding.gate.caption}</motion.p>
      <motion.p className="mt-4 font-serif text-sm italic text-cream/55" initial={closing ? { opacity: 1 } : false} animate={{ opacity: opened ? 1 : 0 }} transition={headingSwap}>{wedding.gate.footnote}</motion.p>
    </div>
  </motion.section>;
}
