import { redirect } from "next/navigation";
import { AppBar } from "@/components/AppBar";
import { BottomNav } from "@/components/BottomNav";
import { requireUser } from "@/lib/auth";
import { logEvent } from "@/lib/data/measure";
import { programDay, todayInMadrid } from "@/lib/domain/program";
import { onboardingPath } from "@/lib/onboarding";
import { createClient } from "@/lib/supabase/server";
import s from "./shell.module.css";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  // Hasta terminar el Día 0 no se entra en la app.
  const supabase = await createClient();
  const { data: intake } = await supabase.from("intake").select("completed_at, name").eq("user_id", user.id).maybeSingle();
  const pending = onboardingPath({
    programStart: user.programStart,
    intakeCompleted: Boolean(intake?.completed_at),
    anchorSlot: user.anchorSlot,
    communityJoined: user.communityJoined,
    committedAt: user.committedAt,
  });
  if (pending) redirect(pending);

  // Registro de actividad: un "abrió la app" por día
  const day = user.programStart ? Math.min(Math.max(programDay(user.programStart, todayInMadrid()), 0), 31) : 0;
  await logEvent("open", day);

  return (
    <>
      <main id="contenido" className={s.main}>
        <AppBar name={intake?.name as string | null | undefined} />
        {children}
      </main>
      <BottomNav />
    </>
  );
}
