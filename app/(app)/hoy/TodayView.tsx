import Link from "next/link";
import { DayRing } from "@/components/DayRing";
import { PhaseStrip } from "@/components/PhaseStrip";
import { forYouForDay } from "@/content/forYou";
import { lessonForDay } from "@/content/lessons";
import type { setHardWeek, setLightDay } from "@/lib/data/day";
import type { EntryKind } from "@/lib/data/progress";
import { addDays, formatLongDate, phaseForDay, weekOfDay, type ISODate } from "@/lib/domain/program";
import { alerts, groupByDate, streak, streakStatus, type Checkin as CheckinRow } from "@/lib/domain/stats";
import type { Intake, Plan, Slot } from "@/lib/domain/types";
import { AnchorIcon, Checkin } from "./Checkin";
import { DayModeToggle, HardWeekButton } from "./DayMode";
import { LessonArticle } from "./LessonArticle";
import h from "./hoy.module.css";

const PHASE_NAME = { DECIDIR: "Decidir", CUMPLIR: "Cumplir", REVISAR: "Revisar", REPETIR: "Repetir", CIERRE: "Cierre" };
const PHASE_LINE = {
  DECIDIR: "Esta semana decides cómo será tu sistema.",
  CUMPLIR: "Esta semana el objetivo es no dejar días en blanco.",
  REVISAR: "Esta semana ajustas con tus datos.",
  REPETIR: "Esta semana conviertes el esfuerzo en costumbre.",
  CIERRE: "Los dos últimos días: mira lo construido y decide lo que sigue.",
};

