"use client";

import { useSyncExternalStore } from "react";

/** Evento non standard di Chrome/Android: non è nei tipi DOM di TypeScript. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

// Il browser emette l'evento una sola volta per caricamento, anche prima che
// la pagina sia idratata: lo si intercetta al caricamento del modulo e lo si
// conserva finché il pulsante non lo usa.
let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    // Blocca la mini-barra automatica di Chrome: l'installazione parte dal nostro pulsante.
    event.preventDefault();
    deferred = event as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    emit();
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** `true` quando il browser permette di installare l'app (Chrome su Android e desktop). */
export function useCanInstall(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => deferred !== null,
    () => false,
  );
}

/** Apre il prompt nativo di installazione. Restituisce `true` se l'utente ha accettato. */
export async function promptInstall(): Promise<boolean> {
  const event = deferred;
  if (!event) return false;
  // Il prompt si può mostrare una sola volta per evento.
  deferred = null;
  emit();
  try {
    await event.prompt();
    const { outcome } = await event.userChoice;
    return outcome === "accepted";
  } catch {
    return false;
  }
}
