"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { draftToRow, getIntake, habitToRow } from "@/lib/data/intake";
import { firstIncompleteStep, sanitizeDraft, toIntake, TOTAL_STEPS } from "@/lib/domain/intake";
import { generatePlan } from "@/lib/domain/plan";
import { SLOTS } from "@/lib/domain/types";
import { createClient } from "@/lib/supabase/server";

export type SaveResult = { ok: true } | { ok: false; error: string };

/** Autoguardado: se llama al pasar de pregunta. */
export async function saveIntakeDraft(input: unknown, step: number): Promise<SaveResult> {
  const user = await requireUser();
  const draft = sanitizeDraft(input);
  const currentStep = Math.min(Math.max(Math.trunc(step) || 1, 1), TOTAL_STEPS);

  const supabase = await createClient();
  const { error } = await supabase
    .from("intake")
    .upsert({ user_id: user.id, ...draftToRow(draft), current_step: currentStep }, { onConflict: "user_id" });

  return error ? { ok: false, error: "No hemos podido guardar tus respuestas. Revisa tu conexión." } : { ok: true };
}

/** Termina el cuestionario: guarda, genera el plan y lleva a "Tu plan". */
export async function completeIntake(input: unknown): Promise<SaveResult & { step?: number }> {
  const user = await requireUser();
  const draft = sanitizeDraft(input);
  const intake = toIntake(draft);
  if (!intake) {
    return { ok: false, error: "Falta alguna respuesta.", step: firstIncompleteStep(draft) ?? 1 };
  }

  const supabase = await createClient();
  const existing = await getIntake(user.id);

  const { error: intakeError } = await supabase.from("intake").upsert(
    {
      user_id: user.id,
      ...draftToRow(intake),
      current_step: TOTAL_STEPS,
      completed_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (intakeError) return { ok: false, error: "No hemos podido guardar tus respuestas. Inténtalo de nuevo." };

  // Si ya tenía plan (rehace el cuestionario), no pisamos los hábitos que haya cambiado.
  if (!existing?.completed) {
    const plan = generatePlan(intake);
    const { error: habitsError } = await supabase
      .from("user_habits")
      .upsert(SLOTS.map((slot) => habitToRow(user.id, plan[slot])), { onConflict: "user_id,slot" });
    if (habitsError) return { ok: false, error: "No hemos podido crear tu plan. Inténtalo de nuevo." };
  }

  redirect("/plan");
}
