/**
 * Elección del día 1 (Día 0, paso 1). Edita aquí los textos.
 * Las fechas de la ventana se configuran en la tabla `settings`
 * (start_from, start_to y start_date = fecha recomendada).
 */

export type StartAdvice = { tag: string; title: string; points: string[] };

/** Lunes 11 de enero: la fecha recomendada. */
export const RECOMMENDED_ADVICE: StartAdvice = {
  tag: "Recomendado",
  title: "Empieza cuando los demás lo dejan",
  points: [
    "Ya ha pasado Reyes y has vuelto a tu rutina.",
    "Llega justo después del viernes 8, el día en que más gente abandona sus propósitos.",
    "Al empezar en lunes, tus revisiones caen siempre en domingo.",
  ],
};

/** Viernes 1 de enero: para quien tiene muchas ganas. */
export const EAGER_DATE = "2027-01-01";
export const EAGER_ADVICE: StartAdvice = {
  tag: "Si tienes muchas ganas",
  title: "Aprovecha el mayor impulso del año",
  points: [
    "Es el momento del año con más ganas de empezar.",
    "A cambio, tu primera semana coincide con festivos y Reyes es tu día 6.",
    "Tus revisiones caerán en jueves.",
  ],
};

export const OTHER_ADVICE: StartAdvice = {
  tag: "También vale",
  title: "Cualquier día de la ventana sirve",
  points: ["Si puedes, que sea lunes: así tus semanas y tus revisiones coinciden con las de verdad."],
};

export const START_NOTE =
  "Empiezas un día señalado y aprendes a no necesitar otro: si fallas, vuelves al día siguiente.";

export const COMMITMENT_TEXT = "Durante 30 días no dejaré dos días seguidos en blanco.";
