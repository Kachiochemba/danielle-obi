import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "@tanstack/react-router";
import { CalendarDays, Gift, Heart, MapPin, PenLine, Ticket } from "lucide-react";
import { pages, wedding } from "@/data/wedding";
import { easeOut, useNavVisibility } from "./shared";

const navIcons = { ticket: Ticket, calendar: CalendarDays, heart: Heart, map: MapPin, pen: PenLine, gift: Gift };
const monogram = `${wedding.couple.bride[0]} & ${wedding.couple.groom[0]}`;

export function SiteNav() {
  const pathname = useLocation({ select: (l) => l.pathname });
  if (pathname.startsWith("/admin") || pathname.startsWith("/checkin") || pathname.startsWith("/reset-password")) return null;
  return <GuestNav />;
}

function GuestNav() {
  const { hidden } = useNavVisibility();
  const [active, setActive] = useState("invitation");
  useEffect(() => {
    if (hidden) return;
    const sections = pages.map(({ id }) => document.getElementById(id)).filter((section): section is HTMLElement => Boolean(section));
    const update = () => {
      const marker = window.innerHeight * 0.34;
      let current = sections[0]?.id ?? "invitation";
      for (const section of sections) if (section.getBoundingClientRect().top <= marker) current = section.id;
      setActive(current);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [hidden]);
  const goTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", id === "invitation" ? `${location.pathname}${location.search}` : `#${id}`);
  };
  return <AnimatePresence>{!hidden && <>
    <motion.header
      key="top-nav"
      aria-label="Site navigation"
      initial={{ y: -64, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -64, opacity: 0 }}
      transition={{ duration: 0.45, ease: easeOut }}
      className="top-nav fixed inset-x-0 top-0 z-40 hidden bg-wine/95 text-cream backdrop-blur md:block"
    >
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <button type="button" onClick={() => goTo("invitation")} className="font-script text-2xl text-cream" aria-label="Go to invitation">{monogram}</button>
        <nav className="flex items-center gap-7">
          {pages.map(({ id, label }) => <button
            key={id}
            type="button"
            onClick={() => goTo(id)}
            aria-current={active === id ? "location" : undefined}
            className={`nav-link relative py-2 text-xs font-semibold uppercase tracking-[0.16em] transition-colors hover:text-cream ${active === id ? "is-current text-gold" : "text-cream/65"}`}
          >{label}</button>)}
        </nav>
      </div>
    </motion.header>
    <motion.nav
      key="bottom-nav"
      aria-label="Invitation pages"
      initial={{ y: 72 }} animate={{ y: 0 }} exit={{ y: 72 }}
      transition={{ duration: 0.45, ease: easeOut }}
      className="bottom-nav fixed inset-x-0 bottom-0 z-40 mx-auto bg-wine text-cream shadow-nav md:hidden"
    >
      <div className="mx-auto grid max-w-2xl grid-cols-6">
        {pages.map(({ id, label, icon }) => {
          const Icon = navIcons[icon];
          return <button
            key={id}
            type="button"
            onClick={() => goTo(id)}
            aria-current={active === id ? "location" : undefined}
            className={`relative flex min-w-0 flex-col items-center gap-1 px-1 pb-[max(.55rem,env(safe-area-inset-bottom))] pt-3 text-[9px] transition-colors ${active === id ? "tab-current text-gold" : "text-cream/60"}`}
          >
            <Icon className="size-4" strokeWidth={1.4} />
            <span className="truncate">{label}</span>
          </button>;
        })}
      </div>
    </motion.nav>
  </>}</AnimatePresence>;
}
