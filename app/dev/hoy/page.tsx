import { TodayView } from "@/app/(app)/hoy/TodayView";
import s from "@/app/(app)/shell.module.css";
import { BottomNav } from "@/components/BottomNav";
import { generatePlan } from "@/lib/domain/plan";
import { DEFAULT_START_DATE, dateForDay } from "@/lib/domain/program";
import type { Checkin } from "@/lib/domain/stats";
import type { Intake, Level } from "@/lib/domain/types";

const SAMPLE: Intake = {
  name: "Lucía",
  ageRange: "23-26",
  occupation: "study_work",
  freeTime: "1-2",
  energy: "morning",
  wheel: { physical: 4, nutrition: 6, rest: 5, mind: 3, relationships: 7, work: 6, finance: 4, growth: 6 },
  goalType: "studies",
  goalText: "Aprobar las 2 asignaturas que más me cuestan",
  neglectedArea: "physical",
  exerciseDays: "none",
  sleepHours: "6-7",
  quitReason: "all_or_nothing",
  reviewWeekday: 0,
  reviewTime: "19:00",
};

/** Check-ins de ejemplo: cuerpo siempre en completo, mente sin cumplir los últimos días. */
function sampleCheckins(day: number): Checkin[] {
  const out: Checkin[] = [];
  for (let n = 1; n < day; n++) {
    const date = dateForDay(DEFAULT_START_DATE, n);
    out.push({ date, slot: "body", level: "full" });
    out.push({ date, slot: "mind", level: (n < day - 3 ? "half" : "skip") as Level });
    if (n % 2) out.push({ date, slot: "goal", level: "min" });
  }
  return out;
}

export default async function DevHoy({ searchParams }: { searchParams: Promise<{ dia?: string }> }) {
  const { dia } = await searchParams;
  const day = Math.min(Math.max(Number(dia) || 9, 1), 30);
  return (
    <>
      <main id="contenido" className={s.main}>
        <TodayView
          userId="00000000-0000-0000-0000-000000000000"
          start={DEFAULT_START_DATE}
          today={dateForDay(DEFAULT_START_DATE, day)}
          day={day}
          intake={SAMPLE}
          plan={generatePlan(SAMPLE)}
          checkins={sampleCheckins(day)}
          actionDone={false}
          entries={{}}
        />
      </main>
      <BottomNav />
    </>
  );
}
