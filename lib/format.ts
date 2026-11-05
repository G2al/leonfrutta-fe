const dateParts = new Intl.DateTimeFormat("it-IT", {
  timeZone: "Europe/Rome",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** Data UTC (ISO 8601) mostrata nell'ora italiana, es. "3 novembre 2026, 11:05". */
export function formatDateTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const part = Object.fromEntries(
    dateParts.formatToParts(date).map(({ type, value }) => [type, value]),
  );
  return `${part.day} ${part.month} ${part.year}, ${part.hour}:${part.minute}`;
}

const currency = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  // In italiano le migliaia non vengono separate sotto le 5 cifre senza "always".
  useGrouping: "always",
});

/** Importo dell'API ("1234.50") formattato per la visualizzazione ("1.234,50 €"). */
export function formatAmount(amount: string | null | undefined): string | null {
  if (amount === null || amount === undefined || amount.trim() === "") return null;
  const value = Number(amount);
  return Number.isFinite(value) ? currency.format(value) : null;
}
