import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OrderForm } from "@/components/OrderForm";
import { TOKEN, breakLocalStorage, jsonResponse, makeOrder } from "./fixtures";

const fetchMock = vi.fn<typeof fetch>();
const realLocalStorage = Object.getOwnPropertyDescriptor(window, "localStorage")!;

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Nome"), "Mario");
  await user.type(screen.getByLabelText("Cognome"), "Rossi");
  await user.type(screen.getByLabelText("Nome dell'attività"), "Pizzeria Da Mario");
  await user.type(screen.getByLabelText("Telefono"), "333 123 4567");
  await user.type(screen.getByLabelText("La tua richiesta"), "10 kg di pomodori");
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_API_URL", "http://api.test");
  vi.stubGlobal("fetch", fetchMock);
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  Object.defineProperty(window, "localStorage", realLocalStorage);
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe("OrderForm", () => {
  it("mostra gli errori lato client e non chiama l'API se il modulo è vuoto", async () => {
    const user = userEvent.setup();
    render(<OrderForm />);

    await user.click(screen.getByRole("button", { name: /invia richiesta/i }));

    expect(fetchMock).not.toHaveBeenCalled();
    const nome = screen.getByLabelText("Nome");
    expect(nome).toHaveProperty("ariaInvalid", "true");
    expect(document.activeElement).toBe(nome);
    expect(screen.getByText("Il campo nome è obbligatorio.")).toBeDefined();
    expect(nome.getAttribute("aria-describedby")).toContain("order-first_name-error");
  });

  it("mostra la conferma con il numero della richiesta dopo un 201", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(201, {
        success: true,
        message: "La tua richiesta è stata inviata con successo.",
        data: makeOrder({ id: 17 }),
      }),
    );
    const user = userEvent.setup();
    render(<OrderForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: /invia richiesta/i }));

    expect(await screen.findByText("Richiesta inviata!")).toBeDefined();
    expect(screen.getByText("#17")).toBeDefined();
    // 09:30 UTC → 10:30 ora italiana (CET)
    expect(screen.getByText("3 novembre 2026, 10:30")).toBeDefined();
    expect(
      screen.getByRole("link", { name: "Segui la tua richiesta" }).getAttribute("href"),
    ).toBe(`/richieste/${TOKEN}`);

    // In "Le mie richieste" finiscono solo codice, numero, attività e data.
    const orders = JSON.parse(window.localStorage.getItem("leonfrutta:orders") ?? "[]");
    expect(orders).toEqual([
      {
        tracking_token: TOKEN,
        id: 17,
        business_name: "Pizzeria Da Mario",
        created_at: "2026-11-03T09:30:00+00:00",
      },
    ]);

    // Il testo dell'ordine non viene salvato, i dati anagrafici sì.
    const saved = JSON.parse(window.localStorage.getItem("leonfrutta:contact") ?? "{}");
    expect(saved).toEqual({
      first_name: "Mario",
      last_name: "Rossi",
      business_name: "Pizzeria Da Mario",
      phone: "333 123 4567",
    });

    await user.click(screen.getByRole("button", { name: /invia un'altra richiesta/i }));
    expect((screen.getByLabelText("La tua richiesta") as HTMLTextAreaElement).value).toBe("");
    expect((screen.getByLabelText("Nome") as HTMLInputElement).value).toBe("Mario");
  });

  it("funziona e mostra il numero anche se localStorage non è disponibile", async () => {
    breakLocalStorage();
    fetchMock.mockResolvedValue(
      jsonResponse(201, { success: true, message: "ok", data: makeOrder({ id: 99 }) }),
    );
    const user = userEvent.setup();
    render(<OrderForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: /invia richiesta/i }));

    expect(await screen.findByText("Richiesta inviata!")).toBeDefined();
    expect(screen.getByText("#99")).toBeDefined();
    expect(screen.getByText(/annota il numero della richiesta/i)).toBeDefined();
  });

  it("mostra gli errori 422 del backend sotto i campi corretti", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(422, {
        success: false,
        message: "I dati inviati non sono validi. Controlla i campi evidenziati.",
        errors: { phone: ["Il campo telefono non contiene un numero di telefono valido."] },
      }),
    );
    const user = userEvent.setup();
    render(<OrderForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: /invia richiesta/i }));

    expect(
      await screen.findByText("Il campo telefono non contiene un numero di telefono valido."),
    ).toBeDefined();
    await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText("Telefono")));
  });

  it("conserva i dati inseriti in caso di errore di rete", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    const user = userEvent.setup();
    render(<OrderForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: /invia richiesta/i }));

    expect(
      await screen.findByText("Connessione assente o servizio non raggiungibile. Riprova."),
    ).toBeDefined();
    expect((screen.getByLabelText("La tua richiesta") as HTMLTextAreaElement).value).toBe(
      "10 kg di pomodori",
    );
    expect((screen.getByLabelText("Telefono") as HTMLInputElement).value).toBe("333 123 4567");
  });

  it("disabilita l'invio dopo un 429", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ success: false, message: "Hai inviato troppe richieste. Riprova tra qualche istante." }),
        { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "30" } },
      ),
    );
    const user = userEvent.setup();
    render(<OrderForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: /invia richiesta/i }));

    expect(
      await screen.findByText("Hai inviato troppe richieste. Riprova tra qualche istante."),
    ).toBeDefined();
    const button = screen.getByRole("button", { name: /riprova tra/i }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });
});
