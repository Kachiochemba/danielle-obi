import { useState } from "react";
import { CalendarDays, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { wedding } from "@/data/wedding";
import { CulturalDivider, iconMap, Reveal, SectionTitle } from "./shared";
import ceremonyImage from "@/assets/danielle-obi-hands.jpg";

const calendarTitle = `${wedding.couple.bride} & ${wedding.couple.groom}: Wedding Ceremony`;
const calendarLocation = `${wedding.venue.name}, ${wedding.venue.short}`;
const calendarDescription = "Wedding ceremony at 12:00 PM. Guest arrival from 11:00 AM.";

function downloadAppleCalendar() {
  const text = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Danielle and Obi//Wedding//EN", "BEGIN:VEVENT", `DTSTART:${wedding.date.start}`, `DTEND:${wedding.date.end}`, `SUMMARY:${calendarTitle}`, `LOCATION:${calendarLocation}`, `DESCRIPTION:${calendarDescription}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  const url = URL.createObjectURL(new Blob([text], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a"); a.href = url; a.download = "danielle-obi-wedding.ics"; a.click(); URL.revokeObjectURL(url);
}

function openGoogleCalendar() {
  const params = new URLSearchParams({ action: "TEMPLATE", text: calendarTitle, dates: `${wedding.date.start}/${wedding.date.end}`, details: calendarDescription, location: calendarLocation });
  window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, "_blank", "noopener,noreferrer");
}

function calendarDevice(): "apple" | "android" | "desktop" {
  const userAgent = navigator.userAgent;
  const appleMobile = /iPhone|iPad|iPod/i.test(userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (appleMobile) return "apple";
  if (/Android/i.test(userAgent)) return "android";
  return "desktop";
}

function CalendarAction() {
  const [desktopChoice, setDesktopChoice] = useState(false);
  const chooseCalendar = () => {
    const device = calendarDevice();
    if (device === "apple") downloadAppleCalendar();
    else if (device === "android") openGoogleCalendar();
    else setDesktopChoice(true);
  };
  return <Popover open={desktopChoice} onOpenChange={setDesktopChoice}>
    <PopoverTrigger asChild><Button onClick={chooseCalendar} className="shimmer mt-6 h-13 w-full rounded-sm bg-wine text-cream transition-transform duration-200 hover:bg-wine/90 active:scale-[0.99]"><Download /> ADD TO CALENDAR</Button></PopoverTrigger>
    <PopoverContent align="center" className="w-[min(22rem,calc(100vw-2.5rem))] rounded-sm border-gold/30 bg-card p-4">
      <p className="font-serif text-xl text-wine">Choose your calendar</p>
      <p className="mt-1 text-sm leading-6 text-foreground/65">Add the celebration with all event details included.</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Button type="button" onClick={openGoogleCalendar} className="h-11 rounded-sm bg-wine text-cream hover:bg-wine/90"><CalendarDays /> Google Calendar</Button>
        <Button type="button" variant="outline" onClick={downloadAppleCalendar} className="h-11 rounded-sm border-gold/35 bg-background text-wine"><Download /> Apple Calendar</Button>
      </div>
    </PopoverContent>
  </Popover>;
}

export function Details() {
  return <div className="bg-surface pb-20">
    <div className="relative mx-auto aspect-[4/3] max-h-[560px] w-full overflow-hidden">
      <img src={ceremonyImage} alt="Danielle and Obi forehead to forehead on their wedding day" loading="lazy" width={1066} height={1280} className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-image-shade" /><p className="absolute inset-x-5 bottom-10 text-center font-serif text-3xl italic text-cream">Two Hearts, One Throne</p>
    </div>
    <div className="mx-auto max-w-3xl px-5 pt-16 md:px-8 md:pt-20">
      <Reveal><SectionTitle eyebrow="THE CELEBRATION" title="Wedding Details" subtitle="Everything you need to know" /></Reveal>
      <div className="grid gap-3 md:grid-cols-2">{wedding.details.map((item, i) => { const Icon = iconMap[item.icon]; return <Reveal key={item.label} delay={i * 0.09}><article className="detail-card flex min-h-40 gap-4 border border-gold/25 bg-card p-5"><Icon className="mt-1 size-5 shrink-0 text-gold" strokeWidth={1.25}/><div><p className="eyebrow text-muted-label">{item.label}</p><h3 className="mt-3 font-serif text-xl leading-snug text-wine">{item.title}</h3><p className="mt-2 text-sm italic text-muted-foreground">{item.note}</p></div></article></Reveal>})}</div>
      <CalendarAction />
      <CulturalDivider />
      <Reveal><SectionTitle eyebrow="WHAT TO WEAR" title="Strictly Black Tie" subtitle={wedding.dressCode.subtitle} /></Reveal>
      <div className="mt-8 grid grid-cols-4 gap-3">{wedding.dressCode.swatches.map((s, i) => <Reveal className="text-center" key={s.name} delay={i * 0.1}><div className="mx-auto aspect-square max-w-16 rounded-full border-4 border-card shadow-sm transition-transform duration-300 hover:scale-105" style={{ backgroundColor: s.hex }} /><p className="mt-3 text-xs font-semibold text-wine">{s.name}</p></Reveal>)}</div>
      <p className="mx-auto mt-8 max-w-xl text-center font-serif italic leading-7 text-foreground/70">{wedding.dressCode.note}</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2"><article className="border-l-2 border-gold bg-card p-5"><p className="eyebrow text-muted-label">WOMEN</p><p className="mt-3 font-serif text-lg leading-7 text-wine">{wedding.dressCode.ladies}</p></article><article className="border-l-2 border-gold bg-card p-5"><p className="eyebrow text-muted-label">MEN</p><p className="mt-3 font-serif text-lg leading-7 text-wine">{wedding.dressCode.gentlemen}</p></article></div>
      <p className="mt-8 text-center text-sm font-medium text-wine">{wedding.dressCode.closing}</p>
    </div>
  </div>;
}
