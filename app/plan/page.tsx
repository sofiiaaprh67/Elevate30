import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SwapHabitButton } from "@/components/SwapHabitButton";
import { requireUser } from "@/lib/auth";
import { getIntake, getPlan } from "@/lib/data/intake";
import { programState, todayInMadrid } from "@/lib/domain/program";
import { getStartDate } from "@/lib/settings";
import { PlanView } from "./PlanView";

export const metadata: Metadata = { title: "Tu plan" };

export default async function PlanPage() {
  const user = await requireUser();
  const [intake, plan, start] = await Promise.all([getIntake(user.id), getPlan(user.id), getStartDate(user.id)]);
  if (!intake?.completed || !plan) redirect("/cuestionario");

  const state = programState(start, todayInMadrid());
  const cta = state.kind === "active" && state.day > 1 ? "Ir a hoy" : "Empezar mi día 1";

  return (
    <PlanView
      name={intake.draft.name ?? ""}
      occupation={intake.draft.occupation}
      freeTime={intake.draft.freeTime}
      energy={intake.draft.energy}
      goalType={intake.draft.goalType}
      plan={plan}
      cta={cta}
      swap={(slot, habitName) => <SwapHabitButton slot={slot} habitName={habitName} />}
    />
  );
}
