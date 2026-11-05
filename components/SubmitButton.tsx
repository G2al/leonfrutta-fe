import { CheckIcon, SendIcon, SpinnerIcon } from "./icons";

export type SubmitPhase = "idle" | "sending" | "done";

interface SubmitButtonProps {
  phase: SubmitPhase;
  /** Testo alternativo quando l'invio è bloccato (es. dopo un 429). */
  blockedLabel?: string;
}

/**
 * Pulsante d'invio con barra di avanzamento: durante l'invio si riempie di
 * verde (fino all'85%, la durata reale non è nota), a risposta ricevuta
 * arriva al 100% e mostra la spunta.
 */
export function SubmitButton({ phase, blockedLabel }: SubmitButtonProps) {
  const busy = phase !== "idle";
  const disabled = busy || blockedLabel !== undefined;

  const fill =
    phase === "sending"
      ? "animate-progress"
      : phase === "done"
        ? "w-full transition-[width] duration-300 ease-out"
        : "w-0";

  return (
    <button
      type="submit"
      disabled={disabled}
      className={`relative flex h-14 w-full items-center justify-center overflow-hidden rounded-2xl px-7 text-base font-bold tracking-wide text-white transition-[transform,opacity] duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:active:scale-100 ${
        // Durante l'invio il fondo diventa scuro e la barra verde lo riempie.
        busy ? "bg-primary shadow-ds-md" : "btn-cta disabled:opacity-40"
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 bg-gradient-to-r from-accent to-leaf ${fill}`}
      />
      {phase === "sending" && (
        <span aria-hidden="true" className="animate-shimmer absolute inset-0 bg-[linear-gradient(110deg,transparent_30%,rgb(255_255_255/0.18)_50%,transparent_70%)] bg-[length:200%_100%]" />
      )}

      <span className="relative flex items-center gap-2" aria-live="polite">
        {phase === "sending" ? (
          <>
            <SpinnerIcon width={18} height={18} /> Invio in corso…
          </>
        ) : phase === "done" ? (
          <>
            <CheckIcon width={20} height={20} strokeWidth={3} className="animate-pop" /> Inviata!
          </>
        ) : blockedLabel ? (
          blockedLabel
        ) : (
          <>
            <SendIcon width={18} height={18} /> Invia richiesta
          </>
        )}
      </span>
    </button>
  );
}
