import { ExternalLink, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import cathedralMap from "@/assets/cathedral-map-enhanced.png";
import { wedding } from "@/data/wedding";
import { Reveal, SectionTitle } from "./shared";

export function Venue() {
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(wedding.venue.mapQuery)}`;
  return <div className="bg-wine px-5 py-20 text-cream">
    <div className="mx-auto max-w-3xl">
      <Reveal><SectionTitle eyebrow="FINDING US" title="The Ceremony" subtitle="Where our forever begins" inverse /></Reveal>
      <div className="map-panel relative aspect-[16/9] min-h-72 overflow-hidden border border-gold/40 bg-wine-deep">
        <img src={cathedralMap} alt={`Satellite map showing ${wedding.venue.name} on Marina Road`} className="h-full w-full object-cover" width={1920} height={912} />
        <a className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-full bg-cream/95 px-4 py-2 text-xs font-bold text-wine shadow-lg backdrop-blur-sm" href={url} target="_blank" rel="noreferrer">Open in Maps <ExternalLink className="size-3"/></a>
        <div className="absolute inset-x-0 bottom-0 bg-wine-deep/90 px-5 py-4 backdrop-blur-sm">
          <p className="font-serif text-xl text-cream">{wedding.venue.name}</p>
          <p className="mt-1 text-xs text-cream/75">{wedding.venue.short}</p>
        </div>
      </div>
      <Button asChild className="shimmer mt-5 h-13 w-full rounded-sm bg-gold text-wine transition-transform duration-200 hover:bg-gold/90 active:scale-[0.99]"><a href={url} target="_blank" rel="noreferrer"><MapPin/> OPEN IN GOOGLE MAPS</a></Button>
    </div>
  </div>;
}
