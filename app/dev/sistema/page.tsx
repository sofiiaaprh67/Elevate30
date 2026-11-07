import { SystemView } from "@/app/(app)/sistema/SystemView";
import s from "@/app/(app)/shell.module.css";
import { BottomNav } from "@/components/BottomNav";
import { generatePlan } from "@/lib/domain/plan";
import { buildSystem, type SystemEntry } from "@/lib/domain/system";
import type { Intake } from "@/lib/domain/types";

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

const ENTRIES: SystemEntry[] = [
  {
    kind: "lesson",
    day: 1,
    data: {
      change: "Llegar a los exámenes con el temario al día y sin ir siempre cansada.",
      why: "Llevo dos cuatrimestres empezando fuerte y abandonando en marzo.",
    },
  },
  {
    kind: "lesson",
    day: 3,
    data: {
      goal: "Aprobar Estadística y Contabilidad en la convocatoria de febrero",
      signal: "20 bloques de estudio hechos y los temas 1 a 4 repasados",
    },
  },
  {
    kind: "lesson",
    day: 6,
    data: {
      body: "Cuando salga del metro por la mañana, caminaré los 20 minutos hasta la facultad.",
      goal: "Cuando llegue a la biblioteca a las 8:00, haré mi bloque antes de abrir el móvil.",
    },
  },
];

export default async function DevSistema({ searchParams }: { searchParams: Promise<{ dia?: string }> }) {
  const { dia } = await searchParams;
  const day = Math.min(Math.max(Number(dia) || 9, 0), 31);
  const pieces = buildSystem({ entries: ENTRIES, intake: SAMPLE, plan: generatePlan(SAMPLE), currentDay: day });
  return (
    <>
      <main id="contenido" className={s.main}>
        <SystemView
          name={SAMPLE.name}
          pieces={pieces}
          lessonHref={(d) => `/dev/hoy?dia=${d}`}
          lessonsHref={`/dev/lecciones?dia=${day}`}
        />
      </main>
      <BottomNav />
    </>
  );
}
