import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getDoneDays } from "@/lib/data/progress";
import { currentProgramDay, todayInMadrid } from "@/lib/domain/program";
import { getStartDate } from "@/lib/settings";
import { LessonsIndexView } from "./LessonsIndexView";

export const metadata: Metadata = { title: "Lecciones" };

export default async function LeccionesPage() {
  const user = await requireUser();
  const [start, doneDays] = await Promise.all([getStartDate(user.id), getDoneDays(user.id)]);
  return <LessonsIndexView currentDay={currentProgramDay(start, todayInMadrid())} doneDays={doneDays} start={start} />;
}
