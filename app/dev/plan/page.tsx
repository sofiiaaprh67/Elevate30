import { PlanView } from "@/app/plan/PlanView";
import { PillButton } from "@/components/ui/Pill";
import { generatePlan } from "@/lib/domain/plan";
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
  sleepHours: "7-8",
  quitReason: "all_or_nothing",
  reviewWeekday: 0,
  reviewTime: "19:00",
};

export default function DevPlan() {
  return (
    <PlanView
      name={SAMPLE.name}
      occupation={SAMPLE.occupation}
      freeTime={SAMPLE.freeTime}
      energy={SAMPLE.energy}
      goalType={SAMPLE.goalType}
      plan={generatePlan(SAMPLE)}
      cta="Empezar mi día 1"
      ctaHref="/dev/plan"
      swap={() => (
        <PillButton type="button" variant="ghost" size="sm" block>
          Cambiar hábito
        </PillButton>
      )}
    />
  );
}
