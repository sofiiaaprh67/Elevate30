import type { Metadata } from "next";
import Link from "next/link";
import { Notice } from "@/components/ui/Card";
import s from "./privacidad.module.css";

export const metadata: Metadata = { title: "Política de privacidad" };

export default function PrivacidadPage() {
  return (
    <main id="contenido" className={s.page}>
      <Link href="/entrar" className={s.back}>
        ← Volver
      </Link>
      <p className="eyebrow">Documento provisional</p>
      <h1 className="h2">Política de privacidad</h1>

      <Notice title="Pendiente de revisión legal">
        <p>
          Este texto es un borrador para el piloto de ELEVATE 30 y todavía no ha pasado una revisión legal. Lo
          sustituiremos por la versión definitiva antes de abrir el programa al público.
        </p>
      </Notice>

      <section className={s.section}>
        <h2 className="h3">Qué datos guardamos</h2>
        <ul>
          <li>Tu email, para que puedas entrar sin contraseña.</li>
          <li>
            Tus respuestas al cuestionario inicial: nombre, franja de edad, a qué te dedicas, tiempo libre, energía,
            notas de tu rueda de la vida, objetivo, ejercicio, descanso y qué te ha hecho abandonar otras veces.
          </li>
          <li>Tus check-ins diarios, las acciones de las lecciones y lo que escribes en las revisiones.</li>
          <li>Si participas en el reto en público, los enlaces a los vídeos que nos envíes.</li>
        </ul>
      </section>

      <section className={s.section}>
        <h2 className="h3">Para qué los usamos</h2>
        <p>
          Solo para personalizar tu plan de 30 días, enseñarte tu progreso y que el equipo de ELEVATE pueda
          acompañarte durante el piloto (por ejemplo, escribirte si llevas varios días sin registrar nada). No los
          vendemos ni los usamos para publicidad.
        </p>
      </section>

      <section className={s.section}>
        <h2 className="h3">Quién puede verlos</h2>
        <p>
          Tú y el equipo de ELEVATE que gestiona el piloto. Los datos se guardan en Supabase (base de datos) y la
          app se sirve desde Vercel.
        </p>
      </section>

      <section className={s.section}>
        <h2 className="h3">Tus derechos</h2>
        <p>
          Puedes pedirnos en cualquier momento ver, corregir o borrar tus datos. Escríbenos y lo haremos lo antes
          posible.
        </p>
      </section>

      <section className={s.section}>
        <h2 className="h3">Edad mínima</h2>
        <p>ELEVATE 30 es solo para personas de 18 años o más.</p>
      </section>
    </main>
  );
}
