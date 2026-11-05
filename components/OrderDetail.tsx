"use client";

import Link from "next/link";
import { useState } from "react";
import { fetchOrder } from "@/lib/api/orders";
import type { Order } from "@/lib/api/types";
import { removeSavedOrder } from "@/lib/my-orders";
import { useAutoRefresh } from "@/lib/use-auto-refresh";
import { useOnlineStatus } from "@/lib/use-online-status";
import { Notice } from "./Notice";
import { OrderDetailView } from "./OrderDetailView";
import { RefreshButton } from "./RefreshButton";

type State =
  | { kind: "loading" }
  | { kind: "found"; order: Order }
  | { kind: "not_found" }
  | { kind: "failed"; message: string; offline: boolean };

const OFFLINE_STALE = "Sei offline: lo stato potrebbe non essere aggiornato.";

export function OrderDetail({ token }: { token: string }) {
  const [state, setState] = useState<State>({ kind: "loading" });
  // Errore di un aggiornamento successivo: i dati già mostrati restano visibili.
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const online = useOnlineStatus();

  async function load() {
    setRefreshing(true);
    const result = await fetchOrder(token);
    setRefreshing(false);

    switch (result.kind) {
      case "found":
        setState({ kind: "found", order: result.order });
        setRefreshError(null);
        return;
      case "not_found":
        removeSavedOrder(token);
        setState({ kind: "not_found" });
        return;
      default:
        if (state.kind === "found") {
          setRefreshError(result.message);
        } else {
          setState({ kind: "failed", message: result.message, offline: result.kind === "network" });
        }
    }
  }

  const markRefreshed = useAutoRefresh(() => void load());

  function handleRefresh() {
    markRefreshed();
    void load();
  }

  if (state.kind === "loading") {
    return (
      <div role="status" aria-live="polite" className="space-y-4">
        <span className="sr-only">Caricamento della richiesta…</span>
        <div className="h-36 animate-pulse rounded-2xl bg-border/60" />
        <div className="h-44 animate-pulse rounded-2xl bg-border/60" />
      </div>
    );
  }

  if (state.kind === "not_found") {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 text-center">
        <h2 className="text-xl font-semibold">Richiesta non trovata</h2>
        <p className="mt-2 text-base leading-relaxed text-muted">
          Il codice non è valido o la richiesta non è più disponibile. Se era
          salvata su questo dispositivo, l&apos;abbiamo tolta da &quot;Le mie richieste&quot;.
        </p>
        <Link
          href="/richieste"
          className="mt-5 inline-flex h-12 items-center justify-center rounded-lg border border-primary px-7 text-base font-medium hover:bg-primary/5"
        >
          Vai a Le mie richieste
        </Link>
      </div>
    );
  }

  if (state.kind === "failed") {
    return (
      <div className="space-y-4">
        <Notice tone="error" icon={state.offline ? "offline" : "alert"}>
          {state.message}
        </Notice>
        <RefreshButton onClick={handleRefresh} loading={refreshing} label="Riprova" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!online && (
        <Notice tone="warning" icon="offline">
          {OFFLINE_STALE}
        </Notice>
      )}
      {online && refreshError && <Notice tone="error">{refreshError}</Notice>}
      <OrderDetailView order={state.order} />
      <RefreshButton onClick={handleRefresh} loading={refreshing} />
    </div>
  );
}
