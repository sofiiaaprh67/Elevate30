"use client";

import { useCallback, useEffect, useState, useSyncExternalStore, useTransition } from "react";
import type { removePushSubscription, savePushSubscription } from "@/lib/data/push";
import { VAPID_PUBLIC_KEY } from "@/lib/push-key";
import { PillButton } from "./ui/Pill";
import s from "./Push.module.css";

export type PushActions = { save: typeof savePushSubscription; remove: typeof removePushSubscription };

/**
 * Estado de los avisos en este dispositivo:
 * - unsupported: el navegador no tiene notificaciones push.
 * - install: iPhone/iPad sin instalar la app (Safari solo las da desde la pantalla de inicio).
 * - denied: la persona las bloqueó en los ajustes del navegador.
 * - off / on.
 */
type Status = "loading" | "unsupported" | "install" | "denied" | "off" | "on";

function urlBase64ToBytes(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}
function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
}

async function currentStatus(): Promise<{ status: Status; sub: PushSubscription | null }> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return { status: isIOS() && !isStandalone() ? "install" : "unsupported", sub: null };
  }
  if (Notification.permission === "denied") return { status: "denied", sub: null };
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = reg ? await reg.pushManager.getSubscription() : null;
  return { status: sub && Notification.permission === "granted" ? "on" : "off", sub };
}

export function usePush(actions: PushActions) {
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const refresh = useCallback(() => {
    currentStatus()
      .then(async ({ status, sub }) => {
        // Si el navegador ya estaba suscrito, nos aseguramos de que el servidor lo sabe.
        if (status === "on" && sub) await actions.save(sub.toJSON());
        setStatus(status);
      })
      .catch(() => setStatus("unsupported"));
  }, [actions]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const enable = () =>
    start(async () => {
      setError(null);
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setStatus(permission === "denied" ? "denied" : "off");
          return;
        }
        const reg = (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register("/sw.js", { scope: "/" }));
        await navigator.serviceWorker.ready;
        const sub =
          (await reg.pushManager.getSubscription()) ??
          (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToBytes(VAPID_PUBLIC_KEY) }));
        const res = await actions.save(sub.toJSON());
        if (!res.ok) {
          setError(res.error);
          return;
        }
        setStatus("on");
      } catch {
        setError("Este navegador no ha permitido activar los avisos.");
      }
    });

  const disable = () =>
    start(async () => {
      setError(null);
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub) {
        await actions.remove(sub.endpoint);
        await sub.unsubscribe().catch(() => undefined);
      }
      setStatus("off");
    });

  const test = () =>
    start(async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      await reg?.showNotification("ELEVATE 30", {
        body: "Así te llegará el recordatorio. Si vas justo, con el mínimo ya cuenta.",
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        tag: "e30-test",
      });
    });

  return { status, error, pending, enable, disable, test };
}

/** Bloque de Perfil: activar, probar o desactivar el recordatorio en este dispositivo. */
export function PushSettings({ time, actions }: { time: string; actions: PushActions }) {
  const { status, error, pending, enable, disable, test } = usePush(actions);
  return (
    <div className={s.settings} aria-live="polite">
      <p className={s.state} data-on={status === "on" || undefined}>
        <span className={s.dot} aria-hidden="true" />
        {status === "loading"
          ? "Comprobando este dispositivo…"
          : status === "on"
            ? `Avisos activados en este dispositivo, a las ${time}.`
            : status === "off"
              ? "Avisos desactivados en este dispositivo."
              : status === "denied"
                ? "Has bloqueado las notificaciones de ELEVATE 30."
                : status === "install"
                  ? "En iPhone, los avisos solo llegan con la app instalada."
                  : "Este navegador no puede recibir avisos."}
      </p>
      {status === "install" ? (
        <p className={s.help}>
          En Safari, toca Compartir y luego «Añadir a pantalla de inicio». Abre ELEVATE 30 desde ese icono y vuelve aquí para activarlos.
        </p>
      ) : status === "denied" ? (
        <p className={s.help}>Para recibirlos, permite las notificaciones de esta web en los ajustes de tu navegador o de tu móvil.</p>
      ) : null}
      {status === "off" ? (
        <PillButton type="button" size="sm" loading={pending} onClick={enable}>
          Activar avisos en este dispositivo
        </PillButton>
      ) : status === "on" ? (
        <div className={s.row}>
          <PillButton type="button" size="sm" variant="ghost" loading={pending} onClick={test}>
            Probar
          </PillButton>
          <button type="button" className={s.link} onClick={disable} disabled={pending}>
            Desactivar
          </button>
        </div>
      ) : null}
      {error ? (
        <p className={s.error} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

// "Ahora no" en Hoy: no vuelve a salir en este dispositivo
const KEY = "e30-push-nudge-dismissed";
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const readDismissed = () => {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
};

/** Aviso en Hoy para quien aún no ha activado el recordatorio en este móvil. */
export function PushNudge({ time, actions }: { time: string; actions: PushActions }) {
  const dismissed = useSyncExternalStore(subscribe, readDismissed, () => true);
  const { status, error, pending, enable } = usePush(actions);
  const [justEnabled, setJustEnabled] = useState(false);

  if (justEnabled && status === "on") {
    return (
      <p className={s.nudgeDone} role="status">
        Listo: cada día a las {time} te recordamos tu check-in.
      </p>
    );
  }
  if (dismissed || (status !== "off" && status !== "install")) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* se queda visible */
    }
    listeners.forEach((l) => l());
  };

  return (
    <section className={s.nudge} aria-labelledby="push-nudge-title">
      <span className={s.bell} aria-hidden="true">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5.5 8.5a4.5 4.5 0 0 1 9 0c0 4 1.5 5 1.5 5H4s1.5-1 1.5-5zM8.5 16.5a1.6 1.6 0 0 0 3 0" />
        </svg>
      </span>
      <div className={s.nudgeBody}>
        <h2 className={s.nudgeTitle} id="push-nudge-title">
          Tu recordatorio de las {time}
        </h2>
        <p className={s.nudgeText}>
          {status === "install"
            ? "En iPhone llega con la app instalada: en Safari, toca Compartir y luego «Añadir a pantalla de inicio»."
            : "Un aviso al día, solo si aún no has hecho el check-in. Lo cambias cuando quieras en Perfil."}
        </p>
        {error ? (
          <p className={s.error} role="alert">
            {error}
          </p>
        ) : null}
        <div className={s.row}>
          {status === "off" ? (
            <PillButton
              type="button"
              size="sm"
              loading={pending}
              onClick={() => {
                setJustEnabled(true);
                enable();
              }}
            >
              Activar
            </PillButton>
          ) : null}
          <button type="button" className={s.link} onClick={dismiss}>
            Ahora no
          </button>
        </div>
      </div>
    </section>
  );
}
