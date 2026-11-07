"use client";

import { useEffect, useRef, useState } from "react";
import { Notice } from "@/components/ui/Card";
import { PillLink } from "@/components/ui/Pill";
import { createClient } from "@/lib/supabase/client";

export function LinkLogin() {
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    // Solo una vez (React en desarrollo ejecuta los efectos dos veces)
    if (started.current) return;
    started.current = true;
    const params = new URLSearchParams(window.location.hash.slice(1));
    // Quita los tokens de la barra de direcciones y del historial
    window.history.replaceState(null, "", window.location.pathname);

    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (!accessToken || !refreshToken) {
      const expired = params.get("error_code") === "otp_expired";
      // eslint-disable-next-line react-hooks/set-state-in-effect -- el fragmento solo existe en el navegador
      setError(
        expired
          ? "Este enlace ya se ha usado o ha caducado. Pide uno nuevo."
          : "No hemos podido iniciar sesión con este enlace. Pide uno nuevo.",
      );
      return;
    }

    createClient()
      .auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error: sessionError }) => {
        if (sessionError) {
          setError("No hemos podido iniciar sesión con este enlace. Pide uno nuevo.");
        } else {
          // Recarga completa para que el servidor lea la sesión nueva
          window.location.replace("/");
        }
      });
  }, []);

  if (error) {
    return (
      <div style={{ display: "grid", gap: 16, width: "100%", maxWidth: 420 }}>
        <Notice title="El enlace no funciona" tone="error">
          <p>{error}</p>
        </Notice>
        <PillLink href="/entrar" block arrow>
          Volver a entrar
        </PillLink>
      </div>
    );
  }

  return (
    <p role="status" className="muted">
      Entrando en ELEVATE 30…
    </p>
  );
}
