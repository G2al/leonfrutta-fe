import { Logo } from "@/components/Logo";
import { OrderForm } from "@/components/OrderForm";
import { PageShell } from "@/components/PageShell";

export default function Home() {
  return (
    <PageShell>
      <header className="flex justify-center pt-2">
        <Logo />
      </header>

      <main className="mt-4 flex-1">
        <OrderForm
          intro={
            <div className="mb-6 text-center">
              <h1 className="text-[1.75rem] font-bold leading-tight">
                Invia la tua richiesta d&apos;ordine
              </h1>
              <p className="mt-2 text-base leading-relaxed text-muted">
                Compila i tuoi dati e scrivi cosa ti serve. Ti ricontatteremo su
                WhatsApp per confermare.
              </p>
            </div>
          }
        />
      </main>

      <footer className="mt-10 text-center text-xs text-secondary">
        © {new Date().getFullYear()} LeonFrutta
      </footer>
    </PageShell>
  );
}
