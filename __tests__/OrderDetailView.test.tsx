import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { OrderDetailView } from "@/components/OrderDetailView";
import { makeOrder } from "./fixtures";

afterEach(cleanup);

const plain = (text: string | null | undefined) => text?.replace(/\s/g, " ");

describe("OrderDetailView", () => {
  it("richiesta nuova: nessun importo né pagamento", () => {
    render(<OrderDetailView order={makeOrder()} />);

    expect(screen.getByText("Nuovo")).toBeDefined();
    expect(screen.getByText("In attesa di conferma da parte di LeonFrutta.")).toBeDefined();
    expect(screen.queryByTestId("order-amount")).toBeNull();
    expect(screen.queryByText("Da pagare")).toBeNull();
    expect(screen.queryByText("Pagato")).toBeNull();
    expect(screen.getByText("3 novembre 2026, 10:30")).toBeDefined();
  });

  it("confermata non pagata: importo e badge Da pagare", () => {
    render(
      <OrderDetailView
        order={makeOrder({
          status: "confirmed",
          status_label: "Confermato",
          amount: "1234.50",
          payment_status: "unpaid",
          payment_status_label: "Da pagare",
          confirmed_at: "2026-11-03T10:05:00+00:00",
        })}
      />,
    );

    expect(screen.getByText("Confermato")).toBeDefined();
    expect(plain(screen.getByTestId("order-amount").textContent)).toBe("1.234,50 €");
    expect(screen.getByText("Importo comunicato da LeonFrutta")).toBeDefined();
    expect(screen.getByText("Da pagare")).toBeDefined();
    expect(screen.getByText("3 novembre 2026, 11:05")).toBeDefined();
    expect(screen.queryByText("Pagata il")).toBeNull();
  });

  it("confermata pagata: badge Pagato con data di pagamento", () => {
    render(
      <OrderDetailView
        order={makeOrder({
          status: "confirmed",
          status_label: "Confermato",
          amount: "45.50",
          payment_status: "paid",
          payment_status_label: "Pagato",
          confirmed_at: "2026-11-03T10:05:00+00:00",
          paid_at: "2026-11-04T15:00:00+00:00",
        })}
      />,
    );

    expect(plain(screen.getByTestId("order-amount").textContent)).toBe("45,50 €");
    expect(screen.getByText("Pagato")).toBeDefined();
    expect(screen.getByText("Pagata il")).toBeDefined();
    expect(screen.getByText("4 novembre 2026, 16:00")).toBeDefined();
  });

  it("annullata: nessun importo, data di annullamento", () => {
    render(
      <OrderDetailView
        order={makeOrder({
          status: "cancelled",
          status_label: "Annullato",
          cancelled_at: "2026-11-03T12:00:00+00:00",
          // Anche se arrivasse un importo, non va mostrato.
          amount: "10.00",
        })}
      />,
    );

    expect(screen.getByText("Annullato")).toBeDefined();
    expect(
      screen.getByText("Questa richiesta è stata annullata. Per informazioni contatta LeonFrutta."),
    ).toBeDefined();
    expect(screen.queryByTestId("order-amount")).toBeNull();
    expect(screen.getByText("3 novembre 2026, 13:00")).toBeDefined();
  });

  it("mostra il testo dell'ordine come testo semplice, con gli a capo", () => {
    render(<OrderDetailView order={makeOrder({ message: "<b>10 kg</b>\npatate" })} />);
    const message = screen.getByText(/10 kg/);
    expect(message.textContent).toBe("<b>10 kg</b>\npatate");
    expect(message.querySelector("b")).toBeNull();
    expect(message.className).toContain("whitespace-pre-line");
  });
});
