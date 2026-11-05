import type { FieldErrors, OrderField, OrderPayload } from "./api/types";

export const FIELD_LIMITS: Record<OrderField, { min?: number; max: number }> = {
  first_name: { max: 100 },
  last_name: { max: 100 },
  business_name: { max: 150 },
  phone: { max: 25 },
  message: { min: 5, max: 3000 },
};

const FIELD_LABELS: Record<OrderField, string> = {
  first_name: "nome",
  last_name: "cognome",
  business_name: "nome dell'attività",
  phone: "telefono",
  message: "richiesta",
};

// Cifre, spazi e separatori comuni; il "+" è ammesso solo all'inizio.
const PHONE_CHARS = /^\+?[0-9\s.\-/()]+$/;

/** Lunghezza in caratteri reali (non in unità UTF-16). */
export function charCount(value: string): number {
  return Array.from(value).length;
}

export function trimPayload(values: OrderPayload): OrderPayload {
  return {
    first_name: values.first_name.trim(),
    last_name: values.last_name.trim(),
    business_name: values.business_name.trim(),
    phone: values.phone.trim(),
    message: values.message.trim(),
  };
}

export function validateField(field: OrderField, rawValue: string): string | undefined {
  const value = rawValue.trim();
  const label = FIELD_LABELS[field];
  const { min, max } = FIELD_LIMITS[field];
  const length = charCount(value);

  if (length === 0) return `Il campo ${label} è obbligatorio.`;
  if (min !== undefined && length < min) {
    return `Il campo ${label} deve contenere almeno ${min} caratteri.`;
  }
  if (length > max) {
    return `Il campo ${label} non può superare ${max} caratteri.`;
  }

  if (field === "phone") {
    const digits = value.replace(/\D/g, "").length;
    if (!PHONE_CHARS.test(value) || digits < 6) {
      return "Inserisci un numero di telefono valido.";
    }
  }

  return undefined;
}

export function validateOrder(values: OrderPayload): FieldErrors {
  const errors: FieldErrors = {};
  for (const field of Object.keys(FIELD_LIMITS) as OrderField[]) {
    const error = validateField(field, values[field]);
    if (error) errors[field] = error;
  }
  return errors;
}
