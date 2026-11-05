import { RefreshIcon } from "./icons";

interface RefreshButtonProps {
  onClick: () => void;
  loading: boolean;
  label?: string;
}

export function RefreshButton({ onClick, loading, label = "Aggiorna" }: RefreshButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-primary px-7 text-base font-medium text-primary transition-colors hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40"
    >
      <RefreshIcon width={18} height={18} className={loading ? "animate-spin" : undefined} />
      {loading ? "Aggiornamento…" : label}
    </button>
  );
}
