"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ListIcon, PlusIcon } from "./icons";

const ITEMS = [
  { href: "/", label: "Nuovo ordine", Icon: PlusIcon, match: (path: string) => path === "/" },
  {
    href: "/richieste",
    label: "Le mie richieste",
    Icon: ListIcon,
    match: (path: string) => path.startsWith("/richieste"),
  },
];

/** Barra di navigazione "galleggiante" in basso, con la voce attiva evidenziata. */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigazione principale"
      className="fixed inset-x-0 bottom-0 z-10 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <ul className="mx-auto flex max-w-md gap-1 rounded-3xl border border-border/80 bg-surface/90 p-1.5 shadow-ds-lg backdrop-blur-md">
        {ITEMS.map(({ href, label, Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex h-14 flex-col items-center justify-center gap-0.5 rounded-2xl text-xs font-semibold transition-all duration-200 ${
                  active ? "bg-accent-soft text-accent" : "text-muted hover:bg-subtle hover:text-primary"
                }`}
              >
                <Icon
                  width={22}
                  height={22}
                  strokeWidth={active ? 2.5 : 2}
                  className={`transition-transform duration-200 ${active ? "scale-110" : ""}`}
                />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
