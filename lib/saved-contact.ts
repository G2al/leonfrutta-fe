import type { OrderPayload } from "./api/types";

/** Dati anagrafici ricordati sul dispositivo. Il testo dell'ordine non viene mai salvato. */
export type SavedContact = Omit<OrderPayload, "message">;

const STORAGE_KEY = "leonfrutta:contact";

export function loadContact(): SavedContact | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedContact>;
    return {
      first_name: typeof parsed.first_name === "string" ? parsed.first_name : "",
      last_name: typeof parsed.last_name === "string" ? parsed.last_name : "",
      business_name: typeof parsed.business_name === "string" ? parsed.business_name : "",
      phone: typeof parsed.phone === "string" ? parsed.phone : "",
    };
  } catch {
    return null;
  }
}

export function saveContact(contact: SavedContact): void {
  try {
    const { first_name, last_name, business_name, phone } = contact;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ first_name, last_name, business_name, phone }),
    );
  } catch {
    // Archiviazione non disponibile (es. navigazione privata): si ignora.
  }
}

export function clearContact(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignora.
  }
}
