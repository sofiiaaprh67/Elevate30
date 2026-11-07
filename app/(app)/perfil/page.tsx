import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { signOut } from "@/app/entrar/actions";
import { requireUser } from "@/lib/auth";
import { getIntake, getPlan } from "@/lib/data/intake";
import { getCheckins } from "@/lib/data/progress";
import { FOUNDER_GOAL } from "@/lib/domain/calendar";
import { toIntake } from "@/lib/domain/intake";
import { todayInMadrid } from "@/lib/domain/program";
import { daysDone, groupByDate } from "@/lib/domain/stats";
import { getStartDate } from "@/lib/settings";
import { updateReview } from "./actions";
import { ProfileView } from "./ProfileView";
import { ReviewForm } from "./ReviewForm";
import pf from "./perfil.module.css";

export const metadata: Metadata = { title: "Perfil" };

export default async function PerfilPage() {
  const user = await requireUser();
  const [intakeData, plan, checkins, start] = await Promise.all([
    getIntake(user.id),
    getPlan(user.id),
    getCheckins(user.id),
    getStartDate(user.id),
  ]);
  const intake = intakeData ? toIntake(intakeData.draft) : null;
  if (!intake || !plan) redirect("/cuestionario");

  const isFounder = daysDone(groupByDate(checkins), start, todayInMadrid()) >= FOUNDER_GOAL;

  return (
    <ProfileView
      email={user.email}
      isAdmin={user.role === "admin"}
      isFounder={isFounder}
      intake={intake}
      plan={plan}
      reviewForm={<ReviewForm weekday={intake.reviewWeekday} time={intake.reviewTime} action={updateReview} />}
      signOut={
        <form action={signOut}>
          <button type="submit" className={pf.signOut}>
            Cerrar sesión
          </button>
        </form>
      }
    />
  );
}
