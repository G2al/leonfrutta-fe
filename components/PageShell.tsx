import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "./Logo";

/**
 * Struttura comune: testata verde a tutta larghezza, poi il contenuto in una
 * colonna mobile con lo spazio per la barra di navigazione in basso.
 */
export function PageShell({ header, children }: { header: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col pb-[calc(6.5rem+env(safe-area-inset-bottom))]">
      {header}
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4">{children}</div>
    </div>
  );
}

/** Foglie e luci decorative della fascia verde. */
function HeroDecor() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg
        viewBox="0 0 120 120"
        className="animate-float absolute -left-6 top-6 size-28 text-white/10"
        fill="currentColor"
      >
        <path d="M100 10C55 10 15 40 15 85c0 9 3 17 7 24 30-6 56-24 70-52-14 22-36 38-62 46C38 62 65 30 100 10Z" />
      </svg>
      <svg
        viewBox="0 0 120 120"
        className="animate-float absolute -right-4 bottom-2 size-24 rotate-[160deg] text-white/10 [animation-delay:-3s]"
        fill="currentColor"
      >
        <path d="M100 10C55 10 15 40 15 85c0 9 3 17 7 24 30-6 56-24 70-52-14 22-36 38-62 46C38 62 65 30 100 10Z" />
      </svg>
      <span className="absolute right-10 top-10 size-3 rounded-full bg-sun/70" />
      <span className="absolute left-16 bottom-10 size-2 rounded-full bg-tomato/70" />
      <span className="absolute right-24 bottom-16 size-1.5 rounded-full bg-white/50" />
    </div>
  );
}

/** Testata della home: fascia verde con il logo che "sporge" come un'insegna. */
export function HomeHero() {
  return (
    <header className="relative mb-20">
      <div className="bg-hero relative h-[calc(9rem+env(safe-area-inset-top))] rounded-b-[2.5rem] shadow-ds-md">
        <HeroDecor />
      </div>
      <div className="absolute inset-x-0 bottom-0 flex translate-y-1/2 justify-center">
        <div className="animate-rise rounded-full bg-surface p-1.5 shadow-ds-lg ring-4 ring-white/70">
          <Logo className="size-36" />
        </div>
      </div>
    </header>
  );
}

/** Testata delle pagine interne: titolo, sottotitolo e link per tornare indietro. */
export function PageHeader({
  title,
  subtitle,
  back,
}: {
  title: string;
  subtitle?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <header className="bg-hero relative mb-6 overflow-hidden rounded-b-[2rem] pb-7 pt-[max(1.25rem,env(safe-area-inset-top))] text-white shadow-ds-md">
      <HeroDecor />
      <div className="relative mx-auto w-full max-w-lg px-4">
        {back && (
          <Link
            href={back.href}
            className="-ml-2 mb-3 inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-sm font-medium text-white backdrop-blur hover:bg-white/25"
          >
            <span aria-hidden="true">←</span> {back.label}
          </Link>
        )}
        <h1 className="text-[1.75rem] font-bold leading-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-base text-white/85">{subtitle}</p>}
      </div>
    </header>
  );
}
