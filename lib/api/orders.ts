import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  FetchOrderResult,
  FieldErrors,
  Order,
  OrderField,
  OrderPayload,
  SubmitOrderResult,
} from "./types";

const ORDER_FIELDS: OrderField[] = [
  "first_name",
  "last_name",
  "business_name",
  "phone",
  "message",
];

export const NETWORK_ERROR_MESSAGE =
  "Connessione assente o servizio non raggiungibile. Riprova.";
const GENERIC_ERROR_MESSAGE =
  "Si è verificato un errore inatteso. Riprova più tardi.";
const VALIDATION_ERROR_MESSAGE =
  "I dati inviati non sono validi. Controlla i campi evidenziati.";
const RATE_LIMIT_MESSAGE =
  "Hai inviato troppe richieste. Riprova tra qualche istante.";
const NOT_FOUND_MESSAGE = "Richiesta non trovata.";

function ordersEndpoint(): string {
  const base = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
  return `${base}/api/v1/orders`;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function messageFrom(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "message" in body) {
    const { message } = body as { message: unknown };
    if (typeof message === "string" && message.trim() !== "") return message;
  }
  return fallback;
}

function orderFrom(body: unknown): Order | null {
  const data = (body as ApiSuccessResponse<Order> | null)?.data;
  if (
    data &&
    typeof data.id === "number" &&
    typeof data.tracking_token === "string" &&
    data.tracking_token !== ""
  ) {
    return data;
  }
  return null;
}

function fieldErrorsFrom(body: unknown): FieldErrors {
  const errors: FieldErrors = {};
  const raw = (body as ApiErrorResponse | null)?.errors;
  if (!raw || typeof raw !== "object") return errors;

  for (const field of ORDER_FIELDS) {
    const first = raw[field]?.[0];
    if (typeof first === "string") errors[field] = first;
  }
  return errors;
}

function parseRetryAfter(value: string | null): number | null {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds);
  const date = Date.parse(value);
  if (!Number.isNaN(date)) {
    return Math.max(0, Math.ceil((date - Date.now()) / 1000));
  }
  return null;
}

/** Gestione comune di 429 e degli altri errori, uguale per POST e GET. */
function commonFailure(response: Response, json: unknown) {
  if (response.status === 429) {
    return {
      kind: "rate_limited",
      message: messageFrom(json, RATE_LIMIT_MESSAGE),
      retryAfter: parseRetryAfter(response.headers.get("Retry-After")),
    } as const;
  }
  return { kind: "error", message: messageFrom(json, GENERIC_ERROR_MESSAGE) } as const;
}

/**
 * Invia la richiesta d'ordine al backend.
 * Non lancia mai eccezioni: restituisce sempre un risultato discriminato.
 */
export async function submitOrder(
  payload: OrderPayload,
): Promise<SubmitOrderResult> {
  // Solo i campi previsti dal contratto API, ripuliti dagli spazi.
  const body: OrderPayload = {
    first_name: payload.first_name.trim(),
    last_name: payload.last_name.trim(),
    business_name: payload.business_name.trim(),
    phone: String(payload.phone).trim(),
    message: payload.message.trim(),
  };

  let response: Response;
  try {
    response = await fetch(ordersEndpoint(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch {
    return { kind: "network", message: NETWORK_ERROR_MESSAGE };
  }

  const json = await readJson(response);

  if (response.ok) {
    const order = orderFrom(json);
    if (order) {
      return {
        kind: "success",
        order,
        message: messageFrom(json, "La tua richiesta è stata inviata con successo."),
      };
    }
    return { kind: "error", message: GENERIC_ERROR_MESSAGE };
  }

  if (response.status === 422) {
    return {
      kind: "validation",
      message: messageFrom(json, VALIDATION_ERROR_MESSAGE),
      errors: fieldErrorsFrom(json),
    };
  }

  return commonFailure(response, json);
}

/**
 * Legge lo stato aggiornato di una richiesta tramite il suo codice segreto.
 * Non lancia mai eccezioni: restituisce sempre un risultato discriminato.
 */
export async function fetchOrder(trackingToken: string): Promise<FetchOrderResult> {
  let response: Response;
  try {
    response = await fetch(`${ordersEndpoint()}/${encodeURIComponent(trackingToken)}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
  } catch {
    return { kind: "network", message: NETWORK_ERROR_MESSAGE };
  }

  const json = await readJson(response);

  if (response.ok) {
    const order = orderFrom(json);
    return order
      ? { kind: "found", order }
      : { kind: "error", message: GENERIC_ERROR_MESSAGE };
  }

  if (response.status === 404) {
    return { kind: "not_found", message: messageFrom(json, NOT_FOUND_MESSAGE) };
  }

  return commonFailure(response, json);
}
