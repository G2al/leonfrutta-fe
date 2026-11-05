import Link from "next/link";
import type { ReactNode } from "react";

/** Contenitore mobile comune: margini, aree sicure e spazio per la barra di navigazione. */
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      {children}
    </div>
  );
}

/** Intestazione delle pagine interne: titolo, sottotitolo e link per tornare indietro. */
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
    <header className="mb-5 pt-2">
      {back && (
        <Link
          href={back.href}
          className="-ml-2 mb-2 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-muted hover:bg-subtle hover:text-primary"
        >
          <span aria-hidden="true">←</span> {back.label}
        </Link>
      )}
      <h1 className="text-[1.75rem] font-bold leading-tight">{title}</h1>
      {subtitle && <p className="mt-1 text-base text-muted">{subtitle}</p>}
    </header>
  );
}
