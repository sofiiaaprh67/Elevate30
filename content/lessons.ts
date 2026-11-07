/**
 * Las 30 lecciones de ELEVATE 30.
 * Edita aquí los textos. `videoUrl` es opcional: cuando lo rellenes,
 * la lección mostrará el vídeo.
 *
 * action.kind:
 * - "check": casilla "hecho"
 * - "wheel": volver a puntuar la rueda de la vida (día 15)
 * - "text": campo de texto que se guarda (`entry` = tipo de respuesta)
 * - "choice": elegir una opción que se guarda (día 30)
 */

export type LessonAction =
  | { kind: "check"; text: string }
  | { kind: "wheel"; text: string }
  | { kind: "text"; text: string; entry: "bad_days_plan" | "letter_day1"; placeholder: string }
  | { kind: "choice"; text: string; entry: "plan_90"; options: { value: string; label: string }[] };

export type Lesson = {
  day: number;
  title: string;
  text: string;
  action: LessonAction;
  videoUrl?: string;
};

const check = (text: string): LessonAction => ({ kind: "check", text });

export const LESSONS: Lesson[] = [
  {
    day: 1,
    title: "Bienvenida: la última vez que empiezas de cero",
    text: "ELEVATE 30 no va de hacerlo todo perfecto. Va de construir un sistema que aguante también tus días malos: durante 30 días vas a decidir, cumplir, revisar y repetir.",
    action: check("Mira tu rueda de la vida en Progreso y piensa qué quieres que sea distinto el día 30."),
  },
  {
    day: 2,
    title: "Dónde estás hoy",
    text: "Antes de cambiar nada hay que mirar con sinceridad. Tus áreas con nota más baja no son un fracaso: son el mejor sitio por donde empezar.",
    action: check("Confirma las 2 áreas que vas a mejorar este mes."),
  },
  {
    day: 3,
    title: "Un objetivo, no diez",
    text: "Querer mejorar en todo a la vez es la forma más rápida de no mejorar en nada. Un objetivo concreto y medible te dice cada día hacia dónde ir.",
    action: check("Escribe tu objetivo en una frase: qué, cuánto y para cuándo."),
  },
  {
    day: 4,
    title: "Los hábitos que sostienen tu objetivo",
    text: "Los objetivos se consiguen con lo que haces cada día, no con lo que decides una vez. Tus 3 hábitos base cubren tu cuerpo, tu mente y tu objetivo.",
    action: check("Revisa tus 3 hábitos en Perfil y cambia el que no te encaje."),
  },
  {
    day: 5,
    title: "Los 3 niveles: completo, medio y mínimo",
    text: "No todos los días tienes la misma energía. Con tres niveles siempre hay una versión del hábito que sí puedes cumplir.",
    action: check("Lee los niveles de cada hábito y piensa si son realistas para ti."),
  },
  {
    day: 6,
    title: "Tu semana tipo",
    text: "Un hábito sin hora es solo una intención. Colocarlo en tu horario hace que no tengas que decidir cada día si lo haces.",
    action: check("Apunta en tu calendario la hora de cada hábito."),
  },
  {
    day: 7,
    title: "Revisión 1: tu punto de partida",
    text: "Llevas una semana decidiendo. Antes de empezar a cumplir, mira qué has aprendido de ti.",
    action: check("Haz tu primera revisión semanal."),
  },
  {
    day: 8,
    title: "Empezar en mínimo también cuenta",
    text: "Hoy empieza la fase de cumplir. Si solo te da para el nivel mínimo, hazlo: un día en mínimo vale más que un día sin nada.",
    action: check("Haz tus 3 hábitos al nivel que puedas y registra el check-in."),
  },
  {
    day: 9,
    title: "Planifica tu día en 5 minutos",
    text: "Quien avanza no tiene más tiempo: tiene claro qué es lo importante. Cinco minutos la noche anterior te ahorran horas de dudas.",
    action: check("Escribe las 3 prioridades de mañana."),
  },
  {
    day: 10,
    title: "Diseña tu entorno",
    text: "La fuerza de voluntad se gasta; el entorno no. Haz que lo bueno sea fácil y lo que te frena, incómodo.",
    action: check("Prepara hoy algo que te facilite un hábito mañana."),
  },
  {
    day: 11,
    title: "Moverse con la agenda llena",
    text: "No necesitas una hora de gimnasio para cuidar tu cuerpo. Moverte un poco cada día suma más que entrenar fuerte una vez y abandonar.",
    action: check("Haz una sesión de movimiento, aunque sea corta."),
  },
  {
    day: 12,
    title: "Dormir es parte del plan",
    text: "Dormir mal te quita energía, concentración y ganas. Ser ambicioso también es proteger tu descanso.",
    action: check("Fija tu hora de desconexión y cúmplela esta noche."),
  },
  {
    day: 13,
    title: "Comer para rendir, sin dietas",
    text: "No hace falta una dieta para comer mejor. Una mejora pequeña que mantienes cambia más que un plan perfecto que dura una semana.",
    action: check("Haz hoy una mejora sencilla en una de tus comidas."),
  },
  {
    day: 14,
    title: "Revisión 2: lo que dicen tus datos",
    text: "Dos semanas. Tus check-ins ya cuentan una historia: qué hábito sale solo y cuál necesita ayuda.",
    action: check("Haz tu revisión semanal."),
  },
  {
    day: 15,
    title: "Mitad del camino",
    text: "Llevas 15 días construyendo. Compararte con tu punto de partida es la mejor forma de ver un progreso que en el día a día no se nota.",
    action: { kind: "wheel", text: "Vuelve a puntuar tu rueda de la vida." },
  },
  {
    day: 16,
    title: "Qué hacer cuando fallas un día",
    text: "Fallar un día no rompe nada; lo que rompe es pensar que ya da igual. La regla de ELEVATE: nunca dos días seguidos sin nada.",
    action: {
      kind: "text",
      text: "Escribe tu plan para los días malos.",
      entry: "bad_days_plan",
      placeholder: "Cuando tenga un día malo, voy a…",
    },
  },
  {
    day: 17,
    title: "Ajustar no es rendirse",
    text: "Si un hábito no sale, el problema no eres tú, es el diseño. Bajar el nivel para seguir avanzando es una decisión inteligente.",
    action: check("Ajusta los niveles del hábito que más te cuesta."),
  },
  {
    day: 18,
    title: "Tu mente también entrena",
    text: "Pasar el día respondiendo a todo agota. Unos minutos de silencio te devuelven claridad.",
    action: check("Haz 5 minutos sin pantallas o escribe 3 líneas sobre cómo estás."),
  },
  {
    day: 19,
    title: "Ambición sin dejar fuera a tu gente",
    text: "Perseguir tus objetivos no debería dejarte solo. Las relaciones también se cuidan con constancia.",
    action: check("Haz un plan con alguien, sin móvil."),
  },
  {
    day: 20,
    title: "Saber cuándo parar",
    text: "Sin una hora de cierre, el trabajo o el estudio lo ocupan todo. Parar a tiempo es lo que te deja volver con energía mañana.",
    action: check("Define tu hora de cierre y respétala hoy."),
  },
  {
    day: 21,
    title: "Revisión 3: qué ajustar",
    text: "Tres semanas. Ahora toca ajustar con datos, no con sensaciones.",
    action: check("Haz tu revisión semanal."),
  },
  {
    day: 22,
    title: "Del esfuerzo a la costumbre",
    text: "Hay hábitos que ya no te cuesta pensar. Es la señal de que se están convirtiendo en parte de ti.",
    action: check("Identifica qué hábito ya sale solo."),
  },
  {
    day: 23,
    title: "Encadena hábitos",
    text: "La forma más fácil de recordar un hábito es unirlo a algo que ya haces: después del café, al salir de clase, al llegar a casa.",
    action: check("Une uno de tus hábitos a algo que ya haces cada día."),
  },
  {
    day: 24,
    title: "Tu modo semana difícil",
    text: "Habrá semanas complicadas. Tenerlas planeadas evita que te saquen del camino.",
    action: check("Diseña cómo sería tu semana en nivel mínimo."),
  },
  {
    day: 25,
    title: "Celebra el progreso pequeño",
    text: "Solemos fijarnos en lo que falta y no en lo que ya hemos construido. Hoy toca mirarlo.",
    action: check("Apunta 3 cosas que has construido estos días."),
  },
  {
    day: 26,
    title: "Compárate solo contigo",
    text: "La única comparación justa es con quien eras hace 26 días.",
    action: check("Mira tus datos en Progreso y compáralos con tu primera semana."),
  },
  {
    day: 27,
    title: "Tu ritual de revisión",
    text: "Lo que te ha traído hasta aquí es revisar cada semana. Convertirlo en ritual hace que siga después del día 30.",
    action: check("Fija tu día y hora de revisión para después del programa."),
  },
  {
    day: 28,
    title: "Revisión 4",
    text: "Cuatro semanas completas. Esta revisión es la base de lo que viene.",
    action: check("Haz tu revisión semanal."),
  },
  {
    day: 29,
    title: "Mira lo que has construido",
    text: "Hace 29 días decidiste empezar. Hoy toca mirar atrás y reconocer el camino.",
    action: {
      kind: "text",
      text: "Escribe una carta corta a tu yo del día 1.",
      entry: "letter_day1",
      placeholder: "Querido yo del día 1:",
    },
  },
  {
    day: 30,
    title: "Y ahora, ¿qué?",
    text: "El progreso no termina aquí: se construye. Decide si mantienes, subes de nivel o añades un hábito nuevo.",
    action: {
      kind: "choice",
      text: "Elige tu plan para los próximos 90 días.",
      entry: "plan_90",
      options: [
        { value: "keep", label: "Mantener mis 3 hábitos" },
        { value: "level_up", label: "Subir de nivel" },
        { value: "add", label: "Añadir un hábito nuevo" },
      ],
    },
  },
];

/** Días con revisión semanal. */
export const REVIEW_DAYS = [7, 14, 21, 28] as const;

export const REVIEW_QUESTIONS = [
  { key: "worked", label: "¿Qué ha funcionado?" },
  { key: "didnt", label: "¿Qué no ha funcionado?" },
  { key: "adjust", label: "¿Qué ajustas para la semana que viene?" },
] as const;

export function lessonForDay(day: number): Lesson | undefined {
  return LESSONS.find((l) => l.day === day);
}
