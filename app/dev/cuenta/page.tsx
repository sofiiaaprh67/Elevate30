import { CountdownView } from "@/app/(app)/hoy/CountdownView";
import s from "@/app/(app)/shell.module.css";
import { BottomNav } from "@/components/BottomNav";
import { DEFAULT_START_DATE, programState, todayInMadrid } from "@/lib/domain/program";

export default function DevCuenta() {
  const state = programState(DEFAULT_START_DATE, todayInMadrid());
  return (
    <>
      <main id="contenido" className={s.main}>
        <CountdownView start={DEFAULT_START_DATE} daysLeft={state.kind === "before" ? state.daysLeft : 0} hasPlan />
      </main>
      <BottomNav />
    </>
  );
}
