"use client";

import Link from "next/link";
import { useState } from "react";
import type { Order } from "@/lib/api/types";
import { formatAmount, formatDateTime } from "@/lib/format";
import type { SavedOrder } from "@/lib/my-orders";
import { ChevronRightIcon } from "./icons";
import { PaymentBadge, StatusBadge } from "./OrderBadges";

export type CardStatus =
  | { kind: "loading" }
  | { kind: "loaded"; order: Order }
  | { kind: "unavailable" };

interface OrderCardProps {
  saved: SavedOrder;
  status: CardStatus;
  onRemove: () => void;
}

export function OrderCard({ saved, status, onRemove }: OrderCardProps) {
  const [confirming, setConfirming] = useState(false);
  const order = status.kind === "loaded" ? status.order : null;
  const amount = order?.status === "confirmed" ? formatAmount(order.amount) : null;
  const href = `/richieste/${encodeURIComponent(saved.tracking_token)}`;

  return (
    <li className="animate-rise overflow-hidden rounded-3xl border border-border bg-surface shadow-ds-md">
      <Link
        href={href}
        className="block p-4 transition-colors hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-sm font-semibold tabular-nums">Richiesta #{saved.id}</p>
            <p className="mt-0.5 truncate text-base font-medium">
              {order?.business_name ?? saved.business_name}
            </p>
            <p className="mt-0.5 text-sm text-muted">{formatDateTime(saved.created_at)}</p>
          </div>
          <ChevronRightIcon className="mt-1 shrink-0 text-secondary" />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {status.kind === "loading" && (
            <span className="h-6 w-24 animate-pulse rounded bg-border/70" aria-label="Caricamento stato" />
          )}
          {status.kind === "unavailable" && (
            <span className="text-sm text-muted">Stato non disponibile al momento</span>
          )}
          {order && (
            <>
              <StatusBadge order={order} />
              <PaymentBadge order={order} />
              {amount && (
                <span className="ml-auto font-heading text-lg font-bold tabular-nums">{amount}</span>
              )}
            </>
          )}
        </div>
      </Link>

      {confirming ? (
        <div role="group" aria-label="Conferma rimozione" className="border-t border-subtle p-4">
          <p className="text-sm leading-relaxed text-muted">
            La richiesta verrà tolta solo da questo dispositivo: <strong className="font-medium text-primary">non
            viene annullata</strong> e LeonFrutta continuerà a gestirla.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="h-10 flex-1 rounded-xl border border-border-strong/70 text-sm font-medium hover:bg-subtle"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="h-10 flex-1 rounded-xl bg-error-text text-sm font-semibold text-white hover:opacity-90"
            >
              Rimuovi
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-end border-t border-subtle px-2 py-1">
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="rounded-lg px-3 py-2 text-sm text-muted hover:bg-subtle hover:text-primary"
            aria-label={`Rimuovi la richiesta #${saved.id} da questo dispositivo`}
          >
            Rimuovi dall&apos;elenco
          </button>
        </div>
      )}
    </li>
  );
}
