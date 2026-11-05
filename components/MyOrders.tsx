"use client";

import Link from "next/link";
import { useState } from "react";
import { fetchOrder } from "@/lib/api/orders";
import {
  isStorageAvailable,
  loadSavedOrders,
  removeSavedOrder,
  type SavedOrder,
} from "@/lib/my-orders";
import { useAutoRefresh } from "@/lib/use-auto-refresh";
import { useOnlineStatus } from "@/lib/use-online-status";
import { PlusIcon } from "./icons";
import { Notice } from "./Notice";
import { OrderCard, type CardStatus } from "./OrderCard";
import { RefreshButton } from "./RefreshButton";

const LOADING: CardStatus = { kind: "loading" };

export function MyOrders() {
  // null finché non abbiamo letto l'archivio locale (solo lato client).
  const [saved, setSaved] = useState<SavedOrder[] | null>(null);
  const [statuses, setStatuses] = useState<Record<string, CardStatus>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removedCount, setRemovedCount] = useState(0);
  const [storageOk, setStorageOk] = useState(true);
  const online = useOnlineStatus();

  async function refresh() {
    const list = loadSavedOrders();
    setSaved(list);
    setStorageOk(isStorageAvailable());
    if (list.length === 0) return;

    // Offline: nessuna chiamata, si mostra solo l'ultimo stato già letto.
    if (!navigator.onLine) {
      setStatuses((current) => {
        const next = { ...current };
        for (const { tracking_token } of list) {
          if (next[tracking_token]?.kind !== "loaded") next[tracking_token] = { kind: "unavailable" };
        }
        return next;
      });
      return;
    }

    setRefreshing(true);
    const results = await Promise.all(list.map((o) => fetchOrder(o.tracking_token)));
    setRefreshing(false);

    let removed = 0;
    let failure: string | null = null;
    const updates: Record<string, CardStatus | null> = {};

    list.forEach(({ tracking_token }, index) => {
      const result = results[index];
      switch (result.kind) {
        case "found":
          updates[tracking_token] = { kind: "loaded", order: result.order };
          break;
        case "not_found":
          removeSavedOrder(tracking_token);
          updates[tracking_token] = null;
          removed += 1;
          break;
        default:
          failure ??= result.message;
          updates[tracking_token] = null;
      }
    });

    setStatuses((current) => {
      const next = { ...current };
      for (const [token, update] of Object.entries(updates)) {
        if (update) next[token] = update;
        else if (next[token]?.kind !== "loaded") next[token] = { kind: "unavailable" };
      }
      return next;
    });
    setError(failure);
    if (removed > 0) {
      setRemovedCount((count) => count + removed);
      setSaved(loadSavedOrders());
    }
  }

  const markRefreshed = useAutoRefresh(() => void refresh());

  function handleRefresh() {
    markRefreshed();
    void refresh();
  }

  function handleRemove(token: string) {
    removeSavedOrder(token);
    setSaved((current) => current?.filter((o) => o.tracking_token !== token) ?? null);
  }

  if (saved === null) {
    return <div className="h-40 animate-pulse rounded-2xl bg-border/60" aria-hidden="true" />;
  }

  return (
    <div className="space-y-4">
      {!online && (
        <Notice tone="warning" icon="offline">
          Sei offline: lo stato potrebbe non essere aggiornato.
        </Notice>
      )}
      {online && error && <Notice tone="error">{error}</Notice>}
      {removedCount > 0 && (
        <p role="status" className="rounded-lg bg-subtle px-4 py-3 text-sm text-muted">
          {removedCount === 1
            ? "Una richiesta non è più disponibile ed è stata tolta dall'elenco."
            : `${removedCount} richieste non sono più disponibili e sono state tolte dall'elenco.`}
        </p>
      )}
      {!storageOk && (
        <Notice tone="warning">
          Questo browser non permette di salvare le richieste sul dispositivo (ad
          esempio in navigazione privata). Annota il numero di ogni richiesta inviata.
        </Notice>
      )}

      {saved.length === 0 ? (
        <div className="animate-rise rounded-3xl border border-border bg-surface p-6 text-center shadow-ds-md">
          <div aria-hidden="true" className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-accent-soft text-3xl">
            🧺
          </div>
          <h2 className="text-lg font-semibold">Nessuna richiesta su questo dispositivo</h2>
          <p className="mt-2 text-base leading-relaxed text-muted">
            Le richieste che invii da qui compariranno in questo elenco, con il loro stato.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex h-12 items-center justify-center gap-2 btn-cta rounded-2xl px-7 text-base font-bold transition-transform active:scale-[0.98]"
          >
            <PlusIcon width={18} height={18} /> Nuovo ordine
          </Link>
        </div>
      ) : (
        <>
          <ul className="space-y-3" aria-label="Richieste inviate">
            {saved.map((order) => (
              <OrderCard
                key={order.tracking_token}
                saved={order}
                status={statuses[order.tracking_token] ?? LOADING}
                onRemove={() => handleRemove(order.tracking_token)}
              />
            ))}
          </ul>
          <RefreshButton onClick={handleRefresh} loading={refreshing} />
        </>
      )}

      <p className="text-center text-xs leading-relaxed text-muted">
        Le richieste sono visibili solo su questo dispositivo e in questo browser,
        perché non serve un account. Se cancelli i dati del browser l&apos;elenco
        si svuota, ma le richieste restano valide per LeonFrutta.
      </p>
    </div>
  );
}
