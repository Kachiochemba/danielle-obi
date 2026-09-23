import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Clock3, Diamond, MapPin, PartyPopper, Shirt } from "lucide-react";
import { PageClose } from "./CloseInvitation";

export const easeOut = [0.16, 1, 0.3, 1] as const;

export const iconMap = { map: MapPin, calendar: CalendarDays, clock: Clock3, party: PartyPopper, shirt: Shirt, diamond: Diamond };

export const revealTiming = {
  total: 3.0,
  // Reveal the keepsake early, hold it, then hand off softly to the invitation.
  card: { delay: 2.2, duration: 0.8 },
  seal: { delay: 0.15, duration: 0.2 },
  caption: { delay: 0.03, duration: 0.18 },
  heading: { delay: 0.15, duration: 0.28 },
  knot: { delay: 0.08, duration: 0.3 },
  loops: { delay: 0.14, duration: 0.4 },
  tails: { delay: 0.24, duration: 0.42 },
  bands: { delay: 0.34, duration: 0.46 },
  stage: { delay: 0.12, duration: 0.42 },
  flap: { delay: 0.34, duration: 0.5 },
  letter: { delay: 0.78, duration: 0.42 },
  collage: { delay: 1.2, duration: 0.38 },
  particleDuration: 2.9,
  particleDelayScale: 0.5,
} as const;

export const closeDuration = 2.8;
export const closeTimeScale = closeDuration / revealTiming.total;

export function reverseDelay(delay: number, duration: number) {
  return revealTiming.total - delay - duration;
}

export function closingTiming(delay: number, duration: number) {
  return {
    delay: reverseDelay(delay, duration) * closeTimeScale,
    duration: duration * closeTimeScale,
  };
}

export const cascade = { hidden: { opacity: 0, y: 16 }, shown: { opacity: 1, y: 0 } };
export const cascadeStep = (index: number) => ({ duration: 0.7, delay: 0.12 + index * 0.13, ease: easeOut });

/** Lets the invitation page hide the site navigation while the envelope plays. */
const NavVisibility = createContext<{ hidden: boolean; setHidden: (value: boolean) => void }>({ hidden: false, setHidden: () => {} });

export function NavVisibilityProvider({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(false);
  return <NavVisibility.Provider value={{ hidden, setHidden }}>{children}</NavVisibility.Provider>;
}

export function useNavVisibility() {
  return useContext(NavVisibility);
}

export function SectionTitle({ eyebrow, title, subtitle, inverse = false }: { eyebrow: string; title: string; subtitle: string; inverse?: boolean }) {
  return <header className="mb-10 text-center">
    <p className="eyebrow text-muted-label">{eyebrow}</p>
    <h1 className={`mt-3 font-serif text-4xl ${inverse ? "text-cream" : "text-wine"}`}>{title}</h1>
    <p className="mt-2 font-serif text-lg italic text-gold">{subtitle}</p>
  </header>;
}

export function CulturalDivider() {
  return <div className="my-10 flex items-center justify-center gap-7 text-gold" aria-hidden="true">
    <span className="divider-line h-px w-14 bg-gold/40" /><span className="text-lg">✦</span><span className="size-1.5 rotate-45 border border-gold" /><span className="text-lg">✦</span><span className="divider-line h-px w-14 bg-gold/40" />
  </div>;
}

export function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => entry?.isIntersecting && node.classList.add("is-visible"), { threshold: 0.12 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} className={`reveal ${className}`} style={delay ? ({ "--reveal-delay": `${delay}s` } as React.CSSProperties) : undefined}>{children}</div>;
}

/** Page wrapper: clears the desktop top bar and the mobile tab bar, and fades in on arrival. */
export function PageShell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <>
    <motion.main
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: easeOut }}
      className={`min-h-svh pb-28 md:pb-10 md:pt-16 ${className}`}
    >{children}</motion.main>
    <PageClose />
  </>;
}
