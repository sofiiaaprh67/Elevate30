import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { onboardingPath } from "@/lib/onboarding";
import { createClient } from "@/lib/supabase/server";

/** Reparte a cada persona a su pantalla según en qué punto del Día 0 está. */
export default async function Home() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: intake } = await supabase
    .from("intake")
    .select("completed_at")
    .eq("user_id", user.id)
    .maybeSingle();

  redirect(
    onboardingPath({
      programStart: user.programStart,
      intakeCompleted: Boolean(intake?.completed_at),
      anchorSlot: user.anchorSlot,
      communityJoined: user.communityJoined,
      committedAt: user.committedAt,
    }) ?? "/hoy",
  );
}
