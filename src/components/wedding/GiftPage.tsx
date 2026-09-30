import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export function GiftPage({
  children,
  title,
  subtitle,
  back = "/",
}: {
  children: ReactNode;
  title: string;
  subtitle: string;
  back?: "/" | "/gifts";
}) {
  return (
    <main className="min-h-screen bg-background px-5 pb-16 sm:px-8 sm:pb-24">
      <nav className="mx-auto flex max-w-6xl items-center justify-between border-b border-gold/25 py-6 sm:py-8">
        <Link
          to="/"
          className="font-script text-3xl text-wine"
          aria-label="Danielle and Obi invitation"
        >
          D & O
        </Link>
        <Link
          to={back}
          className="flex items-center gap-2 text-xs text-wine transition-opacity hover:opacity-70 sm:text-sm"
        >
          <ArrowLeft className="size-4" />
          {back === "/" ? "Invitation" : "Gift registry"}
        </Link>
      </nav>
      <header className="mx-auto max-w-lg pb-10 pt-12 text-center sm:pb-14 sm:pt-16">
        <p className="eyebrow text-wine/70">WITH LOVE, DANIELLE & OBI</p>
        <h1 className="mt-4 font-serif text-5xl leading-tight text-wine sm:text-6xl">{title}</h1>
        <div className="mx-auto my-5 h-px w-12 bg-gold/60" />
        <p className="mx-auto max-w-sm text-sm leading-7 text-foreground/80">{subtitle}</p>
      </header>
      {children}
    </main>
  );
}
