import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OrderForm } from "@/components/OrderForm";
import { appendProduct, mentionsProduct } from "@/lib/products";

describe("appendProduct", () => {
  it("inizia il testo se è vuoto", () => {
    expect(appendProduct("", "Pomodori")).toBe("Pomodori: ");
    expect(appendProduct("   ", "Pomodori")).toBe("Pomodori: ");
  });

  it("aggiunge il prodotto su una nuova riga", () => {
    expect(appendProduct("Pomodori: 10 kg", "Patate")).toBe("Pomodori: 10 kg\nPatate: ");
    expect(appendProduct("Pomodori: 10 kg  ", "Patate")).toBe("Pomodori: 10 kg\nPatate: ");
    expect(appendProduct("Pomodori: 10 kg\n", "Patate")).toBe("Pomodori: 10 kg\nPatate: ");
  });
});

describe("mentionsProduct", () => {
  it("riconosce il prodotto come parola intera, senza maiuscole", () => {
    expect(mentionsProduct("10 kg di pomodori", "Pomodori")).toBe(true);
    expect(mentionsProduct("Mele: 3 cassette", "Mele")).toBe(true);
    expect(mentionsProduct("Melenzane", "Mele")).toBe(false);
    expect(mentionsProduct("", "Mele")).toBe(false);
  });
});

describe("prodotti rapidi nel modulo", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  });
  afterEach(cleanup);

  it("un tocco aggiunge il prodotto al testo e lo segna come scelto", async () => {
    const user = userEvent.setup();
    render(<OrderForm />);
    const textarea = screen.getByLabelText("La tua richiesta") as HTMLTextAreaElement;

    await user.click(screen.getByRole("button", { name: /pomodori/i }));
    await user.click(screen.getByRole("button", { name: /patate/i }));

    expect(textarea.value).toBe("Pomodori:\nPatate: ");
    expect(screen.getByRole("button", { name: /pomodori/i }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: /limoni/i }).getAttribute("aria-pressed")).toBe("false");
  });
});
