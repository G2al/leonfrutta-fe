import type { MetadataRoute } from "next";

// Da incrementare quando cambiano le icone: un URL nuovo obbliga Android e il
// service worker a scaricarle di nuovo invece di usare quelle salvate.
const ICON_VERSION = 2;

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "LeonFrutta",
    short_name: "LeonFrutta",
    description: "Invia a LeonFrutta la tua richiesta d'ordine di frutta e verdura.",
    lang: "it",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#15803d",
    // Logo su fondo bianco, generate con: node scripts/generate-icons.mjs
    icons: [
      { src: `/icons/icon-192.png?v=${ICON_VERSION}`, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: `/icons/icon-512.png?v=${ICON_VERSION}`, sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: `/icons/icon-maskable-512.png?v=${ICON_VERSION}`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
