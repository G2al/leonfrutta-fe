// Genera le icone dal logo (public/leonfrutta-logo.webp), centrato su fondo bianco.
// Uso: node scripts/generate-icons.mjs
// Se cambia il logo: riesegui lo script e incrementa ICON_VERSION in app/manifest.ts
// e CACHE in public/sw.js, altrimenti i telefoni con l'app installata continuano
// a mostrare l'icona vecchia.
import { mkdirSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = new URL("../public/", import.meta.url);
const app = new URL("../app/", import.meta.url);
const logo = fileURLToPath(new URL("leonfrutta-logo.webp", root));
const out = new URL("icons/", root);
mkdirSync(out, { recursive: true });

/** `padding` è la frazione del lato lasciata libera attorno al logo. */
async function icon(target, size, padding) {
  const inner = Math.round(size * (1 - padding * 2));
  // trim() toglie i margini trasparenti, così il logo riempie l'icona.
  const trimmed = await sharp(logo).trim().toBuffer();
  const resized = await sharp(trimmed)
    .resize(inner, inner, { fit: "contain", background: "#ffffff" })
    .toBuffer();
  await sharp({ create: { width: size, height: size, channels: 3, background: "#ffffff" } })
    .composite([{ input: resized, gravity: "center" }])
    .png()
    .toFile(fileURLToPath(target));
}

// Manifest PWA (Android, Chrome desktop).
await icon(new URL("icon-192.png", out), 192, 0.06);
await icon(new URL("icon-512.png", out), 512, 0.06);
// Android ritaglia le icone "maskable" (cerchio, goccia…): il logo deve stare
// nella zona sicura centrale, quindi più margine bianco.
await icon(new URL("icon-maskable-512.png", out), 512, 0.12);
// Favicon e icona iOS: file convenzionali di Next, linkati in automatico con
// un parametro di versione che cambia a ogni modifica.
await icon(new URL("icon.png", app), 96, 0.02);
await icon(new URL("apple-icon.png", app), 180, 0.08);

// Sostituita da app/apple-icon.png.
rmSync(new URL("apple-touch-icon.png", out), { force: true });
console.log("Icone generate in public/icons e app/");
