"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { promptInstall, useCanInstall } from "@/lib/install-prompt";
import { CheckIcon, DownloadIcon } from "./icons";

const DISMISS_KEY = "leonfrutta:install-dismissed";
const DISMISS_DAYS = 7;

function recentlyDismissed(): boolean {
  try {
    const at = Number(window.localStorage.getItem(DISMISS_KEY));
    return Number.isFinite(at) && Date.now() - at < DISMISS_DAYS * 86_400_000;
  } catch {
    return false;
  }
}

function rememberDismissal() {
  try {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    // Archivio non disponibile: il popup tornerà alla prossima visita.
  }
}

const BENEFITS = [
  "Apri LeonFrutta con un tocco dalla schermata Home",
  "Si avvia più velocemente, a schermo intero",
  "Nessuno store e nessuna registrazione",
];

/**
 * Popup (bottom sheet) che invita a installare l'app. Compare solo dove il
 * browser supporta `beforeinstallprompt` (Chrome su Android), dopo una breve
 * attesa e non più di una volta ogni 7 giorni se l'utente lo chiude.
 */
export function InstallBanner({ delayMs = 1500 }: { delayMs?: number }) {
  const canInstall = useCanInstall();
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canInstall || recentlyDismissed()) return;
    const timer = window.setTimeout(() => setOpen(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [canInstall, delayMs]);

  useEffect(() => {
    if (!open) return;
    // Focus sul popup (non sul pulsante) così i lettori di schermo lo annunciano
    // senza mostrare un anello di focus non richiesto.
    dialogRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        rememberDismissal();
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function dismiss() {
    rememberDismissal();
    setOpen(false);
  }

  async function install() {
    setOpen(false);
    const accepted = await promptInstall();
    if (!accepted) rememberDismissal();
  }

  if (!open || !canInstall) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        aria-hidden="true"
        onClick={dismiss}
        className="animate-fade-in absolute inset-0 bg-primary/40 backdrop-blur-[2px]"
      />

      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-title"
        aria-describedby="install-description"
        className="animate-sheet-up relative w-full outline-none max-w-lg rounded-t-3xl bg-surface px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3 shadow-ds-lg"
      >
        <div aria-hidden="true" className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-border" />

        <div className="flex items-center gap-4">
          <Image
            src="/icons/icon-192.png"
            alt=""
            width={64}
            height={64}
            className="size-16 shrink-0 rounded-2xl shadow-ds-md ring-1 ring-border"
          />
          <div className="min-w-0">
            <h2 id="install-title" className="text-xl font-bold leading-tight">
              Installa LeonFrutta
            </h2>
            <p id="install-description" className="mt-1 text-sm text-muted">
              Ordina frutta e verdura come da un&apos;app.
            </p>
          </div>
        </div>

        <ul className="mt-5 space-y-2.5">
          {BENEFITS.map((benefit) => (
            <li key={benefit} className="flex items-start gap-3 text-sm leading-snug">
              <span className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                <CheckIcon width={12} height={12} strokeWidth={3} />
              </span>
              {benefit}
            </li>
          ))}
        </ul>

        <div className="mt-6 space-y-2">
          <button
            type="button"
            onClick={() => void install()}
            className="flex h-12 w-full items-center justify-center gap-2 btn-cta rounded-2xl text-base font-bold transition-transform active:scale-[0.98] hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <DownloadIcon width={18} height={18} /> Installa l&apos;app
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="h-11 w-full rounded-xl text-sm font-medium text-muted transition-colors hover:bg-subtle hover:text-primary"
          >
            Non ora
          </button>
        </div>
      </div>
    </div>
  );
}
