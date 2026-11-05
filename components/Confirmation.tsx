"use client";

import Link from "next/link";
import { useEffect, useRef, type CSSProperties } from "react";
import type { Order } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";
import { CheckIcon } from "./icons";
import { StatusBadge } from "./OrderBadges";

interface ConfirmationProps {
  order: Order;
  phone: string;
  /** `false` se il browser non ha permesso di salvare la richiesta sul dispositivo. */
  saved: boolean;
  onNewOrder: () => void;
}

export function Confirmation({ order, phone, saved, onNewOrder }: ConfirmationProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const sentAt = formatDateTime(order.created_at);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <section
      aria-labelledby="confirmation-title"
      className="animate-rise rounded-3xl border border-border bg-surface p-6 text-center shadow-ds-md"
    >
      <div className="relative mx-auto size-20">
        <Confetti />
        <div className="animate-pop relative flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-leaf to-accent text-white shadow-cta">
          <CheckIcon width={38} height={38} strokeWidth={3} />
        </div>
      </div>

      <h2
        id="confirmation-title"
        ref={headingRef}
        tabIndex={-1}
        className="mt-5 text-2xl font-bold leading-tight outline-none"
      >
        Richiesta inviata!
      </h2>

      <p className="mt-3 text-base leading-relaxed text-muted">
        LeonFrutta la verificherà e ti contatterà su WhatsApp al numero{" "}
        <strong className="whitespace-nowrap font-semibold text-primary">{phone}</strong>.
      </p>

      <dl className="mt-6 divide-y divide-border rounded-2xl bg-subtle/60 text-left">
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <dt className="text-sm text-muted">Numero richiesta</dt>
          <dd className="font-mono text-base font-semibold tabular-nums">#{order.id}</dd>
        </div>
        {sentAt && (
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <dt className="shrink-0 text-sm text-muted">Inviata il</dt>
            <dd className="text-right text-sm font-medium">{sentAt}</dd>
          </div>
        )}
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <dt className="text-sm text-muted">Stato</dt>
          <dd>
            <StatusBadge order={order} />
          </dd>
        </div>
      </dl>

      <p className="mt-4 text-sm leading-relaxed text-muted">
        {saved
          ? "Da questo dispositivo puoi ritrovarla quando vuoi in “Le mie richieste”."
          : "Non è stato possibile salvarla su questo dispositivo: annota il numero della richiesta."}
      </p>

      <div className="mt-5 space-y-3">
        <Link
          href={`/richieste/${encodeURIComponent(order.tracking_token)}`}
          className="btn-cta flex h-13 w-full items-center justify-center rounded-2xl px-7 text-base font-bold transition-transform active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Segui la tua richiesta
        </Link>
        <button
          type="button"
          onClick={onNewOrder}
          className="btn-outline flex h-12 w-full items-center justify-center rounded-2xl px-7 text-base font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Invia un&apos;altra richiesta
        </button>
      </div>
    </section>
  );
}

const CONFETTI_COLORS = ["#e4572e", "#f5b82e", "#22a35a", "#15803d", "#f97316", "#a3e635"];

/** Coriandoli nei colori della frutta che esplodono dal segno di spunta. */
function Confetti() {
  const pieces = Array.from({ length: 16 }, (_, i) => {
    const angle = (i / 16) * Math.PI * 2;
    const distance = 52 + (i % 3) * 14;
    return {
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      round: i % 2 === 0,
      style: {
        "--dx": `${Math.round(Math.cos(angle) * distance)}px`,
        "--dy": `${Math.round(Math.sin(angle) * distance)}px`,
        "--rot": `${(i % 2 ? 1 : -1) * (120 + i * 15)}deg`,
        animationDelay: `${(i % 4) * 30}ms`,
      } as CSSProperties,
    };
  });

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {pieces.map(({ color, round, style }, i) => (
        <span
          key={i}
          className={`animate-burst absolute left-1/2 top-1/2 -ml-1 -mt-1 opacity-0 ${
            round ? "size-2 rounded-full" : "h-1.5 w-2.5 rounded-sm"
          }`}
          style={{ ...style, backgroundColor: color }}
        />
      ))}
    </div>
  );
}
