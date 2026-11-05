import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  addSavedOrder,
  isStorageAvailable,
  loadSavedOrders,
  removeSavedOrder,
} from "@/lib/my-orders";
import { breakLocalStorage, makeOrder } from "./fixtures";

const realLocalStorage = Object.getOwnPropertyDescriptor(window, "localStorage")!;

beforeEach(() => window.localStorage.clear());
afterEach(() => Object.defineProperty(window, "localStorage", realLocalStorage));

describe("my-orders", () => {
  it("salva solo codice, numero, attività e data", () => {
    expect(addSavedOrder(makeOrder())).toBe(true);
    const raw = window.localStorage.getItem("leonfrutta:orders") ?? "";
    expect(JSON.parse(raw)).toEqual([
      {
        tracking_token: "01a1a105-4c31-708e-961a-11cad464f992",
        id: 12,
        business_name: "Pizzeria Da Mario",
        created_at: "2026-11-03T09:30:00+00:00",
      },
    ]);
    expect(raw).not.toContain("pomodori");
  });

  it("ordina dalla più recente e non duplica lo stesso codice", () => {
    addSavedOrder(makeOrder({ id: 1, tracking_token: "a", created_at: "2026-11-01T09:00:00Z" }));
    addSavedOrder(makeOrder({ id: 3, tracking_token: "c", created_at: "2026-11-03T09:00:00Z" }));
    addSavedOrder(makeOrder({ id: 2, tracking_token: "b", created_at: "2026-11-02T09:00:00Z" }));
    addSavedOrder(makeOrder({ id: 2, tracking_token: "b", created_at: "2026-11-02T09:00:00Z" }));

    expect(loadSavedOrders().map((o) => o.id)).toEqual([3, 2, 1]);
  });

  it("rimuove una richiesta dall'elenco", () => {
    addSavedOrder(makeOrder({ tracking_token: "a" }));
    addSavedOrder(makeOrder({ tracking_token: "b" }));
    removeSavedOrder("a");
    expect(loadSavedOrders().map((o) => o.tracking_token)).toEqual(["b"]);
  });

  it("ignora dati salvati corrotti", () => {
    window.localStorage.setItem("leonfrutta:orders", "{non json");
    expect(loadSavedOrders()).toEqual([]);
    window.localStorage.setItem("leonfrutta:orders", JSON.stringify([{ id: "x" }, null]));
    expect(loadSavedOrders()).toEqual([]);
  });

  it("non lancia eccezioni se localStorage non è disponibile", () => {
    breakLocalStorage();
    expect(isStorageAvailable()).toBe(false);
    expect(loadSavedOrders()).toEqual([]);
    expect(addSavedOrder(makeOrder())).toBe(false);
    expect(() => removeSavedOrder("x")).not.toThrow();
  });
});
