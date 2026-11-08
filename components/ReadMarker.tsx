"use client";

import { useEffect, useRef } from "react";
import { logEvent } from "@/lib/data/measure";

/** Marca invisible al final de una lección: si llega a verse, cuenta como leída (para medir). */
export function ReadMarker({ day }: { day: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        logEvent("lesson_read", day).catch(() => undefined);
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, [day]);
  return <div ref={ref} aria-hidden="true" style={{ height: 1 }} />;
}
