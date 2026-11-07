import { ProfileView } from "@/app/(app)/perfil/ProfileView";
import { ReminderForm } from "@/app/(app)/perfil/ReminderForm";
import s from "@/app/(app)/shell.module.css";
import { BottomNav } from "@/components/BottomNav";
import pf from "@/app/(app)/perfil/perfil.module.css";
import { generatePlan } from "@/lib/domain/plan";
import type { Intake } from "@/lib/domain/types";
import { devUpdateReminder } from "../actions-perfil";

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
  freeTimeWeekend: "2-4",
  criticalWeeks: [2],
  criticalNote: "Exámenes",
  worthIt: "Llegar a los exámenes con el temario al día y sin ir siempre cansada",
  wantsPartner: true,
  reminderTime: "20:00",
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
          program={{ startText: "lunes, 11 de enero", reviewWeekday: 0, canChangeDate: true }}
          reminderForm={<ReminderForm time="20:00" action={devUpdateReminder} />}
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
