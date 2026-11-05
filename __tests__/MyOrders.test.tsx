import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MyOrders } from "@/components/MyOrders";
import { OrderDetail } from "@/components/OrderDetail";
import { addSavedOrder, loadSavedOrders } from "@/lib/my-orders";
import { breakLocalStorage, jsonResponse, makeOrder } from "./fixtures";

const fetchMock = vi.fn<typeof fetch>();
const realLocalStorage = Object.getOwnPropertyDescriptor(window, "localStorage")!;

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_API_URL", "http://api.test");
  vi.stubGlobal("fetch", fetchMock);
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  Object.defineProperty(window, "localStorage", realLocalStorage);
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

function respondWith(byToken: Record<string, Response>) {
  fetchMock.mockImplementation(async (input) => {
    const token = decodeURIComponent(String(input).split("/").pop() ?? "");
    return byToken[token] ?? jsonResponse(500, { success: false, message: "?" });
  });
}

describe("MyOrders", () => {
  it("mostra lo stato vuoto con il link al modulo", async () => {
    render(<MyOrders />);
    expect(await screen.findByText("Nessuna richiesta su questo dispositivo")).toBeDefined();
    expect(screen.getByRole("link", { name: /nuovo ordine/i }).getAttribute("href")).toBe("/");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("carica lo stato aggiornato e rimuove le richieste non più esistenti (404)", async () => {
    addSavedOrder(makeOrder({ id: 1, tracking_token: "ok", created_at: "2026-11-02T09:00:00Z" }));
    addSavedOrder(makeOrder({ id: 2, tracking_token: "gone", created_at: "2026-11-03T09:00:00Z" }));
    respondWith({
      ok: jsonResponse(200, {
        success: true,
        message: "ok",
        data: makeOrder({
          id: 1,
          tracking_token: "ok",
          status: "confirmed",
          status_label: "Confermato",
          amount: "45.50",
          payment_status: "unpaid",
          payment_status_label: "Da pagare",
        }),
      }),
      gone: jsonResponse(404, { success: false, message: "La risorsa richiesta non esiste." }),
    });

    render(<MyOrders />);

    expect(await screen.findByText("Confermato")).toBeDefined();
    expect(screen.getByText("Da pagare")).toBeDefined();
    expect(screen.getByText(/45,50/)).toBeDefined();
    expect(
      await screen.findByText("Una richiesta non è più disponibile ed è stata tolta dall'elenco."),
    ).toBeDefined();
    expect(screen.queryByText("Richiesta #2")).toBeNull();
    expect(loadSavedOrders().map((o) => o.tracking_token)).toEqual(["ok"]);
  });

  it("rimuove una richiesta solo dopo la conferma", async () => {
    addSavedOrder(makeOrder({ id: 5, tracking_token: "t5" }));
    respondWith({ t5: jsonResponse(200, { success: true, message: "ok", data: makeOrder({ id: 5, tracking_token: "t5" }) }) });
    const user = userEvent.setup();
    render(<MyOrders />);

    await user.click(await screen.findByRole("button", { name: /rimuovi la richiesta #5/i }));
    expect(screen.getByText(/non\s+viene annullata/)).toBeDefined();
    await user.click(screen.getByRole("button", { name: "Rimuovi" }));

    expect(screen.queryByText("Richiesta #5")).toBeNull();
    expect(loadSavedOrders()).toEqual([]);
  });

  it("funziona anche se localStorage non è disponibile", async () => {
    breakLocalStorage();
    render(<MyOrders />);
    expect(await screen.findByText("Nessuna richiesta su questo dispositivo")).toBeDefined();
    expect(screen.getByText(/non permette di salvare le richieste/)).toBeDefined();
  });
});

describe("OrderDetail", () => {
  it("mostra 'richiesta non trovata' e rimuove il codice dopo un 404", async () => {
    addSavedOrder(makeOrder({ tracking_token: "missing" }));
    respondWith({
      missing: jsonResponse(404, { success: false, message: "La risorsa richiesta non esiste." }),
    });

    render(<OrderDetail token="missing" />);

    expect(await screen.findByText("Richiesta non trovata")).toBeDefined();
    expect(loadSavedOrders()).toEqual([]);
  });

  it("mostra il dettaglio di una richiesta confermata", async () => {
    respondWith({
      abc: jsonResponse(200, {
        success: true,
        message: "ok",
        data: makeOrder({
          tracking_token: "abc",
          status: "confirmed",
          status_label: "Confermato",
          amount: "45.50",
          payment_status: "paid",
          payment_status_label: "Pagato",
          paid_at: "2026-11-04T15:00:00+00:00",
        }),
      }),
    });

    render(<OrderDetail token="abc" />);

    expect(await screen.findByText("Pagato")).toBeDefined();
    expect(screen.getByTestId("order-amount").textContent?.replace(/\s/g, " ")).toBe("45,50 €");
  });

  it("mostra un errore se il backend non risponde", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    render(<OrderDetail token="abc" />);
    expect(
      await screen.findByText("Connessione assente o servizio non raggiungibile. Riprova."),
    ).toBeDefined();
    expect(screen.getByRole("button", { name: "Riprova" })).toBeDefined();
  });
});
