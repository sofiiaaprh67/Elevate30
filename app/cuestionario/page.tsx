import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DayZeroSteps } from "@/components/DayZeroSteps";
import { requireUser } from "@/lib/auth";
import { getIntake } from "@/lib/data/intake";
import { TOTAL_STEPS } from "@/lib/domain/intake";
import { completeIntake, saveIntakeDraft } from "./actions";
import { Questionnaire } from "./Questionnaire";
import s from "./cuestionario.module.css";

export const metadata: Metadata = { title: "Cuestionario" };

export default async function CuestionarioPage() {
  const user = await requireUser();
  if (!user.programStart) redirect("/empezar");
  const intake = await getIntake(user.id);
  if (intake?.completed) redirect("/");

  return (
    <main id="contenido" className={s.page}>
      <div className={s.steps}>
        <DayZeroSteps current={2} />
      </div>
      <Questionnaire
        userId={user.id}
        start={user.programStart}
        initialDraft={{ ...(intake?.draft ?? {}), healthConsent: Boolean(user.healthConsentAt) || undefined }}
        initialStep={Math.min(intake?.step ?? 1, TOTAL_STEPS)}
        save={saveIntakeDraft}
        complete={completeIntake}
      />
    </main>
  );
}
