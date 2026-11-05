import type { Order, OrderStatus, PaymentStatus } from "@/lib/api/types";

const badgeBase =
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide whitespace-nowrap";

/** Pallino colorato davanti all'etichetta. */
function Dot({ className }: { className: string }) {
  return <span aria-hidden="true" className={`size-1.5 rounded-full ${className}`} />;
}

const statusDot: Record<OrderStatus, string> = {
  new: "bg-warning",
  confirmed: "bg-success",
  cancelled: "bg-error",
};

const statusTone: Record<OrderStatus, string> = {
  new: "bg-warning/15 text-warning-text ring-1 ring-warning/25",
  confirmed: "bg-success/15 text-success-text ring-1 ring-success/30",
  cancelled: "bg-error/10 text-error-text ring-1 ring-error/20",
};

const statusFallbackLabel: Record<OrderStatus, string> = {
  new: "Nuovo",
  confirmed: "Confermato",
  cancelled: "Annullato",
};

export const STATUS_DESCRIPTION: Record<OrderStatus, string> = {
  new: "In attesa di conferma da parte di LeonFrutta.",
  confirmed: "Richiesta confermata. LeonFrutta ti contatterà su WhatsApp.",
  cancelled: "Questa richiesta è stata annullata. Per informazioni contatta LeonFrutta.",
};

export function StatusBadge({ order }: { order: Pick<Order, "status" | "status_label"> }) {
  const tone = statusTone[order.status] ?? "bg-subtle text-muted";
  return (
    <span className={`${badgeBase} ${tone}`}>
      <Dot className={statusDot[order.status] ?? "bg-secondary"} />
      {order.status_label || statusFallbackLabel[order.status] || order.status}
    </span>
  );
}

const paymentTone: Record<PaymentStatus, string> = {
  unpaid: "bg-tomato-soft text-error-text ring-1 ring-tomato/25",
  paid: "bg-success/15 text-success-text ring-1 ring-success/30",
};

/** Mostrato solo per le richieste confermate. */
export function PaymentBadge({
  order,
}: {
  order: Pick<Order, "status" | "payment_status" | "payment_status_label">;
}) {
  if (order.status !== "confirmed" || !order.payment_status) return null;
  const label = order.payment_status_label || (order.payment_status === "paid" ? "Pagato" : "Da pagare");
  return (
    <span className={`${badgeBase} ${paymentTone[order.payment_status]}`}>
      <Dot className={order.payment_status === "paid" ? "bg-success" : "bg-tomato"} />
      {label}
    </span>
  );
}
