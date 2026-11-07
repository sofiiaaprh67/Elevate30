import type { Metadata } from "next";
import { LinkLogin } from "./LinkLogin";

export const metadata: Metadata = { title: "Entrando" };

/**
 * Destino del enlace del email con la plantilla por defecto de Supabase.
 * La sesión llega en el fragmento (#access_token=…), que solo ve el navegador.
 */
export default function EnlacePage() {
  return (
    <main id="contenido" style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: "24px var(--gutter)" }}>
      <LinkLogin />
    </main>
  );
}
