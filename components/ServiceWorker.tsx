"use client";

import { useEffect } from "react";

/** Registra el service worker (solo en producción, para no interferir al desarrollar). */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
      // Sin service worker la app sigue funcionando; solo abre algo más lenta.
    });
  }, []);
  return null;
}
