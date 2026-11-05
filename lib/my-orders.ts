import type { Order } from "./api/types";

/**
 * Richieste inviate da questo dispositivo ("Le mie richieste").
 * Si salvano solo i dati minimi: mai il testo dell'ordine né il telefono.
 */
export type SavedOrder = Pick<Order, "tracking_token" | "id" | "business_name" | "created_at">;

const STORAGE_KEY = "leonfrutta:orders";

function isSavedOrder(value: unknown): value is SavedOrder {
  const v = value as SavedOrder | null;
  return (
    !!v &&
    typeof v.tracking_token === "string" &&
    v.tracking_token !== "" &&
    typeof v.id === "number" &&
    typeof v.business_name === "string" &&
    typeof v.created_at === "string"
  );
}

function byNewest(a: SavedOrder, b: SavedOrder) {
  return Date.parse(b.created_at) - Date.parse(a.created_at) || b.id - a.id;
}

/** Elenco salvato, dalla richiesta più recente. Vuoto se l'archivio non è disponibile. */
export function loadSavedOrders(): SavedOrder[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isSavedOrder).sort(byNewest) : [];
  } catch {
    return [];
  }
}

function write(orders: SavedOrder[]): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    return true;
  } catch {
    return false;
  }
}

/** Aggiunge una richiesta all'elenco. Restituisce `false` se non è stato possibile salvarla. */
export function addSavedOrder(order: Order): boolean {
  const entry: SavedOrder = {
    tracking_token: order.tracking_token,
    id: order.id,
    business_name: order.business_name,
    created_at: order.created_at,
  };
  const others = loadSavedOrders().filter((o) => o.tracking_token !== entry.tracking_token);
  return write([entry, ...others].sort(byNewest));
}

/** Rimuove una richiesta dall'elenco locale (non la annulla). */
export function removeSavedOrder(trackingToken: string): void {
  const current = loadSavedOrders();
  const next = current.filter((o) => o.tracking_token !== trackingToken);
  if (next.length !== current.length) write(next);
}

/** `true` se il browser permette di salvare dati in modo persistente. */
export function isStorageAvailable(): boolean {
  try {
    const key = "leonfrutta:probe";
    window.localStorage.setItem(key, "1");
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
