/**
 * Encuestas del piloto (días 7, 15 y 30). Textos editables.
 * Las respuestas se guardan en `surveys.answers` por el `id` de cada pregunta.
 */
export type SurveyId = "d7" | "d15" | "d30";

export type SurveyQuestion =
  | { id: string; kind: "text"; label: string; hint?: string; required?: boolean }
  | { id: string; kind: "scale"; label: string; min: number; max: number; minLabel: string; maxLabel: string; required?: boolean }
  | { id: string; kind: "choice"; label: string; options: { value: string; label: string }[]; required?: boolean };

export type SurveyCheck = { id: "testimonial_ok" | "interview_ok"; label: string };

export type Survey = {
  id: SurveyId;
  /** Primer día en que aparece. */
  day: number;
  title: string;
  intro: string;
  minutes: number;
  questions: SurveyQuestion[];
  checks?: SurveyCheck[];
  /** Al menos una de estas preguntas tiene que tener respuesta. */
  atLeastOne?: string[];
  thanks: string;
};

export const SURVEYS: Survey[] = [
  {
    id: "d7",
    day: 7,
    title: "Tu primera semana",
    intro: "Tres preguntas. Con tus respuestas ajustamos la semana 2, para ti y para el resto de la cohorte.",
    minutes: 1,
    questions: [
      { id: "sobra", kind: "text", label: "¿Qué sobra?", hint: "Algo que te cueste tiempo sin aportarte." },
      { id: "falta", kind: "text", label: "¿Qué falta?", hint: "Algo que te habría ayudado esta semana." },
      { id: "frenado", kind: "text", label: "¿Qué te ha frenado?", hint: "Un día, una situación, una pantalla de la app…" },
    ],
    atLeastOne: ["sobra", "falta", "frenado"],
    thanks: "Gracias. Lo leemos todo antes de que empiece tu semana 2.",
  },
  {
    id: "d15",
    day: 15,
    title: "Mitad del camino",
    intro: "Cinco preguntas sobre los primeros 15 días. Lo que nos digas cambia la segunda mitad.",
    minutes: 2,
    questions: [
      {
        id: "ayuda",
        kind: "scale",
        label: "¿Cuánto te está ayudando ELEVATE 30?",
        min: 1,
        max: 5,
        minLabel: "Nada",
        maxLabel: "Mucho",
        required: true,
      },
      {
        id: "mejor",
        kind: "choice",
        label: "¿Qué parte te sirve más?",
        required: true,
        options: [
          { value: "levels", label: "Los tres niveles y el mínimo" },
          { value: "lesson", label: "La lección del día" },
          { value: "review", label: "La revisión semanal" },
          { value: "community", label: "La comunidad" },
          { value: "reminder", label: "El recordatorio" },
          { value: "system", label: "Tu Sistema" },
        ],
      },
      {
        id: "minimo",
        kind: "choice",
        label: "¿Te ha servido el mínimo o «Hoy voy justo»?",
        required: true,
        options: [
          { value: "yes", label: "Sí, me ha salvado algún día" },
          { value: "unsure", label: "Lo he usado, pero no me convence" },
          { value: "not_needed", label: "No lo he necesitado" },
        ],
      },
      { id: "cambiar", kind: "text", label: "¿Qué cambiarías para la segunda mitad?" },
      { id: "frase", kind: "text", label: "En una frase: ¿qué ha cambiado desde tu día 1?" },
    ],
    checks: [
      { id: "testimonial_ok", label: "Podéis usar mi frase como testimonio, con mi nombre de pila." },
      { id: "interview_ok", label: "Me apunto a una entrevista de 20 minutos en los próximos días." },
    ],
    thanks: "Gracias. Si te has apuntado a la entrevista, te escribimos para elegir hora.",
  },
  {
    id: "d30",
    day: 30,
    title: "Tu día 30",
    intro: "Lo has hecho. Antes de cerrar, cuéntanos cómo ha ido y si quieres seguir.",
    minutes: 2,
    questions: [
      {
        id: "nps",
        kind: "scale",
        label: "Del 0 al 10, ¿con qué probabilidad recomendarías ELEVATE 30 a un amigo?",
        min: 0,
        max: 10,
        minLabel: "Nada probable",
        maxLabel: "Seguro",
        required: true,
      },
      { id: "mantienes", kind: "text", label: "¿Qué vas a mantener a partir de mañana?" },
      {
        id: "wants_more",
        kind: "choice",
        label: "¿Quieres seguir con un plan de 90 días?",
        required: true,
        options: [
          { value: "yes", label: "Sí, apúntame a la lista de espera" },
          { value: "maybe", label: "Quizá, según lo que incluya" },
          { value: "no", label: "No, por ahora" },
        ],
      },
      {
        id: "precio",
        kind: "choice",
        label: "¿Cuánto pagarías por los 90 días?",
        required: true,
        options: [
          { value: "0", label: "Nada" },
          { value: "lt20", label: "Menos de 20 €" },
          { value: "20-39", label: "Entre 20 y 39 €" },
          { value: "40-59", label: "Entre 40 y 59 €" },
          { value: "60+", label: "60 € o más" },
        ],
      },
      { id: "porque", kind: "text", label: "¿Por qué esa cantidad?" },
      { id: "necesitas", kind: "text", label: "¿Qué necesitarías para seguir?" },
    ],
    thanks: "Gracias por estos 30 días. Tu Sistema sigue aquí y puedes descargarlo en PDF cuando quieras.",
  },
];

export const SURVEY_BY_ID: Record<SurveyId, Survey> = Object.fromEntries(SURVEYS.map((s) => [s.id, s])) as Record<
  SurveyId,
  Survey
>;

export const WAITLIST_THANKS = "Estás en la lista de espera del plan de 90 días. Te escribiremos antes que a nadie.";
