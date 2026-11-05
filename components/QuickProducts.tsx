import { QUICK_PRODUCTS, mentionsProduct } from "@/lib/products";

interface QuickProductsProps {
  message: string;
  onAdd: (name: string) => void;
}

/** Etichette dei prodotti più richiesti: scorrono in orizzontale. */
export function QuickProducts({ message, onAdd }: QuickProductsProps) {
  return (
    <div className="-mx-5">
      <p id="quick-products-label" className="mb-2 px-5 text-xs font-medium text-muted">
        Tocca per aggiungere un prodotto, poi scrivi la quantità
      </p>
      <ul
        aria-labelledby="quick-products-label"
        className="flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {QUICK_PRODUCTS.map(({ name, emoji }) => {
          const added = mentionsProduct(message, name);
          return (
            <li key={name} className="shrink-0">
              <button
                type="button"
                onClick={() => onAdd(name)}
                aria-pressed={added}
                className={`flex h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-all active:scale-95 ${
                  added
                    ? "border-accent bg-accent text-white shadow-cta"
                    : "border-border-strong/70 bg-surface text-primary hover:border-accent/60 hover:bg-accent-soft"
                }`}
              >
                <span aria-hidden="true" className="text-base leading-none">
                  {emoji}
                </span>
                {name}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
