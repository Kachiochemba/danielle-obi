import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { wedding } from "@/data/wedding";
import { Reveal, SectionTitle } from "./shared";
import galleryPhoto1 from "@/assets/gallery/gallery-1.jpg";
import galleryPhoto2 from "@/assets/gallery/gallery-2.jpg";
import galleryPhoto3 from "@/assets/gallery/gallery-3.jpg";
import galleryPhoto4 from "@/assets/gallery/gallery-4.jpg";
import galleryPhoto5 from "@/assets/gallery/gallery-5.jpg";
import galleryPhoto6 from "@/assets/gallery/gallery-6.jpg";

const galleryPhotos: Record<string, string> = {
  "gallery-1.jpg": galleryPhoto1,
  "gallery-2.jpg": galleryPhoto2,
  "gallery-3.jpg": galleryPhoto3,
  "gallery-4.jpg": galleryPhoto4,
  "gallery-5.jpg": galleryPhoto5,
  "gallery-6.jpg": galleryPhoto6,
};

function GalleryPhoto({ url, alt, onOpen }: { url: string; alt: string; onOpen: (item: { url: string; alt: string }) => void }) {
  const [loaded, setLoaded] = useState(false);
  return <div className="relative aspect-[3/4] overflow-hidden border border-gold/25 bg-cream">
    {!loaded && <div className="absolute inset-0 animate-pulse bg-gold/10" aria-hidden />}
    <button type="button" onClick={() => onOpen({ url, alt })} aria-label={`View larger: ${alt}`} className="block h-full w-full cursor-zoom-in">
      <img src={url} alt={alt} loading="lazy" onLoad={() => setLoaded(true)} className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
    </button>
  </div>;
}

function Lightbox({ item, onClose }: { item: { url: string; alt: string } | null; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [item, onClose]);
  return <AnimatePresence>
    {item && <motion.div className="fixed inset-0 z-[70] flex items-center justify-center bg-wine-deep/95 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} role="dialog" aria-modal="true" aria-label={item.alt}>
      <motion.img key={item.url} src={item.url} alt={item.alt} className="max-h-full max-w-full rounded-sm object-contain shadow-2xl" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.25, ease: "easeOut" }} onClick={(e) => e.stopPropagation()} />
      <button ref={closeRef} type="button" onClick={onClose} aria-label="Close photo" className="absolute right-4 flex size-11 items-center justify-center rounded-full border border-gold/40 bg-background/80 text-gold" style={{ top: "max(1rem, env(safe-area-inset-top))" }}><X className="size-5" strokeWidth={1.5} /></button>
 </motion.div>}
  </AnimatePresence>;
}

export function Story() {
  const [lightbox, setLightbox] = useState<{ url: string; alt: string } | null>(null);
  const closeLightbox = useCallback(() => setLightbox(null), []);
  return <div className="bg-background px-5 py-20">
    <div className="mx-auto max-w-2xl">
      <Reveal><SectionTitle eyebrow="OUR JOURNEY" title="The Love Story" subtitle="Every chapter led us here" /></Reveal>
      <div className="space-y-4">{wedding.story.map((item, i) => <Reveal key={item.title} delay={i * 0.1}><article className="grid grid-cols-[48px_1fr] gap-5 border-b border-gold/25 py-7"><p className="font-serif text-xl italic text-gold">{String(i + 1).padStart(2, "0")}</p><div><p className="eyebrow text-muted-label">CHAPTER {String(i + 1).padStart(2, "0")}</p><h3 className="mt-2 font-serif text-2xl text-wine">{item.title}</h3><p className="mt-4 text-sm leading-7 text-foreground/70">{item.text}</p></div></article></Reveal>)}</div>
      <Reveal><div className="mt-14"><p className="eyebrow text-center text-muted-label">MOMENTS</p><h3 className="mt-2 text-center font-serif text-3xl text-wine">Our Gallery</h3>
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3">{wedding.gallery.map((g) => <GalleryPhoto key={g.file} url={galleryPhotos[g.file]!} alt={g.alt} onOpen={setLightbox} />)}</div>
      </div></Reveal>
      <Lightbox item={lightbox} onClose={closeLightbox} />
    </div>
  </div>;
}
