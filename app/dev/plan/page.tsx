import { PlanView } from "@/app/plan/PlanView";
import { AnchorPicker } from "@/components/AnchorPicker";
import { devSetAnchor } from "../actions";
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
  freeTimeWeekend: "2-4",
  criticalWeeks: [2],
  criticalNote: "Exámenes",
  worthIt: "Llegar a los exámenes con el temario al día y sin ir siempre cansada",
  wantsPartner: true,
  reminderTime: "20:00",
};

export default async function DevPlan({ searchParams }: { searchParams: Promise<{ ancla?: string }> }) {
  const { ancla } = await searchParams;
  const anchor = ancla === "body" || ancla === "mind" || ancla === "goal" ? ancla : null;
  const plan = generatePlan(SAMPLE);
  return (
    <PlanView
      name={SAMPLE.name}
      occupation={SAMPLE.occupation}
      freeTime={SAMPLE.freeTime}
      energy={SAMPLE.energy}
      goalType={SAMPLE.goalType}
      plan={plan}
      anchor={anchor}
      anchorPicker={<AnchorPicker plan={plan} value={anchor} action={devSetAnchor} />}
      dayZero
      canSwap
      cta="Seguir: tu compromiso"
      ctaHref="/dev/compromiso"
      swap={() => (
        <PillButton type="button" variant="ghost" size="sm" block>
          Cambiar hábito
        </PillButton>
      )}
    />
  );
}
