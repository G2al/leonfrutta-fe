import type { ReactNode } from "react";
import type { Order } from "@/lib/api/types";
import { formatAmount, formatDateTime } from "@/lib/format";
import { PaymentBadge, STATUS_DESCRIPTION, StatusBadge } from "./OrderBadges";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <dt className="shrink-0 text-sm text-muted">{label}</dt>
      <dd className="text-right text-sm font-medium">{children}</dd>
    </div>
  );
}

const statusPanel: Record<Order["status"], string> = {
  new: "border-warning/40 bg-warning/5",
  confirmed: "border-success/40 bg-success/5",
  cancelled: "border-error/30 bg-error/5",
};

export function OrderDetailView({ order }: { order: Order }) {
  const confirmed = order.status === "confirmed";
  const amount = confirmed ? formatAmount(order.amount) : null;

  return (
    <div className="space-y-4">
      <section
        aria-label="Stato della richiesta"
        className={`animate-rise rounded-3xl border p-5 shadow-ds-sm ${statusPanel[order.status] ?? "border-border bg-surface"}`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge order={order} />
          <PaymentBadge order={order} />
        </div>
        <p className="mt-3 text-base leading-relaxed">{STATUS_DESCRIPTION[order.status]}</p>

        {confirmed && amount && (
          <div className="bg-hero relative mt-4 overflow-hidden rounded-2xl px-5 py-4 text-white shadow-cta">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
              Importo comunicato da LeonFrutta
            </p>
            <p className="mt-1 font-heading text-4xl font-extrabold tabular-nums" data-testid="order-amount">
              {amount}
            </p>
            <p className="mt-1 text-xs text-white/80">
              L&apos;importo può essere aggiornato da LeonFrutta fino al pagamento.
            </p>
          </div>
        )}
      </section>

      <dl className="animate-rise divide-y divide-border rounded-3xl border border-border bg-surface shadow-ds-md [animation-delay:80ms]">
        <Row label="Numero richiesta">
          <span className="font-mono text-base font-semibold tabular-nums">#{order.id}</span>
        </Row>
        <Row label="Attività">{order.business_name}</Row>
        <Row label="Inviata il">{formatDateTime(order.created_at) ?? "—"}</Row>
        {confirmed && order.confirmed_at && (
          <Row label="Confermata il">{formatDateTime(order.confirmed_at)}</Row>
        )}
        {confirmed && order.payment_status === "paid" && order.paid_at && (
          <Row label="Pagata il">{formatDateTime(order.paid_at)}</Row>
        )}
        {order.status === "cancelled" && order.cancelled_at && (
          <Row label="Annullata il">{formatDateTime(order.cancelled_at)}</Row>
        )}
      </dl>

      <section aria-labelledby="order-message-title" className="animate-rise rounded-3xl border border-border bg-surface p-5 shadow-ds-md [animation-delay:160ms]">
        <h2 id="order-message-title" className="text-base font-semibold">
          La tua richiesta
        </h2>
        {/* Testo semplice: React lo esegue come escape, nessun HTML interpretato. */}
        <p className="mt-2 whitespace-pre-line break-words text-base leading-relaxed text-muted">
          {order.message}
        </p>
      </section>
    </div>
  );
}
