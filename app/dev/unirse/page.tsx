import s from "@/app/unirse/unirse.module.css";
import { ProfileForm } from "@/components/community/ProfileForm";
import { DayZeroSteps } from "@/components/DayZeroSteps";
import { devSaveProfile } from "../actions-community";

export default function DevUnirse() {
  return (
    <main id="contenido" className={s.page}>
      <div className={s.wrap}>
        <DayZeroSteps current={4} />
        <header className={s.head}>
          <h1 className={s.title}>No lo vas a hacer en solitario</h1>
          <p className={s.lead}>
            La comunidad ELEVATE es pequeña y privada: solo la Cohorte Fundadora. Aquí se celebra la constancia y cada
            vuelta, no el rendimiento. Sin rankings ni seguidores.
          </p>
        </header>
        <ProfileForm
          userId="dev"
          join
          avatarUrl={null}
          initial={{ alias: "Lucía", avatarPath: null, visibility: "all", milestonesEnabled: true }}
          action={devSaveProfile}
        />
      </div>
    </main>
  );
}
