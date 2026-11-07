import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getIntake, getPlan } from "@/lib/data/intake";
import { getAllEntries } from "@/lib/data/progress";
import { toIntake } from "@/lib/domain/intake";
import { currentProgramDay, todayInMadrid } from "@/lib/domain/program";
import { buildSystem } from "@/lib/domain/system";
import { getStartDate } from "@/lib/settings";
import { SystemView } from "./SystemView";

export const metadata: Metadata = { title: "Tu sistema" };

export default async function SistemaPage() {
  const user = await requireUser();
  const [intakeData, plan, entries, start] = await Promise.all([
    getIntake(user.id),
    getPlan(user.id),
    getAllEntries(user.id),
    getStartDate(user.id),
  ]);
  const intake = intakeData?.completed ? toIntake(intakeData.draft) : null;
  if (!intake || !plan) redirect("/cuestionario");

  const pieces = buildSystem({ entries, intake, plan, start, anchor: user.anchorSlot, currentDay: currentProgramDay(start, todayInMadrid()) });
  return <SystemView name={intake.name} pieces={pieces} />;
}
