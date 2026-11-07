import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** Reparte a cada persona a su pantalla según en qué punto está. */
export default async function Home() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: intake } = await supabase
    .from("intake")
    .select("completed_at")
    .eq("user_id", user.id)
    .maybeSingle();

  redirect(intake?.completed_at ? "/hoy" : "/cuestionario");
}
