import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getIntake, getPlan } from "@/lib/data/intake";
import { getCheckins } from "@/lib/data/progress";
import { getVideos } from "@/lib/data/videos";
import { toIntake } from "@/lib/domain/intake";
import { programState, todayInMadrid } from "@/lib/domain/program";
import { getStartDate } from "@/lib/settings";
import { ProgressView } from "./ProgressView";
import { VideoForm } from "./VideoForm";

export const metadata: Metadata = { title: "Progreso" };

export default async function ProgresoPage() {
  const user = await requireUser();
  const [start, intakeData, plan, checkins, videos] = await Promise.all([
    getStartDate(),
    getIntake(user.id),
    getPlan(user.id),
    getCheckins(user.id),
    getVideos(user.id),
  ]);
  const intake = intakeData ? toIntake(intakeData.draft) : null;
  if (!intake || !plan) redirect("/cuestionario");

  const today = todayInMadrid();
  const state = programState(start, today);
  const nextWeek = Math.min(Math.max(...videos.map((v) => v.week), 0) + 1, 4);

  return (
    <ProgressView
      start={start}
      today={today}
      state={state}
      plan={plan}
      wheel={intake.wheel}
      checkins={checkins}
      videos={videos}
      videoForm={<VideoForm nextWeek={nextWeek} />}
    />
  );
}
