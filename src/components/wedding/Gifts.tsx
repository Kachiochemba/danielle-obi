import { Banknote, Gift, Heart } from "lucide-react";
import { wedding } from "@/data/wedding";
import { CulturalDivider, Reveal, SectionTitle } from "./shared";

const icons = { bank: Banknote, gift: Gift, heart: Heart };

export function Gifts() {
  return <div className="bg-background px-5 py-20">
    <div className="mx-auto max-w-3xl">
      <Reveal><SectionTitle eyebrow="WITH LOVE" title="Gifts" subtitle="Your presence means everything" /></Reveal>
      <p className="mx-auto -mt-4 mb-10 max-w-lg text-center font-serif text-lg leading-8 text-foreground/70">Your presence is the greatest gift. If you'd like to bless us further, here are a few ways:</p>
      <div className="grid gap-4 md:grid-cols-3">{wedding.gifts.map((item) => { const Icon = icons[item.icon]; return <Reveal key={item.title}><article className="h-full border border-gold/25 bg-card p-6 text-center"><Icon className="mx-auto size-6 text-gold" strokeWidth={1.25}/><h3 className="mt-5 font-serif text-xl text-wine">{item.title}</h3><p className="mt-3 text-sm leading-6 text-foreground/65">{item.text}</p></article></Reveal>})}</div>
      <CulturalDivider/>
      <p className="text-center font-script text-5xl text-wine">{wedding.couple.bride} &amp; {wedding.couple.groom}</p>
    </div>
  </div>;
}
