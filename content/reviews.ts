/**
 * Revisiones semanales (días 7, 14, 21 y 28).
 * Cada semana tiene sus preguntas. Además, en todas se decide qué hacer
 * con cada hábito: mantener, bajar o subir.
 * Edita aquí los textos.
 */

export type ReviewQuestion = { key: string; label: string; placeholder: string };

export type Review = {
  title: string;
  intro: string;
  questions: ReviewQuestion[];
};

export const REVIEWS: Record<number, Review> = {
  7: {
    title: "Tu punto de partida",
    intro: "Una semana de datos. Míralos con curiosidad, no con nota.",
    questions: [
      {
        key: "worked",
        label: "¿Qué hábito te ha salido con más facilidad y por qué?",
        placeholder: "Caminar, porque lo hago al volver de clase…",
      },
      {
        key: "didnt",
        label: "¿Qué te ha frenado esta semana?",
        placeholder: "Se me olvidaba, llegaba sin energía, no era la hora…",
      },
      {
        key: "adjust",
        label: "¿Qué cambias para la semana 2?",
        placeholder: "Muevo la pausa mental a después de comer…",
      },
    ],
  },
  14: {
    title: "Lo que dicen tus datos",
    intro: "Busca tu hábito con peores datos y averigua qué falla: la señal, la dificultad o las ganas.",
    questions: [
      {
        key: "worked",
        label: "¿Qué ha pasado los días en que sí cumpliste tu hábito más difícil?",
        placeholder: "Lo hice justo al llegar a casa, antes de sentarme…",
      },
      {
        key: "didnt",
        label: "¿Qué falla en tu hábito más difícil: la señal, la dificultad o las ganas?",
        placeholder: "La señal: no tengo un momento fijo…",
      },
      {
        key: "adjust",
        label: "Un ajuste concreto para la semana 3",
        placeholder: "Lo uno a después del café y bajo el completo a 15 min…",
      },
    ],
  },
  21: {
    title: "Qué ajustar",
    intro: "Ajusta con datos: sube lo que ya sale solo y facilita lo que sigue costando.",
    questions: [
      {
        key: "worked",
        label: "¿Qué hábito está listo para subir de nivel?",
        placeholder: "Caminar: llevo 6 días en completo sin esfuerzo…",
      },
      {
        key: "didnt",
        label: "¿Cuál necesita bajar o cambiar de hora?",
        placeholder: "El bloque de estudio por la noche no sale…",
      },
      {
        key: "adjust",
        label: "¿Qué cambias para la semana 4?",
        placeholder: "Paso el bloque a las 8:00, antes de mirar el móvil…",
      },
    ],
  },
  28: {
    title: "Lo que te llevas",
    intro: "Piensa en el día 31, no en el pasado: esta revisión decide tu siguiente etapa.",
    questions: [
      {
        key: "worked",
        label: "¿Qué hábitos quieres mantener después del día 30?",
        placeholder: "Los tres, pero el de mente en nivel medio…",
      },
      {
        key: "didnt",
        label: "¿Qué ha sido lo más difícil y cómo lo has superado?",
        placeholder: "La semana de entregas: hice solo el mínimo y funcionó…",
      },
      {
        key: "adjust",
        label: "¿Qué has aprendido de cómo funcionas tú?",
        placeholder: "Que rindo mejor por la mañana y que el mínimo me salva…",
      },
    ],
  },
};

export const DECISIONS = [
  { value: "keep", label: "Mantener" },
  { value: "down", label: "Bajar" },
  { value: "up", label: "Subir" },
] as const;

export type Decision = (typeof DECISIONS)[number]["value"];

export function reviewForDay(day: number): Review | undefined {
  return REVIEWS[day];
}
