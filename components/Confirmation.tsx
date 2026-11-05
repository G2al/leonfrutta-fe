"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
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
      className="rounded-2xl bg-surface p-6 text-center shadow-ds-md"
    >
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-success/10 text-success-text">
        <CheckIcon width={32} height={32} strokeWidth={2.5} />
      </div>

      <h2
        id="confirmation-title"
        ref={headingRef}
        tabIndex={-1}
        className="mt-5 text-2xl font-semibold leading-tight outline-none"
      >
        Richiesta inviata!
      </h2>

      <p className="mt-3 text-base leading-relaxed text-muted">
        LeonFrutta la verificherà e ti contatterà su WhatsApp al numero{" "}
        <strong className="whitespace-nowrap font-semibold text-primary">{phone}</strong>.
      </p>

      <dl className="mt-6 divide-y divide-subtle rounded-lg border border-border text-left">
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
          className="flex h-12 w-full items-center justify-center rounded-lg bg-primary px-7 text-base font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Segui la tua richiesta
        </Link>
        <button
          type="button"
          onClick={onNewOrder}
          className="flex h-12 w-full items-center justify-center rounded-lg border border-primary px-7 text-base font-medium text-primary transition-colors hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Invia un&apos;altra richiesta
        </button>
      </div>
    </section>
  );
}
