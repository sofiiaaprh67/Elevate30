import { Questionnaire } from "@/app/cuestionario/Questionnaire";
import s from "@/app/cuestionario/cuestionario.module.css";
import { devComplete, devSave } from "../actions";

export default async function DevCuestionario({ searchParams }: { searchParams: Promise<{ paso?: string }> }) {
  const { paso } = await searchParams;
  return (
    <main id="contenido" className={s.page}>
      <Questionnaire
        userId="dev"
        initialDraft={{}}
        initialStep={Math.min(Math.max(Number(paso) || 1, 1), 12)}
        save={devSave}
        complete={devComplete}
      />
    </main>
  );
}
