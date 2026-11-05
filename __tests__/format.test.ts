import { describe, expect, it } from "vitest";
import { formatAmount, formatDateTime } from "@/lib/format";

// Intl usa spazi non separabili tra cifra e simbolo: normalizziamo per i confronti.
const plain = (value: string | null) => value?.replace(/\s/g, " ") ?? null;

describe("formatAmount", () => {
  it.each([
    ["45.50", "45,50 €"],
    ["1234.50", "1.234,50 €"],
    ["0.00", "0,00 €"],
    ["1000000", "1.000.000,00 €"],
  ])("%s → %s", (input, expected) => {
    expect(plain(formatAmount(input))).toBe(expected);
  });

  it("restituisce null per importi assenti o non validi", () => {
    expect(formatAmount(null)).toBeNull();
    expect(formatAmount("")).toBeNull();
    expect(formatAmount("abc")).toBeNull();
  });
});

describe("formatDateTime", () => {
  it("converte da UTC all'ora italiana (ora solare)", () => {
    expect(formatDateTime("2026-11-03T10:05:00+00:00")).toBe("3 novembre 2026, 11:05");
  });

  it("converte da UTC all'ora italiana (ora legale)", () => {
    expect(formatDateTime("2026-07-15T22:30:00+00:00")).toBe("16 luglio 2026, 00:30");
  });

  it("restituisce null per date assenti o non valide", () => {
    expect(formatDateTime(null)).toBeNull();
    expect(formatDateTime("non una data")).toBeNull();
  });
});
