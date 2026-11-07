import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/community/ProfileForm";
import { DayZeroSteps } from "@/components/DayZeroSteps";
import { COMMUNITY_NAME } from "@/content/community";
import { requireUser } from "@/lib/auth";
import { saveCommunityProfile } from "@/lib/data/community-actions";
import { getIntake } from "@/lib/data/intake";
import s from "./unirse.module.css";

export const metadata: Metadata = { title: "La comunidad" };

/** Día 0, paso 4: perfil en la comunidad y normas. */
export default async function UnirsePage() {
  const user = await requireUser();
  if (user.communityJoined) redirect("/");
  const intake = await getIntake(user.id);
  if (!user.programStart || !intake?.completed || !user.anchorSlot) redirect("/");

  return (
    <main id="contenido" className={s.page}>
      <div className={s.wrap}>
        <DayZeroSteps current={4} />
        <header className={s.head}>
          <h1 className={s.title}>No lo vas a hacer en solitario</h1>
          <p className={s.lead}>
            La comunidad ELEVATE es pequeña y privada: solo la {COMMUNITY_NAME}. Aquí se celebra la constancia y cada
            vuelta, no el rendimiento. Sin rankings ni seguidores.
          </p>
        </header>
        <ProfileForm
          userId={user.id}
          join
          avatarUrl={null}
          initial={{ alias: intake.draft.name ?? "", avatarPath: null, visibility: "all", milestonesEnabled: true }}
          action={saveCommunityProfile}
        />
      </div>
    </main>
  );
}
