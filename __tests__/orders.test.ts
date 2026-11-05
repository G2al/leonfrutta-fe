import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NETWORK_ERROR_MESSAGE, fetchOrder, submitOrder } from "@/lib/api/orders";
import type { OrderPayload } from "@/lib/api/types";
import { TOKEN, jsonResponse, makeOrder } from "./fixtures";

const payload: OrderPayload = {
  first_name: "  Mario ",
  last_name: "Rossi",
  business_name: "Pizzeria Da Mario",
  phone: " 333 123 4567 ",
  message: "Buongiorno, vorrei 10 kg di pomodori.",
};

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_API_URL", "http://api.test/");
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe("submitOrder", () => {
  it("invia una POST JSON con i soli campi previsti, ripuliti dagli spazi", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(201, {
        success: true,
        message: "ok",
        data: makeOrder(),
      }),
    );

    await submitOrder({ ...payload, status: "confirmed" } as OrderPayload);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://api.test/api/v1/orders");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toEqual({
      "Content-Type": "application/json",
      Accept: "application/json",
    });
    expect(init?.credentials).toBeUndefined();
    expect(JSON.parse(init?.body as string)).toEqual({
      first_name: "Mario",
      last_name: "Rossi",
      business_name: "Pizzeria Da Mario",
      phone: "333 123 4567",
      message: "Buongiorno, vorrei 10 kg di pomodori.",
    });
  });

  it("restituisce success con i dati dell'ordine su 201", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(201, {
        success: true,
        message: "La tua richiesta è stata inviata con successo.",
        data: makeOrder({ id: 42 }),
      }),
    );

    const result = await submitOrder(payload);

    expect(result).toEqual({
      kind: "success",
      message: "La tua richiesta è stata inviata con successo.",
      order: makeOrder({ id: 42 }),
    });
  });

  it("considera errore un 201 senza tracking_token", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(201, { success: true, message: "ok", data: { id: 1, status: "new" } }),
    );
    const result = await submitOrder(payload);
    expect(result.kind).toBe("error");
  });

  it("mappa gli errori di validazione 422 sul primo messaggio di ogni campo", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(422, {
        success: false,
        message: "I dati inviati non sono validi. Controlla i campi evidenziati.",
        errors: {
          phone: ["Il campo telefono non contiene un numero di telefono valido.", "Altro"],
          message: ["Il campo richiesta è obbligatorio."],
          unknown_field: ["ignorato"],
        },
      }),
    );

    const result = await submitOrder(payload);

    expect(result).toEqual({
      kind: "validation",
      message: "I dati inviati non sono validi. Controlla i campi evidenziati.",
      errors: {
        phone: "Il campo telefono non contiene un numero di telefono valido.",
        message: "Il campo richiesta è obbligatorio.",
      },
    });
  });

  it("restituisce rate_limited con Retry-After su 429", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        429,
        { success: false, message: "Hai inviato troppe richieste. Riprova tra qualche istante." },
        { "Retry-After": "37" },
      ),
    );

    const result = await submitOrder(payload);

    expect(result).toEqual({
      kind: "rate_limited",
      message: "Hai inviato troppe richieste. Riprova tra qualche istante.",
      retryAfter: 37,
    });
  });

  it("gestisce un 429 senza Retry-After", async () => {
    fetchMock.mockResolvedValue(jsonResponse(429, { success: false, message: "Troppe" }));
    const result = await submitOrder(payload);
    expect(result).toMatchObject({ kind: "rate_limited", retryAfter: null });
  });

  it("restituisce error con il messaggio del backend su 500", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(500, {
        success: false,
        message: "Si è verificato un errore inatteso. Riprova più tardi.",
      }),
    );

    const result = await submitOrder(payload);

    expect(result).toEqual({
      kind: "error",
      message: "Si è verificato un errore inatteso. Riprova più tardi.",
    });
  });

  it("usa un messaggio generico se la risposta non è JSON", async () => {
    fetchMock.mockResolvedValue(new Response("<html>Bad Gateway</html>", { status: 502 }));
    const result = await submitOrder(payload);
    expect(result).toEqual({
      kind: "error",
      message: "Si è verificato un errore inatteso. Riprova più tardi.",
    });
  });

  it("restituisce network senza lanciare eccezioni se fetch fallisce", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    const result = await submitOrder(payload);
    expect(result).toEqual({ kind: "network", message: NETWORK_ERROR_MESSAGE });
  });
});

describe("fetchOrder", () => {
  it("fa una GET senza cache con il codice codificato", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { success: true, message: "ok", data: makeOrder() }));

    await fetchOrder("a/b c");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://api.test/api/v1/orders/a%2Fb%20c");
    expect(init?.method).toBe("GET");
    expect(init?.cache).toBe("no-store");
    expect(init?.headers).toEqual({ Accept: "application/json" });
    expect(init?.credentials).toBeUndefined();
  });

  it("restituisce found con l'ordine su 200", async () => {
    const order = makeOrder({
      status: "confirmed",
      status_label: "Confermato",
      amount: "45.50",
      payment_status: "unpaid",
      payment_status_label: "Da pagare",
      confirmed_at: "2026-11-03T10:05:00+00:00",
    });
    fetchMock.mockResolvedValue(
      jsonResponse(200, { success: true, message: "Dettagli della richiesta.", data: order }),
    );

    expect(await fetchOrder(TOKEN)).toEqual({ kind: "found", order });
  });

  it("restituisce not_found su 404", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(404, { success: false, message: "La risorsa richiesta non esiste." }),
    );
    expect(await fetchOrder(TOKEN)).toEqual({
      kind: "not_found",
      message: "La risorsa richiesta non esiste.",
    });
  });

  it("restituisce rate_limited su 429", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(429, { success: false, message: "Troppe richieste." }, { "Retry-After": "12" }),
    );
    expect(await fetchOrder(TOKEN)).toEqual({
      kind: "rate_limited",
      message: "Troppe richieste.",
      retryAfter: 12,
    });
  });

  it("restituisce error su 500", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(500, {
        success: false,
        message: "Si è verificato un errore inatteso. Riprova più tardi.",
      }),
    );
    expect(await fetchOrder(TOKEN)).toEqual({
      kind: "error",
      message: "Si è verificato un errore inatteso. Riprova più tardi.",
    });
  });

  it("restituisce network senza lanciare eccezioni se fetch fallisce", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    expect(await fetchOrder(TOKEN)).toEqual({ kind: "network", message: NETWORK_ERROR_MESSAGE });
  });
});
