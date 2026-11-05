import type { Order } from "@/lib/api/types";

export const TOKEN = "01a1a105-4c31-708e-961a-11cad464f992";

export function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 12,
    tracking_token: TOKEN,
    status: "new",
    status_label: "Nuovo",
    business_name: "Pizzeria Da Mario",
    message: "10 kg di pomodori\n5 kg di patate",
    amount: null,
    payment_status: null,
    payment_status_label: null,
    created_at: "2026-11-03T09:30:00+00:00",
    confirmed_at: null,
    cancelled_at: null,
    paid_at: null,
    ...overrides,
  };
}

export function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

/** Simula un browser in cui localStorage non è utilizzabile (es. navigazione privata). */
export function breakLocalStorage() {
  const fail = () => {
    throw new DOMException("Storage disabilitato", "SecurityError");
  };
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    get: fail,
  });
}
