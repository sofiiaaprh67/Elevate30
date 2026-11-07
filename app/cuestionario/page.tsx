import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getIntake } from "@/lib/data/intake";
import { TOTAL_STEPS } from "@/lib/domain/intake";
import { completeIntake, saveIntakeDraft } from "./actions";
import { Questionnaire } from "./Questionnaire";
import s from "./cuestionario.module.css";

export const metadata: Metadata = { title: "Cuestionario" };

export default async function CuestionarioPage() {
  const user = await requireUser();
  const intake = await getIntake(user.id);
  if (intake?.completed) redirect("/plan");

  return (
    <main id="contenido" className={s.page}>
      <Questionnaire
        userId={user.id}
        initialDraft={intake?.draft ?? {}}
        initialStep={Math.min(intake?.step ?? 1, TOTAL_STEPS)}
        save={saveIntakeDraft}
        complete={completeIntake}
      />
    </main>
  );
}
