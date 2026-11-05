// File di avvio per Plesk (Node.js / Phusion Passenger).
// Avvia la build di produzione di Next.js: prima di avviarlo servono
// `npm install` e `npm run build`.
// CommonJS di proposito: il progetto non è "type": "module" e Passenger carica
// il file così com'è.
/* eslint-disable @typescript-eslint/no-require-imports */
const { createServer } = require("node:http");
const next = require("next");

const port = parseInt(process.env.PORT || "3000", 10);
// Plesk non sempre imposta NODE_ENV: la modalità sviluppo va chiesta esplicitamente.
const dev = process.env.NODE_ENV === "development";

const app = next({ dev, dir: __dirname });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer((req, res) => handle(req, res)).listen(port, () => {
      console.log(`LeonFrutta pronta sulla porta ${port} (${dev ? "sviluppo" : "produzione"})`);
    });
  })
  .catch((error) => {
    console.error("Avvio non riuscito:", error);
    process.exit(1);
  });
