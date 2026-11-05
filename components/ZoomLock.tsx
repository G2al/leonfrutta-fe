"use client";

import { useEffect } from "react";

/**
 * iOS Safari ignora `user-scalable=no`: il pinch-zoom si blocca intercettando
 * i suoi eventi `gesture*` e i trascinamenti con più dita.
 * Su Android bastano il meta viewport e `touch-action` in globals.css.
 */
export function ZoomLock() {
  useEffect(() => {
    const prevent = (event: Event) => event.preventDefault();
    const preventPinch = (event: TouchEvent) => {
      if (event.touches.length > 1) event.preventDefault();
    };
    const options = { passive: false } as const;

    for (const type of ["gesturestart", "gesturechange", "gestureend"]) {
      document.addEventListener(type, prevent, options);
    }
    document.addEventListener("touchmove", preventPinch, options);

    return () => {
      for (const type of ["gesturestart", "gesturechange", "gestureend"]) {
        document.removeEventListener(type, prevent);
      }
      document.removeEventListener("touchmove", preventPinch);
    };
  }, []);

  return null;
}
