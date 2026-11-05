export type OrderField =
  | "first_name"
  | "last_name"
  | "business_name"
  | "phone"
  | "message";

export type OrderPayload = Record<OrderField, string>;

export type FieldErrors = Partial<Record<OrderField, string>>;

export type OrderStatus = "new" | "confirmed" | "cancelled";
export type PaymentStatus = "paid" | "unpaid";

/** Oggetto ordine restituito sia dalla POST sia dalla GET. */
export type Order = {
  id: number;
  tracking_token: string;
  status: OrderStatus;
  status_label: string;
  business_name: string;
  message: string;
  /** Importo con il punto come separatore ("45.50"), null finché non è confermata. */
  amount: string | null;
  payment_status: PaymentStatus | null;
  payment_status_label: string | null;
  created_at: string;
  confirmed_at: string | null;
  cancelled_at: string | null;
  paid_at: string | null;
};

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

type CommonFailure =
  | { kind: "rate_limited"; message: string; retryAfter: number | null }
  | { kind: "error"; message: string }
  | { kind: "network"; message: string };

export type SubmitOrderResult =
  | { kind: "success"; order: Order; message: string }
  | { kind: "validation"; message: string; errors: FieldErrors }
  | CommonFailure;

export type FetchOrderResult =
  | { kind: "found"; order: Order }
  | { kind: "not_found"; message: string }
  | CommonFailure;
