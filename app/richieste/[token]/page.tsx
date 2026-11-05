import type { Metadata } from "next";
import { OrderDetail } from "@/components/OrderDetail";
import { PageHeader, PageShell } from "@/components/PageShell";

export const metadata: Metadata = {
  title: "Dettaglio richiesta · LeonFrutta",
  // Il link contiene il codice segreto: la pagina non va indicizzata.
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function OrderDetailPage({ params }: PageProps<"/richieste/[token]">) {
  const { token } = await params;
  let decoded = token;
  try {
    decoded = decodeURIComponent(token);
  } catch {
    // Codice malformato: lo passiamo così com'è, l'API risponderà 404.
  }

  return (
    <PageShell>
      <PageHeader
        title="Dettaglio richiesta"
        back={{ href: "/richieste", label: "Le mie richieste" }}
      />
      <main className="flex-1">
        <OrderDetail token={decoded} />
      </main>
    </PageShell>
  );
}
