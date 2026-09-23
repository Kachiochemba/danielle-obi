import { ExternalLink, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { wedding } from "@/data/wedding";
import { Reveal, SectionTitle } from "./shared";

export function Venue() {
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(wedding.venue.mapQuery)}`;
  return <div className="bg-wine px-5 py-20 text-cream">
    <div className="mx-auto max-w-3xl">
      <Reveal><SectionTitle eyebrow="FINDING US" title="The Ceremony" subtitle="Where our forever begins" inverse /></Reveal>
      <div className="map-panel relative min-h-96 overflow-hidden border border-gold/40 bg-wine-deep">
        <a className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-full bg-cream px-4 py-2 text-xs font-bold text-wine" href={url} target="_blank" rel="noreferrer">Open in Maps <ExternalLink className="size-3"/></a>
        <div className="map-grid absolute inset-0"/><div className="route-line absolute inset-0"/>
        <div className="absolute inset-0 grid place-items-center text-center"><div><span className="map-pin mx-auto grid size-16 place-items-center rounded-full border border-gold bg-wine text-gold"><MapPin className="size-7" strokeWidth={1.3}/></span><p className="mt-5 max-w-64 font-serif text-2xl">{wedding.venue.name}</p><p className="mt-2 text-sm text-cream/65">{wedding.venue.short}</p></div></div>
      </div>
      <Button asChild className="shimmer mt-5 h-13 w-full rounded-sm bg-gold text-wine transition-transform duration-200 hover:bg-gold/90 active:scale-[0.99]"><a href={url} target="_blank" rel="noreferrer"><MapPin/> OPEN IN GOOGLE MAPS</a></Button>
    </div>
  </div>;
}
