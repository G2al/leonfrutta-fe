// Genera le icone PWA dal logo (public/leonfrutta-logo.webp), centrato su fondo bianco.
// Uso: node scripts/generate-icons.mjs  (da rieseguire se cambia il logo)
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = new URL("../public/", import.meta.url);
const logo = fileURLToPath(new URL("leonfrutta-logo.webp", root));
const out = new URL("icons/", root);
mkdirSync(out, { recursive: true });

/** `padding` è la frazione del lato lasciata libera attorno al logo. */
async function icon(file, size, padding) {
  const inner = Math.round(size * (1 - padding * 2));
  // trim() toglie i margini trasparenti, così il logo riempie l'icona.
  const trimmed = await sharp(logo).trim().toBuffer();
  const resized = await sharp(trimmed)
    .resize(inner, inner, { fit: "contain", background: "#ffffff" })
    .toBuffer();
  await sharp({ create: { width: size, height: size, channels: 3, background: "#ffffff" } })
    .composite([{ input: resized, gravity: "center" }])
    .png()
    .toFile(fileURLToPath(new URL(file, out)));
}

await icon("icon-192.png", 192, 0.04);
await icon("icon-512.png", 512, 0.04);
// Le icone "maskable" possono essere ritagliate a cerchio: serve più margine.
await icon("icon-maskable-512.png", 512, 0.12);
await icon("apple-touch-icon.png", 180, 0.05);
console.log("Icone generate in public/icons");
