import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/Card";
import { PillLink } from "@/components/ui/Pill";
import { formatLongDate, type ISODate } from "@/lib/domain/program";
import s from "../shell.module.css";

/** Hoy antes de que empiece el programa. */
export function CountdownView({ start, daysLeft, hasPlan }: { start: ISODate; daysLeft: number; hasPlan: boolean }) {
  return (
    <>
      <PageHeader title="Cuenta atrás" subtitle={`ELEVATE 30 empieza el ${formatLongDate(start)}.`} />
      <Card tone="carbon" className={s.countdown}>
        <p className={s.countNum}>{daysLeft}</p>
        <p className={s.countLabel}>{daysLeft === 1 ? "día para empezar" : "días para empezar"}</p>
        <p className="muted">
          {hasPlan
            ? "Tu plan ya está listo. Repásalo cuando quieras antes de empezar."
            : "Mientras tanto, completa tu cuestionario para tener tu plan listo el día 1."}
        </p>
      </Card>
      <PillLink href={hasPlan ? "/plan" : "/cuestionario"} variant={hasPlan ? "ghost" : "blue"} block arrow>
        {hasPlan ? "Ver tu plan" : "Hacer el cuestionario"}
      </PillLink>
    </>
  );
}
