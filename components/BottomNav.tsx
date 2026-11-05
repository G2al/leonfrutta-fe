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

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigazione principale"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="mx-auto flex max-w-lg">
        {ITEMS.map(({ href, label, Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${
                  active ? "text-accent" : "text-muted hover:text-primary"
                }`}
              >
                <Icon width={22} height={22} strokeWidth={active ? 2.4 : 2} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
