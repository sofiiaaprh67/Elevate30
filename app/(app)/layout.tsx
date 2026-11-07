import { redirect } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { requireUser } from "@/lib/auth";
import { onboardingPath } from "@/lib/onboarding";
import { createClient } from "@/lib/supabase/server";
import s from "./shell.module.css";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  // Hasta terminar el Día 0 no se entra en la app.
  const supabase = await createClient();
  const { data: intake } = await supabase.from("intake").select("completed_at").eq("user_id", user.id).maybeSingle();
  const pending = onboardingPath({
    programStart: user.programStart,
    intakeCompleted: Boolean(intake?.completed_at),
    anchorSlot: user.anchorSlot,
    communityJoined: user.communityJoined,
    committedAt: user.committedAt,
  });
  if (pending) redirect(pending);

  return (
    <>
      <main id="contenido" className={s.main}>
        {children}
      </main>
      <BottomNav />
    </>
  );
}
