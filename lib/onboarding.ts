/**
 * Día 0: el orden de los pasos antes de empezar.
 * 1. Elegir fecha → 2. Cuestionario → 3. Plan y ancla → 4. Comunidad → 5. Compromiso → Hoy.
 */
export type OnboardingState = {
  programStart: string | null;
  intakeCompleted: boolean;
  anchorSlot: string | null;
  communityJoined: boolean;
  committedAt: string | null;
};

export type OnboardingPath = "/empezar" | "/cuestionario" | "/plan" | "/unirse" | "/compromiso";

export function onboardingPath(s: OnboardingState): OnboardingPath | null {
  if (!s.programStart) return "/empezar";
  if (!s.intakeCompleted) return "/cuestionario";
  if (!s.anchorSlot) return "/plan";
  if (!s.communityJoined) return "/unirse";
  if (!s.committedAt) return "/compromiso";
  return null;
}
