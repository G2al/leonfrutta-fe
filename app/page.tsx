import { OrderForm } from "@/components/OrderForm";
import { HomeHero, PageShell } from "@/components/PageShell";

export default function Home() {
  return (
    <PageShell header={<HomeHero />}>
      <main className="flex-1">
        <OrderForm
          intro={
            <div className="animate-rise mb-6 text-center [animation-delay:80ms]">
              <h1 className="text-[1.75rem] font-bold leading-tight">
                Cosa ti serve oggi?
              </h1>
              <p className="mt-2 text-base leading-relaxed text-muted">
                Compila i tuoi dati e scrivi la tua richiesta. Ti ricontatteremo
                su WhatsApp per confermare.
              </p>
            </div>
          }
        />
      </main>

      <footer className="mt-10 text-center text-xs text-secondary">
        © {new Date().getFullYear()} LeonFrutta · Frutta e verdura
      </footer>
    </PageShell>
  );
}
