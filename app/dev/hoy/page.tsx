import { TodayView } from "@/app/(app)/hoy/TodayView";
import s from "@/app/(app)/shell.module.css";
import { BottomNav } from "@/components/BottomNav";
import { devSetHardWeek, devSetLightDay } from "../actions";
import { devPush, devSubmitSurvey } from "../actions-measure";
import { PushNudge } from "@/components/Push";
import { SurveyCard } from "@/components/SurveyCard";
import { surveyDue } from "@/lib/domain/surveys";
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
  freeTimeWeekend: "2-4",
  criticalWeeks: [2],
  criticalNote: "Exámenes",
  worthIt: "Llegar a los exámenes con el temario al día y sin ir siempre cansada",
  wantsPartner: true,
  reminderTime: "20:00",
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

export default async function DevHoy({
  searchParams,
}: {
  searchParams: Promise<{ dia?: string; justo?: string; semana?: string; ancla?: string }>;
}) {
  const { dia, justo, semana, ancla } = await searchParams;
  const day = Math.min(Math.max(Number(dia) || 9, 1), 30);
  const anchor = ancla === "body" || ancla === "mind" ? ancla : "goal";
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
          anchor={anchor}
          hardWeekUntil={semana ? dateForDay(DEFAULT_START_DATE, Math.ceil(day / 7) * 7) : null}
          light={Boolean(justo)}
          pendingLesson={day > 1 && !justo ? { day: day - 1, title: "Planifica tu día en 5 minutos", href: `/dev/hoy?dia=${day - 1}` } : null}
          survey={
            <>
              {surveyDue(day, []) ? (
                <SurveyCard survey={surveyDue(day, [])!} today={dateForDay(DEFAULT_START_DATE, day)} action={devSubmitSurvey} />
              ) : null}
              <PushNudge time={SAMPLE.reminderTime} actions={{ save: devPush, remove: devPush }} />
            </>
          }
          actions={{ setLightDay: devSetLightDay, setHardWeek: devSetHardWeek }}
        />
      </main>
      <BottomNav />
    </>
  );
}
