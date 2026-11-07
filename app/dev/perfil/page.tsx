import { ProfileView } from "@/app/(app)/perfil/ProfileView";
import { ReviewForm } from "@/app/(app)/perfil/ReviewForm";
import s from "@/app/(app)/shell.module.css";
import { BottomNav } from "@/components/BottomNav";
import pf from "@/app/(app)/perfil/perfil.module.css";
import { generatePlan } from "@/lib/domain/plan";
import type { Intake } from "@/lib/domain/types";
import { devUpdateReview } from "../actions-perfil";

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

export default function DevPerfil() {
  return (
    <>
      <main id="contenido" className={s.main}>
        <ProfileView
          email="lucia@ejemplo.com"
          isAdmin
          isFounder
          intake={SAMPLE}
          plan={generatePlan(SAMPLE)}
          reviewForm={<ReviewForm weekday={0} time="19:00" action={devUpdateReview} />}
          signOut={
            <button type="button" className={pf.signOut}>
              Cerrar sesión
            </button>
          }
        />
      </main>
      <BottomNav />
    </>
  );
}
