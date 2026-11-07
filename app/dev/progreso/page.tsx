import { ProgressView } from "@/app/(app)/progreso/ProgressView";
import s from "@/app/(app)/shell.module.css";
import { BottomNav } from "@/components/BottomNav";
import { PillButton } from "@/components/ui/Pill";
import { generatePlan } from "@/lib/domain/plan";
import { DEFAULT_START_DATE, dateForDay, programState } from "@/lib/domain/program";
import type { Checkin } from "@/lib/domain/stats";
import type { Intake, Level, Slot } from "@/lib/domain/types";

const SAMPLE: Intake = {
  name: "Lucía",
  ageRange: "23-26",
  occupation: "study_work",
  freeTime: "1-2",
  energy: "morning",
  wheel: { physical: 4, nutrition: 6, rest: 5, mind: 3, relationships: 7, work: 6, finance: 4, growth: 6 },
  goalType: "studies",
  goalText: "Aprobar",
  neglectedArea: "physical",
  exerciseDays: "none",
  sleepHours: "6-7",
  quitReason: "all_or_nothing",
  freeTimeWeekend: "2-4",
  criticalWeeks: [2],
  criticalNote: "Exámenes",
  worthIt: "Llegar a los exámenes con el temario al día y sin ir siempre cansada",
  wantsPartner: true,
  reminderTime: "20:00",
};

const PATTERN: Level[] = ["full", "half", "min", "full", "skip", "full", "half"];

export default async function DevProgreso({ searchParams }: { searchParams: Promise<{ dia?: string }> }) {
  const { dia } = await searchParams;
  const day = Math.min(Math.max(Number(dia) || 9, 1), 31);
  const today = dateForDay(DEFAULT_START_DATE, day);
  const checkins: Checkin[] = [];
  for (let n = 1; n < Math.min(day, 31); n++) {
    if (n === 4) continue; // un día sin nada
    (["body", "mind", "goal"] as Slot[]).forEach((slot, i) =>
      checkins.push({ date: dateForDay(DEFAULT_START_DATE, n), slot, level: PATTERN[(n + i) % PATTERN.length] }),
    );
  }
  return (
    <>
      <main id="contenido" className={s.main}>
        <ProgressView
          start={DEFAULT_START_DATE}
          today={today}
          state={programState(DEFAULT_START_DATE, today)}
          plan={generatePlan(SAMPLE)}
          wheel={SAMPLE.wheel}
          checkins={checkins}
          videos={[
            { week: 1, status: "approved" },
            { week: 2, status: "pending" },
          ]}
          videoForm={
            <PillButton type="button" variant="ghost" size="sm" block>
              He publicado mi vídeo
            </PillButton>
          }
        />
      </main>
      <BottomNav />
    </>
  );
}
