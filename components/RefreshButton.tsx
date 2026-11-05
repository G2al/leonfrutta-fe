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
      className="flex h-12 w-full items-center justify-center gap-2 btn-outline rounded-2xl px-7 text-base font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40"
    >
      <RefreshIcon width={18} height={18} className={loading ? "animate-spin" : undefined} />
      {loading ? "Aggiornamento…" : label}
    </button>
  );
}
