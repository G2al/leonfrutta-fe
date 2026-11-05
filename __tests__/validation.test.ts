import { describe, expect, it } from "vitest";
import type { OrderPayload } from "@/lib/api/types";
import { trimPayload, validateField, validateOrder } from "@/lib/validation";

const valid: OrderPayload = {
  first_name: "Mario",
  last_name: "Rossi",
  business_name: "Pizzeria Da Mario",
  phone: "333 123 4567",
  message: "10 kg di pomodori",
};

describe("validateOrder", () => {
  it("accetta un modulo valido", () => {
    expect(validateOrder(valid)).toEqual({});
  });

  it("segnala tutti i campi vuoti o con soli spazi", () => {
    const errors = validateOrder({
      first_name: "",
      last_name: "   ",
      business_name: "",
      phone: "",
      message: "  ",
    });
    expect(Object.keys(errors).sort()).toEqual(
      ["business_name", "first_name", "last_name", "message", "phone"],
    );
  });

  it("applica i limiti di lunghezza", () => {
    expect(validateField("first_name", "a".repeat(100))).toBeUndefined();
    expect(validateField("first_name", "a".repeat(101))).toMatch(/100 caratteri/);
    expect(validateField("last_name", "a".repeat(101))).toMatch(/100 caratteri/);
    expect(validateField("business_name", "a".repeat(150))).toBeUndefined();
    expect(validateField("business_name", "a".repeat(151))).toMatch(/150 caratteri/);
    expect(validateField("phone", "3".repeat(26))).toMatch(/25 caratteri/);
  });

  it("richiede tra 5 e 3000 caratteri per la richiesta", () => {
    expect(validateField("message", "uva")).toMatch(/almeno 5/);
    expect(validateField("message", "  uva  ")).toMatch(/almeno 5/);
    expect(validateField("message", "mele")).toMatch(/almeno 5/);
    expect(validateField("message", "pere!")).toBeUndefined();
    expect(validateField("message", "x".repeat(3000))).toBeUndefined();
    expect(validateField("message", "x".repeat(3001))).toMatch(/3000 caratteri/);
  });

  it("conta i caratteri reali, non le unità UTF-16", () => {
    expect(validateField("message", "🍅".repeat(3000))).toBeUndefined();
  });

  it.each([
    "3331234567",
    "333 123 4567",
    "333-123.45.67",
    "+39 333 1234567",
    "0039 333 1234567",
    "06 1234 5678",
    "+44 7911 123456",
  ])("accetta il formato di telefono %s", (phone) => {
    expect(validateField("phone", phone)).toBeUndefined();
  });

  it.each(["abc", "333 abc 4567", "12", "33+3123456"])(
    "rifiuta il telefono %s",
    (phone) => {
      expect(validateField("phone", phone)).toBeDefined();
    },
  );
});

describe("trimPayload", () => {
  it("rimuove gli spazi iniziali e finali da tutti i campi", () => {
    expect(
      trimPayload({
        first_name: " Mario ",
        last_name: "\tRossi\n",
        business_name: " Pizzeria ",
        phone: " 333 123 4567 ",
        message: "\n10 kg di pomodori\n",
      }),
    ).toEqual({
      first_name: "Mario",
      last_name: "Rossi",
      business_name: "Pizzeria",
      phone: "333 123 4567",
      message: "10 kg di pomodori",
    });
  });
});
