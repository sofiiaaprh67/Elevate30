import { StartPicker } from "@/app/empezar/StartPicker";
import s from "@/app/empezar/empezar.module.css";
import { DayZeroSteps } from "@/components/DayZeroSteps";
import { devChooseStart } from "../actions";

export default function DevEmpezar() {
  return (
    <main id="contenido" className={s.page}>
      <div className={s.wrap}>
        <DayZeroSteps current={1} />
        <StartPicker
          window={{ from: "2027-01-01", to: "2027-01-18", recommended: "2027-01-11" }}
          initial="2027-01-11"
          action={devChooseStart}
        />
      </div>
    </main>
  );
}