/** Pantalla Hoy durante el programa (días 1–30). */
export function TodayView({
  userId,
  start,
  today,
  day,
  intake,
  plan,
  checkins,
  actionDone,
  entries,
  dayOneChange,
  anchor,
  hardWeekUntil,
  light,
  pendingLesson,
  actions,
}: {
  userId: string;
  start: ISODate;
  today: ISODate;
  day: number;
  intake: Intake;
  plan: Plan;
  checkins: CheckinRow[];
  actionDone: boolean;
  entries: Partial<Record<EntryKind, Record<string, unknown>>>;
  dayOneChange?: string;
  anchor: Slot | null;
  /** Último día del modo semana difícil, si está activo. */
  hardWeekUntil: ISODate | null;
  /** Hoy la persona ha elegido "Hoy voy justo". */
  light: boolean;
  /** Lección de ayer que quedó esperando por "Hoy voy justo". */
  pendingLesson: { day: number; title: string; href: string } | null;
  /** Server Actions (se pasan como props para poder previsualizar sin base de datos). */
  actions: { setLightDay: typeof setLightDay; setHardWeek: typeof setHardWeek };
}) {
  const lesson = lessonForDay(day)!;
  const byDate = groupByDate(checkins);
  const phrase = forYouForDay({ day, intake, plan, checkins, start, today, dayOneChange, anchor: anchor ?? undefined });
  const hardWeek = Boolean(hardWeekUntil && hardWeekUntil >= today);
  const notices = alerts(byDate, plan, start, today, day, { criticalWeeks: intake.criticalWeeks, hardWeekActive: hardWeek });

  const currentStreak = streak(byDate, start, today);
  const risk = streakStatus(byDate, start, today) === "at_risk";
  const phase = phaseForDay(day);
  const week = weekOfDay(day);
  const nextReview = day <= 28 ? Math.ceil(day / 7) * 7 : null;
  const reviewLine =
    nextReview === null
      ? "Sin más revisiones: toca cerrar"
      : nextReview === day
        ? "Hoy toca revisión semanal"
        : nextReview - day === 1
          ? "Mañana toca revisión"
          : `Revisión en ${nextReview - day} días`;

  return (
    <>
      {/* ---------- Panel del día ---------- */}
      <header className={h.hero}>
        <div className={h.heroTop}>
          <p className={h.date}>{capitalize(formatLongDate(today))}</p>
          {currentStreak > 0 || risk ? (
            <p className={h.streak} data-risk={risk || undefined}>
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M8.6 1.5c.4 2.3-1.6 3.3-1.6 5.3 0 .9.6 1.6 1.4 1.6 1.2 0 1.6-1.4 1.3-2.8 1.8 1.1 2.8 2.9 2.8 4.6A4.5 4.5 0 0 1 8 14.5a4.5 4.5 0 0 1-4.5-4.3c0-3.2 3.1-4.9 5.1-8.7z" fill="currentColor" />
              </svg>
              Racha de {currentStreak}
            </p>
          ) : null}
        </div>
        <h1 className="sr-only">Hoy, día {day} de 30</h1>
        <div className={h.heroMain}>
          <DayRing start={start} today={today} day={day} byDate={byDate} compact />
          <div className={h.heroInfo}>
            <p className={h.phaseName}>{PHASE_NAME[phase]}</p>
            <p className={h.phaseLine}>{PHASE_LINE[phase]}</p>
            <ul className={h.heroFacts}>
              <li>{phase === "CIERRE" ? "Cierre" : `Semana ${week} de 4`}</li>
              <li>{reviewLine}</li>
            </ul>
          </div>
        </div>
        <PhaseStrip phase={phase} />
        {risk ? (
          <p className={h.riskNote}>
            Ayer quedó en blanco. Haz hoy al menos un mínimo y tu racha sigue: solo se rompe con dos días seguidos.
          </p>
        ) : null}
      </header>

      {/* ---------- Adaptación: modo del día y semana difícil ---------- */}
      {hardWeek ? (
        <section className={h.hardWeek} aria-labelledby="hw-title">
          <p className={h.hardWeekTitle} id="hw-title">
            <AnchorIcon className={h.hardWeekIcon} />
            Modo semana difícil
          </p>
          <p className={h.hardWeekText}>
            Hasta el {formatLongDate(hardWeekUntil!)}, solo tu ancla es obligatoria
            {anchor ? <>: «{plan[anchor].name}» en mínimo</> : null}. Lo demás, si puedes.
          </p>
          <HardWeekButton on={false} action={actions.setHardWeek} variant="link">
            Desactivar
          </HardWeekButton>
        </section>
      ) : null}

      {!hardWeek ? <DayModeToggle light={light} action={actions.setLightDay} /> : null}

      <Checkin
        userId={userId}
        date={today}
        plan={plan}
        anchor={anchor}
        light={light}
        hardWeek={hardWeek}
        yesterday={byDate[addDays(today, -1)] ?? {}}
        initial={Object.fromEntries(checkins.filter((c) => c.date === today).map((c) => [c.slot, c.level]))}
      />

      {notices.length ? (
        <section className={h.notices} aria-label="Avisos para hoy">
          {notices.map((n) => (
            <div key={`${n.kind}-${n.slot ?? "all"}`} className={h.notice} data-kind={n.kind}>
              <span className={h.noticeIcon} aria-hidden="true">
                {n.kind === "level_up" ? "↑" : n.kind === "hard_week" ? "!" : n.kind === "golden" ? "2" : "↓"}
              </span>
              <div className={h.noticeBody}>
                <p>{n.text}</p>
                {n.kind === "hard_week" ? (
                  <HardWeekButton on action={actions.setHardWeek}>
                    Activar el modo semana difícil
                  </HardWeekButton>
                ) : null}
              </div>
            </div>
          ))}
        </section>
      ) : null}

      {pendingLesson && !light ? (
        <Link href={pendingLesson.href} className={h.pending}>
          <span className={h.pendingText}>
            <span className={h.pendingLabel}>Te espera la lección de ayer</span>
            <span className={h.pendingTitle}>
              Día {pendingLesson.day}: {pendingLesson.title}
            </span>
          </span>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M6 3.5L10.5 8 6 12.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      ) : null}

      {light ? (
        <section className={h.waiting} aria-label="Lección de hoy">
          <p className={h.waitingLabel}>Lección {day} de 30</p>
          <p className={h.waitingTitle}>{lesson.title}</p>
          <p className={h.waitingText}>Te espera mañana. Hoy has hecho lo importante: no dejar el día en blanco.</p>
        </section>
      ) : (
        <LessonArticle
          userId={userId}
          start={start}
          day={day}
          lesson={lesson}
          phrase={phrase}
          intake={intake}
          plan={plan}
          byDate={byDate}
          actionDone={actionDone}
          entries={entries}
          hardWeekAction={actions.setHardWeek}
          hardWeekActive={hardWeek}
        />
      )}

      {day > 1 ? (
        <Link href="/lecciones" className={h.archiveLink}>
          Ver las lecciones anteriores
        </Link>
      ) : null}
    </>
  );
}

function capitalize(text: string) {
  return text.charAt(0).toLocaleUpperCase("es-ES") + text.slice(1);
}
