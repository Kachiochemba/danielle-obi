import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ImageIcon } from "lucide-react";
import { wedding } from "@/data/wedding";
import { getPhotoUrls } from "@/lib/photos.functions";
import { Reveal, SectionTitle } from "./shared";

function Photo({ url, loading, alt, label, className = "" }: { url?: string | undefined; loading: boolean; alt: string; label: string; className?: string }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const showImage = url && !failed;
  return <div className={`relative overflow-hidden border border-gold/25 bg-cream ${className}`}>
    {(loading || (showImage && !loaded)) && <div className="absolute inset-0 animate-pulse bg-gold/10" aria-hidden />}
    {showImage
      ? <img src={url} alt={alt} loading="lazy" onLoad={() => setLoaded(true)} onError={() => setFailed(true)} className={`h-full w-full object-cover transition-opacity duration-700 ${loaded ? "opacity-100" : "opacity-0"}`} />
      : !loading && <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-label"><ImageIcon className="size-6 text-gold" strokeWidth={1.3} /><span className="eyebrow text-[10px]">PHOTO COMING SOON</span><span className="text-[10px] opacity-70">{label}</span></div>}
  </div>;
}

export function Story() {
  const { data, isLoading } = useQuery({ queryKey: ["wedding-photos"], queryFn: () => getPhotoUrls(), staleTime: 1000 * 60 * 60 });
  const urls = data?.urls ?? {};
  return <div className="bg-background px-5 py-20">
    <div className="mx-auto max-w-2xl">
      <Reveal><SectionTitle eyebrow="OUR JOURNEY" title="The Love Story" subtitle="Every chapter led us here" /></Reveal>
      <div className="space-y-4">{wedding.story.map((item, i) => <Reveal key={item.title} delay={i * 0.1}><article className="grid grid-cols-[48px_1fr] gap-5 border-b border-gold/25 py-7"><p className="font-serif text-xl italic text-gold">{String(i + 1).padStart(2, "0")}</p><div><p className="eyebrow text-muted-label">CHAPTER {String(i + 1).padStart(2, "0")}</p><h3 className="mt-2 font-serif text-2xl text-wine">{item.title}</h3><Photo url={urls[item.image]} loading={isLoading} alt={`${item.title}, Danielle and Obi`} label={item.image} className="mt-4 aspect-[4/3]" /><p className="mt-4 text-sm leading-7 text-foreground/70">{item.text}</p></div></article></Reveal>)}</div>
      <Reveal><div className="mt-14"><p className="eyebrow text-center text-muted-label">MOMENTS</p><h3 className="mt-2 text-center font-serif text-3xl text-wine">Our Gallery</h3>
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3">{wedding.gallery.map((g, i) => <Photo key={g.file} url={urls[g.file]} loading={isLoading} alt={g.alt} label={g.file} className={i % 3 === 0 ? "aspect-[3/4]" : "aspect-square"} />)}</div>
      </div></Reveal>
    </div>
  </div>;
}
