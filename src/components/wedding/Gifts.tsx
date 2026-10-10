import { Banknote, Gift, Heart } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { wedding } from "@/data/wedding";
import { CulturalDivider, Reveal, SectionTitle } from "./shared";

const icons = { bank: Banknote, gift: Gift, heart: Heart };
const choices = { bank: "money", gift: "items", heart: "wish" } as const;

export function Gifts() {
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
                <Link
                  to="/gifts"
                  search={{ kind: choices[item.icon] }}
                  className="group block h-full w-full border border-gold/25 bg-card px-6 py-8 text-center transition-colors hover:border-gold hover:bg-cream/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine focus-visible:ring-offset-4"
                >
                  <Icon className="mx-auto size-6 text-gold" strokeWidth={1.25} />
                  <h3 className="mt-5 font-serif text-xl text-wine">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-foreground/65">{item.text}</p>
                </Link>
              </Reveal>
            );
          })}
        </div>
        <CulturalDivider />
        <p className="text-center font-script text-5xl text-wine">
          {wedding.couple.bride} &amp; {wedding.couple.groom}
        </p>
      </div>
    </div>
  );
}
