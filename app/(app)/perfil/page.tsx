import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { signOut } from "@/app/entrar/actions";
import { requireUser } from "@/lib/auth";
import { getIntake, getPlan } from "@/lib/data/intake";
import { CommunitySettings } from "@/components/community/CommunitySettings";
import { getCommunityProfile, getMembers, getMutedAndBlocked, getMyReports } from "@/lib/data/community";
import { saveCommunityProfile, setBlocked, setMuted } from "@/lib/data/community-actions";
import { getCheckins } from "@/lib/data/progress";
import { FOUNDER_GOAL } from "@/lib/domain/calendar";
import { toIntake } from "@/lib/domain/intake";
import { dateForDay, formatLongDate, todayInMadrid, weekdayOf } from "@/lib/domain/program";
import { daysDone, groupByDate } from "@/lib/domain/stats";
import { getStartDate } from "@/lib/settings";
import { removePushSubscription, savePushSubscription } from "@/lib/data/push";
import { updateReminder } from "./actions";
import { ProfileView } from "./ProfileView";
import { ReminderSettings } from "./ReminderSettings";
import pf from "./perfil.module.css";

export const metadata: Metadata = { title: "Perfil" };

export default async function PerfilPage() {
  const user = await requireUser();
  const [intakeData, plan, checkins, start, communityProfile, members, hidden, reports] = await Promise.all([
    getIntake(user.id),
    getPlan(user.id),
    getCheckins(user.id),
    getStartDate(user.id),
    getCommunityProfile(user.id),
    getMembers(),
    getMutedAndBlocked(user.id),
    getMyReports(user.id),
  ]);
  const intake = intakeData ? toIntake(intakeData.draft) : null;
  if (!intake || !plan) redirect("/cuestionario");

  const isFounder = daysDone(groupByDate(checkins), start, todayInMadrid()) >= FOUNDER_GOAL;

  return (
    <ProfileView
      email={user.email}
      isAdmin={user.role === "admin"}
      isFounder={isFounder}
      intake={intake}
      plan={plan}
      program={{
        startText: formatLongDate(start),
        reviewWeekday: weekdayOf(dateForDay(start, 7)),
        canChangeDate: start > todayInMadrid(),
      }}
      community={
        communityProfile ? (
          <CommunitySettings
            userId={user.id}
            profile={communityProfile}
            avatarUrl={members.get(user.id)?.avatarUrl ?? null}
            muted={hidden.muted}
            blocked={hidden.blocked}
            names={members}
            reports={reports}
            actions={{ save: saveCommunityProfile, setMuted, setBlocked }}
          />
        ) : null
      }
      reminderForm={
        <ReminderSettings
          time={intake.reminderTime}
          action={updateReminder}
          push={{ save: savePushSubscription, remove: removePushSubscription }}
        />
      }
      signOut={
        <form action={signOut}>
          <button type="submit" className={pf.signOut}>
            Cerrar sesión
          </button>
        </form>
      }
    />
  );
}
