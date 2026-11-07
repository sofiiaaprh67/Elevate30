import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AnchorPicker } from "@/components/AnchorPicker";
import { SwapHabitButton } from "@/components/SwapHabitButton";
import { requireUser } from "@/lib/auth";
import { setAnchor } from "@/lib/data/habits";
import { getIntake, getPlan } from "@/lib/data/intake";
import { currentProgramDay, todayInMadrid } from "@/lib/domain/program";
import { getStartDate } from "@/lib/settings";
import { PlanView } from "./PlanView";

export const metadata: Metadata = { title: "Tu plan" };

export default async function PlanPage() {
  const user = await requireUser();
  const [intake, plan, start] = await Promise.all([getIntake(user.id), getPlan(user.id), getStartDate(user.id)]);
  if (!intake?.completed || !plan) redirect("/");

  const day = currentProgramDay(start, todayInMadrid());
  const dayZero = !user.committedAt;

  return (
    <PlanView
      name={intake.draft.name ?? ""}
      occupation={intake.draft.occupation}
      freeTime={intake.draft.freeTime}
      energy={intake.draft.energy}
      goalType={intake.draft.goalType}
      plan={plan}
      anchor={user.anchorSlot}
      anchorPicker={<AnchorPicker plan={plan} value={user.anchorSlot} action={setAnchor} />}
      dayZero={dayZero}
      canSwap={day <= 4}
      cta={dayZero ? "Seguir" : day >= 1 ? "Ir a hoy" : "Volver"}
      ctaHref={dayZero ? (user.communityJoined ? "/compromiso" : "/unirse") : "/hoy"}
      swap={(slot, habitName) => <SwapHabitButton slot={slot} habitName={habitName} />}
    />
  );
}
