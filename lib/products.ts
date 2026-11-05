/**
 * Prodotti suggeriti sopra il campo della richiesta: un tocco aggiunge il nome
 * al testo e il cliente scrive solo la quantità. È solo un aiuto alla scrittura
 * (nessun catalogo, nessun prezzo): modifica liberamente questo elenco.
 */
export const QUICK_PRODUCTS: { name: string; emoji: string }[] = [
  { name: "Pomodori", emoji: "🍅" },
  { name: "Patate", emoji: "🥔" },
  { name: "Insalata", emoji: "🥬" },
  { name: "Cipolle", emoji: "🧅" },
  { name: "Zucchine", emoji: "🥒" },
  { name: "Peperoni", emoji: "🫑" },
  { name: "Melanzane", emoji: "🍆" },
  { name: "Carote", emoji: "🥕" },
  { name: "Limoni", emoji: "🍋" },
  { name: "Arance", emoji: "🍊" },
  { name: "Mele", emoji: "🍎" },
  { name: "Banane", emoji: "🍌" },
  { name: "Basilico", emoji: "🌿" },
  { name: "Rucola", emoji: "🥗" },
];

/** `true` se il prodotto compare già nel testo (come parola intera, senza maiuscole). */
export function mentionsProduct(message: string, name: string): boolean {
  return new RegExp(`(^|[^\\p{L}])${name}([^\\p{L}]|$)`, "iu").test(message);
}

/** Aggiunge "Nome: " su una nuova riga, pronto per la quantità. */
export function appendProduct(message: string, name: string): string {
  const line = `${name}: `;
  if (message.trim() === "") return line;
  return message.endsWith("\n") ? message + line : `${message.replace(/[ \t]+$/, "")}\n${line}`;
}
