import { motion } from "framer-motion";
import { wedding } from "@/data/wedding";
import { cascade, cascadeStep, easeOut, CulturalDivider } from "./shared";

export function InvitationCard({ ready }: { ready: boolean }) {
  const step = (index: number) => ({
    variants: cascade,
    initial: "hidden" as const,
    animate: ready ? ("shown" as const) : ("hidden" as const),
    transition: cascadeStep(index),
  });
  return <section id="invitation" className="bg-background px-5 py-14 md:py-20">
    <div className="invitation-card mx-auto max-w-lg border border-gold/35 px-6 py-12 text-center shadow-invitation md:px-12">
      <motion.div className="mx-auto mb-8 h-8 w-px origin-top bg-gold" initial={{ scaleY: 0 }} animate={{ scaleY: ready ? 1 : 0 }} transition={{ duration: 0.7, ease: easeOut }} />
      <motion.p className="eyebrow text-muted-label" {...step(0)}>{wedding.invitation.eyebrow}</motion.p>
      <motion.h1 className="mt-7 font-script text-7xl leading-none text-wine" {...step(1)}>{wedding.invitation.welcome}</motion.h1>
      <motion.p className="mt-4 font-serif text-lg italic text-gold" {...step(2)}>{wedding.invitation.subtitle}</motion.p>
      <motion.p className="mx-auto mt-7 max-w-xs text-sm leading-7 text-foreground/75" {...step(3)}>{wedding.invitation.body}</motion.p>
      <motion.p className="mt-8 font-script text-6xl leading-[1.05] text-wine" {...step(4)}>{wedding.couple.bride}<br/><span className="text-4xl text-gold">&</span><br/>{wedding.couple.groom}</motion.p>
      <motion.div {...step(5)}><CulturalDivider /></motion.div>
      <motion.p className="eyebrow leading-6 text-wine" {...step(6)}>{wedding.date.display}</motion.p>
      <motion.p className="mt-3 font-serif text-base italic text-foreground/70" {...step(7)}>{wedding.venue.short}</motion.p>
    </div>
  </section>;
}
