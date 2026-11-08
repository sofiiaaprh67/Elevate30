"use server";

import type { AdminState } from "@/app/admin/actions";
import type { SurveyId } from "@/content/surveys";
import type { SurveyResult } from "@/lib/data/measure";
import type { PushResult } from "@/lib/data/push";
import { validateSurvey, type SurveyInput } from "@/lib/domain/surveys";

/** Versiones de prueba de la fase D: validan igual, pero no tocan la base de datos. */
function assertDev() {
  if (process.env.NODE_ENV !== "development") throw new Error("Solo en desarrollo");
}

export async function devSubmitSurvey(id: SurveyId, input: SurveyInput): Promise<SurveyResult> {
  assertDev();
  const valid = validateSurvey(id, input);
  return valid.ok ? { ok: true, waitlist: valid.row.wants_more === "yes" } : valid;
}

export async function devPush(): Promise<PushResult> {
  assertDev();
  return { ok: true };
}

export async function devSetRefund(): Promise<AdminState> {
  assertDev();
  return { ok: true };
}
