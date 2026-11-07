import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DayZeroSteps } from "@/components/DayZeroSteps";
import { requireUser } from "@/lib/auth";
import { todayInMadrid } from "@/lib/domain/program";
import { getStartWindow } from "@/lib/settings";
import { chooseStartDate } from "./actions";
import { StartPicker } from "./StartPicker";
import s from "./empezar.module.css";

export const metadata: Metadata = { title: "Elige tu día 1" };

export default async function EmpezarPage() {
  const user = await requireUser();
  // Con el programa ya empezado, la fecha no se cambia.
  if (user.programStart && user.programStart <= todayInMadrid()) redirect("/");
  const window = await getStartWindow();

  return (
    <main id="contenido" className={s.page}>
      <div className={s.wrap}>
        <DayZeroSteps current={1} />
        <StartPicker window={window} initial={user.programStart ?? window.recommended} action={chooseStartDate} />
      </div>
    </main>
  );
}
