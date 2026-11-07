"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type CommitResult = { ok: false; error: string } | undefined;

/** Firma el compromiso del Día 0 y lleva a Hoy. */
export async function signCommitment(): Promise<CommitResult> {
  const user = await requireUser();
  if (!user.anchorSlot) return { ok: false, error: "Elige primero tu ancla en tu plan." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ committed_at: new Date().toISOString() })
    .eq("id", user.id);
  if (error) return { ok: false, error: "No hemos podido guardar tu firma. Inténtalo de nuevo." };
  redirect("/hoy");
}
