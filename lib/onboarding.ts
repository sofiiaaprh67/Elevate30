/**
 * Día 0: el orden de los pasos antes de empezar.
 * 1. Elegir fecha → 2. Cuestionario → 3. Plan y ancla → 4. Compromiso → Hoy.
 */
export type OnboardingState = {
  programStart: string | null;
  intakeCompleted: boolean;
  anchorSlot: string | null;
  committedAt: string | null;
};

export function onboardingPath(s: OnboardingState): "/empezar" | "/cuestionario" | "/plan" | "/compromiso" | null {
  if (!s.programStart) return "/empezar";
  if (!s.intakeCompleted) return "/cuestionario";
  if (!s.anchorSlot) return "/plan";
  if (!s.committedAt) return "/compromiso";
  return null;
}
