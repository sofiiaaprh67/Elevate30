"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * Autoguardado de una respuesta escrita (tabla `entries`).
 * - Guarda en el dispositivo en cada cambio (no se pierde si se cierra la app).
 * - Guarda en Supabase 700 ms después de dejar de escribir y al salir de la página.
 */
export function useAutosave<T extends Record<string, unknown>>({
  userId,
  kind,
  day,
  initial,
}: {
  userId: string;
  kind: string;
  day: number;
  initial: T;
}) {
  const storageKey = `e30:entry:${userId}:${kind}:${day}`;
  const [value, setValue] = useState<T>(initial);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const pending = useRef<T | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const flush = useCallback(async () => {
    window.clearTimeout(timer.current);
    const data = pending.current;
    if (!data) return;
    pending.current = null;
    setStatus("saving");
    const { error } = await createClient()
      .from("entries")
      .upsert({ user_id: userId, kind, day, data }, { onConflict: "user_id,kind,day" });
    if (error) {
      pending.current = pending.current ?? data;
      setStatus("error");
    } else {
      setStatus("saved");
      try {
        localStorage.removeItem(storageKey);
      } catch {}
    }
  }, [userId, kind, day, storageKey]);

  // Recupera un borrador que no llegó al servidor
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const draft = JSON.parse(raw) as T;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage solo existe tras montar
        setValue(draft);
        pending.current = draft;
        void flush();
      }
    } catch {}
  }, [storageKey, flush]);

  // Guarda al ocultar la app o cerrar la pestaña
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") void flush();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
      void flush();
    };
  }, [flush]);

  const update = useCallback(
    (patch: Partial<T>) => {
      setValue((prev) => {
        const next = { ...prev, ...patch };
        pending.current = next;
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {}
        return next;
      });
      setStatus("idle");
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => void flush(), 700);
    },
    [flush, storageKey],
  );

  return { value, update, status, flush };
}
