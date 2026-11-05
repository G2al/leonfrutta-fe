import type { Order, OrderStatus, PaymentStatus } from "@/lib/api/types";

const badgeBase =
  "inline-flex items-center rounded px-3 py-1 text-xs font-medium uppercase tracking-wide whitespace-nowrap";

const statusTone: Record<OrderStatus, string> = {
  new: "bg-warning/15 text-warning-text",
  confirmed: "bg-success/15 text-success-text",
  cancelled: "bg-error/10 text-error-text",
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
      {order.status_label || statusFallbackLabel[order.status] || order.status}
    </span>
  );
}

const paymentTone: Record<PaymentStatus, string> = {
  unpaid: "bg-warning/15 text-warning-text",
  paid: "bg-success/15 text-success-text",
};

/** Mostrato solo per le richieste confermate. */
export function PaymentBadge({
  order,
}: {
  order: Pick<Order, "status" | "payment_status" | "payment_status_label">;
}) {
  if (order.status !== "confirmed" || !order.payment_status) return null;
  const label = order.payment_status_label || (order.payment_status === "paid" ? "Pagato" : "Da pagare");
  return <span className={`${badgeBase} ${paymentTone[order.payment_status]}`}>{label}</span>;
}
