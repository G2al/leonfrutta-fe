import type { Metadata } from "next";
import { MyOrders } from "@/components/MyOrders";
import { PageHeader, PageShell } from "@/components/PageShell";

export const metadata: Metadata = {
  title: "Le mie richieste · LeonFrutta",
};

export default function MyOrdersPage() {
  return (
    <PageShell>
      <PageHeader title="Le mie richieste" subtitle="Stato, importo e pagamento delle richieste inviate." />
      <main className="flex-1">
        <MyOrders />
      </main>
    </PageShell>
  );
}
