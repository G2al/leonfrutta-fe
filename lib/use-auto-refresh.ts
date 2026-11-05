"use client";

import { useEffect, useRef } from "react";

export const AUTO_REFRESH_MS = 60_000;

/**
 * Esegue `refresh` subito, poi al massimo una volta ogni `AUTO_REFRESH_MS`
 * mentre la pagina è visibile e quando torna in primo piano.
 * Restituisce una funzione da chiamare dopo ogni aggiornamento manuale.
 */
export function useAutoRefresh(refresh: () => void) {
  const lastRun = useRef(0);
  const refreshRef = useRef(refresh);

  useEffect(() => {
    refreshRef.current = refresh;
  });

  useEffect(() => {
    const run = () => {
      lastRun.current = Date.now();
      refreshRef.current();
    };
    const runIfDue = () => {
      if (document.visibilityState === "visible" && Date.now() - lastRun.current >= AUTO_REFRESH_MS) {
        run();
      }
    };

    run();
    const timer = window.setInterval(runIfDue, AUTO_REFRESH_MS);
    document.addEventListener("visibilitychange", runIfDue);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", runIfDue);
    };
  }, []);

  return () => {
    lastRun.current = Date.now();
  };
}
