/**
 * Las 30 lecciones de ELEVATE 30 (v2).
 * Edita aquí los textos. `videoUrl` es opcional: cuando lo rellenes,
 * la lección mostrará el vídeo. Cada lección se lee en 2 minutos como máximo.
 *
 * Cada lección tiene:
 * - text: la idea principal (1–2 frases)
 * - body: el desarrollo (párrafos cortos)
 * - steps: cómo aplicarlo hoy, en orden
 * - basis: en qué se apoya. Solo es "study" (Por qué funciona) si hay un
 *   estudio verificado, con su enlace. Si no, es "practice" (herramienta
 *   práctica) y no se presenta como ciencia.
 * - action: lo que la persona hace hoy
 *
 * action.kind:
 * - "check": casilla "hecho"
 * - "form": campos de texto que se guardan y pasan a formar parte de "Tu sistema"
 *   (se guardan en entries con kind "lesson" y el día de la lección).
 *   Un campo con `slot` usa el nombre del hábito como etiqueta.
 * - "wheel": volver a puntuar la rueda de la vida (día 15)
 * - "text": carta al yo del día 1 (día 29)
 * - "choice": elegir una opción que se guarda (día 30)
 */
import type { Slot } from "@/lib/domain/types";

export type FormField = {
  key: string;
  label?: string;
  placeholder?: string;
  slot?: Slot;
  rows?: number;
};

export type LessonAction =
  | { kind: "check"; text: string }
  | { kind: "form"; text: string; fields: FormField[] }
  | { kind: "wheel"; text: string }
  | { kind: "text"; text: string; entry: "letter_day1"; placeholder: string }
  | {
      kind: "choice";
      text: string;
      entry: "plan_90";
      options: { value: string; label: string; detail: string }[];
    };

export type LessonBasis =
  | { kind: "study"; text: string; source: string; url: string }
  | { kind: "practice"; text: string };

export type Lesson = {
  day: number;
  title: string;
  text: string;
  body: string[];
  steps: string[];
  basis?: LessonBasis;
  action: LessonAction;
  videoUrl?: string;
};

const check = (text: string): LessonAction => ({ kind: "check", text });
const practice = (text: string): LessonBasis => ({ kind: "practice", text });

/** Estudios verificados (consultados el 7 de noviembre de 2026). */
const STUDIES = {
  lally: { source: "Lally y otros, University College London, 2010", url: "https://doi.org/10.1002/ejsp.674" },
  freshStart: { source: "Dai, Milkman y Riis, Management Science, 2014", url: "https://doi.org/10.1287/mnsc.2014.1901" },
  ifThen: {
    source: "Gollwitzer y Sheeran, metaanálisis, 2006",
    url: "https://doi.org/10.1016/S0065-2601(06)38002-1",
  },
  selfCompassion: {
    source: "Breines y Chen, Personality and Social Psychology Bulletin, 2012",
    url: "https://doi.org/10.1177/0146167212445599",
  },
  sighing: { source: "Balban y otros, Cell Reports Medicine, 2023", url: "https://doi.org/10.1016/j.xcrm.2022.100895" },
} as const;

const study = (key: keyof typeof STUDIES, text: string): LessonBasis => ({ kind: "study", text, ...STUDIES[key] });

/** Opciones del día 30. */
export const PLAN_90_OPTIONS = [
  {
    value: "keep",
    label: "Mantener mis 3 hábitos",
    detail: "Mismos hábitos y misma hora. El objetivo es que salgan solos.",
  },
  {
    value: "level_up",
    label: "Subir de nivel",
    detail: "Tu nivel medio pasa a ser tu nuevo mínimo.",
  },
  {
    value: "add",
    label: "Añadir un hábito nuevo",
    detail: "Solo si tus 3 hábitos ya salen casi sin pensar.",
  },
];

export const LESSONS: Lesson[] = [
  // ---------------------------------------------------------------- DECIDIR
  {
    day: 1,
    title: "La última vez que empiezas de cero",
    text: "Cada lunes y cada enero, muchísima gente decide cambiar. La mayoría lo deja a las pocas semanas, y no por falta de ganas: le falta un sistema que aguante cuando las ganas se acaban.",
    body: [
      "Durante 30 días vas a construir ese sistema con un método de cuatro pasos: decidir, cumplir, revisar y repetir. Cada día, una lección corta, una acción concreta y tus 3 hábitos.",
      "La regla es sencilla: nunca dos días seguidos en blanco. Si solo te da para el mínimo, haces el mínimo.",
    ],
    steps: [
      "Instala la app en tu pantalla de inicio desde Perfil.",
      "Elige un momento fijo para tu check-in, por ejemplo al lavarte los dientes por la noche.",
      "Escribe abajo por qué estás aquí. Lo volverás a leer el día 29.",
    ],
    basis: study(
      "freshStart",
      "Las fechas que suenan a comienzo, como un lunes o un año nuevo, disparan las ganas de empezar. Es el «efecto nuevo comienzo». Ese impulso dura poco si no se convierte en rutina: por eso hoy empiezas un sistema, no un propósito.",
    ),
    action: {
      kind: "form",
      text: "Escribe tu porqué.",
      fields: [
        { key: "change", label: "¿Qué quieres que sea distinto el día 30?", placeholder: "El día 30 quiero…" },
        { key: "why", label: "¿Por qué te importa ahora?", placeholder: "Me importa porque…" },
      ],
    },
  },
  {
    day: 2,
    title: "Dónde estás hoy",
    text: "Antes de cambiar nada, mira con sinceridad. Tus notas más bajas no son un fracaso: son el sitio donde un poco de esfuerzo se nota más.",
    body: [
      "Algunas áreas tienen efecto dominó. Dormir mejor o moverte más suele subir también tu energía, tu ánimo y tu concentración. Por eso tu plan empieza por el cuerpo y la mente, y no solo por tu objetivo.",
    ],
    steps: [
      "Abre Progreso y mira tu rueda de la vida.",
      "Fíjate en tus 2 áreas más bajas. Te las recordamos aquí abajo.",
      "Pregúntate cuál de las dos, si mejorara, arrastraría a las demás.",
    ],
    basis: practice(
      "La rueda de la vida es una herramienta de coaching: no es un test, es una foto de cómo estás hoy para decidir por dónde empezar.",
    ),
    action: check("Elige cuál de tus 2 áreas más bajas tendría más efecto dominó si mejorara."),
  },
  {
    day: 3,
    title: "Un objetivo, no diez",
    text: "Querer mejorar en todo a la vez es la forma más rápida de no mejorar en nada. Un objetivo concreto te dice cada día hacia dónde ir.",
    body: [
      "«Ponerme en forma» o «ser más productivo» no se pueden cumplir, porque nunca sabes cuándo lo has conseguido. Un buen objetivo tiene tres partes: qué, cuánto y para cuándo.",
      "En 30 días no vas a cambiar tu vida entera, pero sí puedes dar un paso visible. Elige ese paso.",
    ],
    steps: [
      "Escribe tu objetivo con un número y una fecha.",
      "Si es muy grande, quédate con la parte que cabe en estos 30 días.",
      "Decide qué señal te dirá el día 30 que vas por buen camino.",
    ],
    basis: practice("Qué, cuánto y para cuándo: así un deseo se convierte en algo que puedes revisar cada semana."),
    action: {
      kind: "form",
      text: "Concreta tu objetivo.",
      fields: [
        {
          key: "goal",
          label: "Tu objetivo: qué, cuánto y para cuándo",
          placeholder: "Aprobar Estadística con un 7 antes del 5 de febrero",
        },
        {
          key: "signal",
          label: "¿Cómo sabrás el día 30 que vas bien?",
          placeholder: "Habré hecho 20 bloques de estudio y los ejercicios de los temas 1 a 4",
        },
      ],
    },
  },
  {
    day: 4,
    title: "Tu sistema, no solo tu meta",
    text: "Tu objetivo es el resultado; tus hábitos son lo que haces cada día para llegar. El resultado no lo controlas del todo. Lo que haces hoy, sí.",
    body: [
      "Por eso en ELEVATE mides tus hábitos y no tu objetivo. Si cumples los hábitos, el resultado acaba llegando. Si solo miras el resultado, te frustras los días en que no se mueve.",
      "Hoy es el último día para cambiar un hábito de cuerpo o de mente. Y es buen momento para confirmar tu ancla: el que mantendrías en tu peor día.",
    ],
    steps: [
      "Abre tu plan y lee el motivo de cada hábito.",
      "Si uno no encaja con tu vida real, cámbialo hoy.",
      "Confirma tu ancla, o cámbiala si ahora lo ves de otra forma.",
    ],
    basis: practice(
      "Medir lo que haces cada día, y no solo el resultado final, te deja ajustar a tiempo en lugar de enterarte al final.",
    ),
    action: check("Revisa tus 3 hábitos, cambia el que no encaje y confirma tu ancla."),
  },
  {
    day: 5,
    title: "Los 3 niveles: completo, medio y mínimo",
    text: "No todos los días tienes la misma energía. Con tres niveles siempre hay una versión del hábito que sí puedes cumplir.",
    body: [
      "Completo es para los días buenos, medio para los normales y mínimo para los malos. El mínimo no es hacer trampa: es lo que mantiene vivo el hábito cuando todo lo demás falla.",
      "Un buen mínimo dura 2 minutos o menos y consiste en empezar. Si te da pereza solo de pensarlo, es demasiado grande.",
    ],
    steps: [
      "Lee los tres niveles de cada hábito.",
      "Pregúntate si podrías hacer el mínimo con exámenes, con fiebre o llegando a casa a las once.",
      "Hoy haz los 3 hábitos en mínimo, solo para comprobar lo fácil que es.",
    ],
    basis: study(
      "lally",
      "En el estudio de la UCL, los hábitos se fueron volviendo automáticos al repetirlos en el mismo contexto. Lo que contaba era repetir, no la intensidad: un mínimo repetido construye más que un esfuerzo heroico aislado.",
    ),
    action: check("Haz hoy tus 3 hábitos, al menos en mínimo, y registra el check-in."),
  },
  {
    day: 6,
    title: "Cuándo y dónde: tu plan si-entonces",
    text: "Un hábito sin hora es solo una intención. Decidir antes cuándo y dónde lo harás te ahorra tener que decidirlo cada día.",
    body: [
      "La fórmula es sencilla: «Cuando [momento y lugar], haré [hábito]». Cuanto más concreto, mejor: «al llegar a casa y dejar la mochila» funciona mejor que «por la tarde».",
      "Con el plan escrito, ese momento se convierte en el aviso. Ya no dependes de acordarte ni de tener ganas.",
    ],
    steps: [
      "Para cada hábito, elige un momento que ya exista en tu día.",
      "Escribe el plan con la fórmula «Cuando…, haré…».",
      "Ponlo en tu calendario o en una alarma con ese mismo texto.",
    ],
    basis: study(
      "ifThen",
      "Los planes «si-entonces» ayudan a pasar de la intención a la acción. Los análisis que reúnen muchos estudios encuentran un efecto real, aunque más modesto de lo que se creía: ayudan, no hacen magia.",
    ),
    action: {
      kind: "form",
      text: "Escribe tu plan si-entonces para cada hábito.",
      fields: [
        { key: "body", slot: "body", placeholder: "Cuando…, haré…" },
        { key: "mind", slot: "mind", placeholder: "Cuando…, haré…" },
        { key: "goal", slot: "goal", placeholder: "Cuando…, haré…" },
      ],
    },
  },
  {
    day: 7,
    title: "Revisión 1: tu punto de partida",
    text: "Llevas una semana decidiendo. Antes de empezar a cumplir en serio, toca mirar qué has aprendido de ti.",
    body: [
      "Revisar no es juzgarte. Es mirar tus datos como lo haría un buen entrenador: qué ha salido, qué no y qué cambias. Cinco minutos bastan.",
    ],
    steps: [
      "Mira tus check-ins de la semana en la revisión de abajo.",
      "Responde a las tres preguntas sin pensarlo demasiado.",
      "Decide qué haces con cada hábito: mantener, bajar o subir.",
    ],
    action: check("Haz tu primera revisión semanal."),
  },

  // ---------------------------------------------------------------- CUMPLIR
  {
    day: 8,
    title: "Cuando fallas un día (y pasará)",
    text: "Vas a fallar algún día: no es una posibilidad, es parte del plan. Lo que decide si sigues no es el fallo, sino lo que te dices después.",
    body: [
      "Después de saltarte algo es muy fácil pensar «ya da igual» y abandonar. La regla de ELEVATE lo corta de raíz: nunca dos días seguidos sin nada. Si un hábito tuvo «hoy no», al día siguiente toca al menos su mínimo.",
      "Hablarte como le hablarías a un amigo no te hace blando: te ayuda a volver antes. Hoy dejas escrito qué harás en tus días malos, ahora que tienes la cabeza fría.",
    ],
    steps: [
      "Piensa en tu último día malo: ¿cómo te diste cuenta de que lo era?",
      "Escribe qué es lo más probable que te saque del plan.",
      "Decide qué harás cuando pase, con la fórmula «Si…, entonces…».",
    ],
    basis: study(
      "selfCompassion",
      "Las personas que se trataron con comprensión después de un fallo se esforzaron más por mejorar que las que se criticaron.",
    ),
    action: {
      kind: "form",
      text: "Escribe tu plan para los días malos.",
      fields: [
        {
          key: "signal",
          label: "¿Cómo sabes que estás teniendo un día malo?",
          placeholder: "Me levanto tarde, no paro de mirar el móvil…",
        },
        {
          key: "obstacle",
          label: "¿Qué es lo más probable que te saque del plan?",
          placeholder: "Un examen, un turno largo, estar sin ganas…",
        },
        {
          key: "plan",
          label: "Tu plan: «Si…, entonces…»",
          placeholder: "Si llego a casa sin energía, entonces haré el mínimo de mi ancla antes de cenar.",
        },
      ],
    },
  },
  {
    day: 9,
    title: "Planifica tu día en 5 minutos",
    text: "Quien avanza no tiene más tiempo: tiene claro qué es lo importante antes de que empiece el día.",
    body: [
      "Cinco minutos la noche anterior te ahorran una mañana de dudas y de mirar el móvil sin saber por dónde empezar. Además, escribir lo pendiente libera la cabeza para descansar.",
    ],
    steps: [
      "Esta noche, escribe las 3 prioridades de mañana. Solo 3.",
      "Ponles hora en tu calendario, empezando por la más importante.",
      "Haz que el bloque de tu objetivo sea una de ellas.",
    ],
    basis: practice("Tres prioridades con hora: si todo es importante, nada lo es."),
    action: check("Escribe esta noche las 3 prioridades de mañana y dales hora."),
  },
  {
    day: 10,
    title: "Diseña tu entorno",
    text: "La fuerza de voluntad se gasta; el entorno no. Haz que lo bueno sea fácil y que lo que te frena sea incómodo.",
    body: [
      "Mucho de lo que haces cada día lo haces en piloto automático, guiado por lo que tienes delante. Si el móvil está en la mesa, lo miras. Si las zapatillas están junto a la puerta, sales.",
      "Un cambio pequeño en el sitio correcto vale más que mucha disciplina.",
    ],
    steps: [
      "Haz visible la señal de un hábito: el libro en la almohada o la botella de agua en la mesa.",
      "Quita pasos: deja preparada la ropa, la mochila o el documento abierto.",
      "Pon trabas a lo que te distrae: el móvil en otra habitación mientras trabajas en tu objetivo.",
    ],
    basis: practice("Más fácil lo que quieres hacer, más difícil lo que quieres evitar: dos cambios, cero fuerza de voluntad."),
    action: check("Haz hoy un cambio en tu entorno que te facilite un hábito mañana."),
  },
  {
    day: 11,
    title: "Moverse con la agenda llena",
    text: "No necesitas una hora de gimnasio para cuidar tu cuerpo. Moverte un poco cada día suma más que entrenar fuerte una vez y abandonar.",
    body: [
      "Todo movimiento cuenta: ir andando a clase, subir escaleras o hacer una llamada caminando. Los minutos sueltos también suman.",
      "Si tu hábito es entrenar, los días sin tiempo no son días perdidos: son días de nivel medio o mínimo.",
    ],
    steps: [
      "Busca 2 momentos de tu día en los que podrías moverte: trayectos, llamadas o descansos.",
      "Haz tu sesión al nivel que te permita el día.",
      "Si pasas muchas horas sentado, levántate 2 o 3 minutos cada hora.",
    ],
    basis: practice("Moverte poco y a menudo es más fácil de mantener que entrenar mucho de vez en cuando."),
    action: check("Haz hoy una sesión de movimiento, aunque sea corta."),
  },
  {
    day: 12,
    title: "Dormir es parte del plan",
    text: "Dormir mal te quita energía, concentración y ganas. Ser ambicioso también es proteger tu descanso.",
    body: [
      "Lo que más ayuda no es dormir mucho un día, sino tener horarios parecidos todos los días. Tu cuerpo funciona con un reloj interno, y los cambios constantes lo desajustan.",
    ],
    steps: [
      "Fija una hora de despertar y mantenla también el fin de semana, con una hora de margen como mucho.",
      "Toma el último café a primera hora de la tarde.",
      "Baja las luces y deja las pantallas un rato antes de dormir.",
    ],
    basis: practice("Horarios parecidos cada día, luz por la mañana y menos pantallas por la noche: lo básico que casi siempre ayuda."),
    action: check("Fija tu hora de desconexión y cúmplela esta noche."),
  },
  {
    day: 13,
    title: "Comer para rendir, sin dietas",
    text: "No hace falta una dieta para comer mejor. Una mejora pequeña que mantienes cambia más que un plan perfecto que dura una semana.",
    body: [
      "Empieza por añadir, no por prohibir. Añadir verdura, proteína o agua es mucho más fácil de mantener que quitarte lo que te gusta. Aquí no hay pesos ni calorías: solo comidas que te ayudan a rendir.",
    ],
    steps: [
      "Usa el método del plato en una comida: la mitad verdura o fruta, un cuarto proteína y un cuarto hidratos, mejor integrales.",
      "Ten algo saludable a mano para cuando te entre hambre entre horas.",
      "Bebe agua con cada comida.",
    ],
    basis: practice(
      "El método del plato es una guía de alimentación, no un estudio: una forma sencilla de equilibrar una comida sin contar nada.",
    ),
    action: check("Haz hoy una de tus comidas con el método del plato."),
  },
  {
    day: 14,
    title: "Revisión 2: lo que dicen tus datos",
    text: "Dos semanas. Tus check-ins ya cuentan una historia: qué hábito sale solo y cuál necesita ayuda.",
    body: [
      "Cuando un hábito no sale, casi nunca es por falta de fuerza de voluntad. Suele fallar una de tres cosas: la señal (no te acuerdas), la dificultad (es demasiado grande) o las ganas (no te importa lo suficiente).",
    ],
    steps: [
      "Mira en la revisión de abajo cuál es tu hábito con peores datos.",
      "Averigua qué falla: la señal, la dificultad o las ganas.",
      "Arregla primero la señal o la dificultad: son las más fáciles de cambiar.",
    ],
    basis: practice("Señal, dificultad y ganas: si falta una, el hábito no ocurre. Empieza por las dos primeras."),
    action: check("Haz tu revisión semanal."),
  },

  // ---------------------------------------------------------------- REVISAR
  {
    day: 15,
    title: "Mitad del camino",
    text: "Llevas 15 días construyendo. Compararte con tu punto de partida es la mejor forma de ver un progreso que en el día a día no se nota.",
    body: [
      "Puede que alguna nota haya subido y otra no. Es normal: los hábitos cambian primero lo que haces y después cómo te sientes.",
    ],
    steps: [
      "Vuelve a puntuar tu rueda pensando en cómo estás hoy.",
      "Compara con la marca fina, que es tu nota del Día 0.",
      "Quédate con un área que haya subido y piensa qué la ha movido.",
    ],
    action: { kind: "wheel", text: "Vuelve a puntuar tu rueda de la vida." },
  },
  {
    day: 16,
    title: "Tu modo semana difícil",
    text: "Habrá semanas complicadas: exámenes, entregas, viajes. Tenerlas planeadas evita que te saquen del camino.",
    body: [
      "La semana difícil no es la excepción: siempre acaba llegando. Lo que cambia es si la vives improvisando o con un plan B ya decidido.",
      "En modo semana difícil, solo tu ancla es obligatoria. Los otros dos hábitos pasan a ser opcionales sin culpa. La app te propondrá activarlo la víspera de las semanas que marcaste como críticas, y también puedes activarlo tú cuando lo necesites.",
    ],
    steps: [
      "Piensa en la próxima semana complicada que ya ves venir.",
      "Confirma lo que mantienes sí o sí: el mínimo de tu ancla.",
      "Decide qué dejas en pausa sin culpa y cuándo lo retomas.",
    ],
    basis: practice("Decidir el plan B con la cabeza fría es más fácil que improvisarlo en mitad de la tormenta."),
    action: {
      kind: "form",
      text: "Diseña tu modo semana difícil.",
      fields: [
        { key: "when", label: "¿Qué semanas difíciles ves venir?", placeholder: "Los exámenes de febrero, el viaje de marzo…" },
        { key: "keep", label: "¿Qué mantienes sí o sí?", placeholder: "El mínimo de mi ancla y dormir 7 horas." },
        { key: "pause", label: "¿Qué dejas en pausa sin culpa?", placeholder: "Entrenar completo: lo retomo el lunes siguiente." },
      ],
    },
  },
  {
    day: 17,
    title: "Ajustar no es rendirse",
    text: "Si un hábito no sale, el problema no eres tú: es el diseño. Cambiarlo para seguir avanzando es una decisión inteligente.",
    body: ["Ajustar a tiempo es lo que separa a quien termina de quien abandona en la tercera semana."],
    steps: [
      "Elige el hábito que más te cuesta. Aquí abajo te decimos cuál es según tus datos.",
      "Cambia una sola cosa: la hora, la señal o el nivel.",
      "Pruébalo así 3 días antes de volver a juzgarlo.",
    ],
    action: check("Cambia una cosa del hábito que más te cuesta: la hora, la señal o el nivel."),
  },
  {
    day: 18,
    title: "Tu mente también entrena",
    text: "Pasar el día respondiendo a todo agota. Unos minutos sin estímulos te devuelven claridad.",
    body: [
      "No necesitas meditar media hora. La respiración es la forma más rápida de calmar el cuerpo, y funciona en cualquier sitio: en la biblioteca, en el metro o antes de una reunión.",
    ],
    steps: [
      "Prueba el suspiro cíclico: dos inspiraciones por la nariz, la segunda más corta, y una espiración larga por la boca.",
      "Repítelo durante 5 minutos, a tu ritmo.",
      "Si lo prefieres, escribe 3 líneas sobre cómo estás y qué te preocupa.",
    ],
    basis: study(
      "sighing",
      "Cinco minutos diarios de suspiro cíclico durante un mes mejoraron el estado de ánimo y redujeron la ansiedad, algo más que la meditación en el mismo estudio.",
    ),
    action: check("Haz 5 minutos de suspiro cíclico o escribe 3 líneas sobre cómo estás."),
  },
  {
    day: 19,
    title: "Ambición sin dejar fuera a tu gente",
    text: "Perseguir tus objetivos no debería dejarte solo. Las relaciones también se cuidan con constancia.",
    body: [
      "Cuando vas con prisa, lo primero que se aplaza son las personas, porque nunca protestan a tiempo. Un plan pequeño y concreto vale más que un «a ver si quedamos».",
    ],
    steps: [
      "Piensa en una persona con la que hace tiempo que no hablas de verdad.",
      "Escríbele hoy y propón un día y una hora concretos.",
      "Cuando quedéis, deja el móvil guardado.",
    ],
    basis: practice("Un día y una hora concretos convierten un «a ver si quedamos» en un plan."),
    action: check("Escribe hoy a alguien que te importa y propón un día para veros."),
  },
  {
    day: 20,
    title: "Saber cuándo parar",
    text: "Sin una hora de cierre, el trabajo o el estudio lo ocupan todo. Parar a tiempo es lo que te deja volver con energía mañana.",
    body: [
      "Si terminas el día con tareas abiertas en la cabeza, sigues dándoles vueltas aunque ya estés descansando. Un pequeño ritual de cierre le dice a tu cabeza que todo está apuntado.",
    ],
    steps: [
      "Elige tu hora de cierre.",
      "Diseña un ritual de 3 pasos: repasar lo pendiente, apuntar lo primero de mañana y cerrar el portátil.",
      "Termina siempre con el mismo gesto, para marcar el final.",
    ],
    basis: practice("Apuntar lo pendiente y cerrar con el mismo gesto cada día ayuda a desconectar de verdad."),
    action: {
      kind: "form",
      text: "Define tu cierre del día.",
      fields: [
        { key: "time", label: "Tu hora de cierre", placeholder: "20:30", rows: 1 },
        {
          key: "ritual",
          label: "Tu ritual de cierre",
          placeholder: "Repaso lo pendiente, apunto lo primero de mañana y cierro el portátil.",
        },
      ],
    },
  },
  {
    day: 21,
    title: "Revisión 3: qué ajustar",
    text: "Tres semanas. Ahora toca ajustar con datos, no con sensaciones.",
    body: [
      "Si un hábito lleva días en completo sin esfuerzo, súbelo. Si sigue costando, bájalo o cámbialo de hora. Las dos cosas son progreso.",
    ],
    steps: [
      "Mira los datos de tu semana en la revisión de abajo.",
      "Decide qué hábito subes y, si hace falta, cuál bajas.",
      "Escribe el ajuste concreto para la semana 4.",
    ],
    action: check("Haz tu revisión semanal."),
  },

  // ---------------------------------------------------------------- REPETIR
  {
    day: 22,
    title: "Del esfuerzo a la costumbre",
    text: "Hay hábitos que ya no te cuesta pensar. Es la señal de que se están convirtiendo en parte de ti.",
    body: [
      "Cada check-in es una prueba de quién eres. No es lo mismo «intento salir a caminar» que «soy una persona que camina cada día». La segunda frase se defiende sola.",
    ],
    steps: [
      "Elige el hábito que más cumples.",
      "Escribe una frase que empiece por «Soy una persona que…».",
      "Léela antes de hacer el hábito los próximos días.",
    ],
    basis: practice("Lo que repites acaba diciendo quién eres. Ponerle palabras ayuda a sostenerlo."),
    action: {
      kind: "form",
      text: "Escribe tu frase de identidad.",
      fields: [{ key: "identity", label: "Soy una persona que…", placeholder: "…se mueve cada día, aunque sea poco." }],
    },
  },
  {
    day: 23,
    title: "Encadena hábitos",
    text: "La forma más fácil de recordar un hábito es unirlo a algo que ya haces cada día sin pensar.",
    body: [
      "Lavarte los dientes, hacer el café o llegar a casa son señales que nunca fallan. Si pegas tu hábito justo detrás, el ancla hace de recordatorio.",
      "Y si un hábito te da pereza, únelo a algo que te guste: tu pódcast favorito solo mientras caminas.",
    ],
    steps: [
      "Elige el hábito que más se te olvida.",
      "Busca algo que ya haces cada día justo antes del momento ideal.",
      "Escribe: «Después de [ancla], haré [hábito]».",
    ],
    basis: study(
      "ifThen",
      "Unir el hábito a una señal concreta es otra forma de plan «si-entonces»: cuando ocurre la señal, la acción ya está decidida.",
    ),
    action: check("Une tu hábito más olvidado a algo que ya haces cada día."),
  },
  {
    day: 24,
    title: "Volver sin empezar de cero",
    text: "Un viaje, una gripe o una semana de exámenes pueden sacarte del plan varios días. Lo que importa es cómo vuelves: sin empezar de cero.",
    body: [
      "Volver no es recuperar lo perdido ni compensar con un día enorme. Es retomar con el mínimo el primer día posible y subir poco a poco.",
      "Tu racha no vuelve a cero por un día en blanco, y tu sistema tampoco: sigue ahí, esperando a que lo retomes.",
    ],
    steps: [
      "Piensa qué te puede sacar del plan varios días este año.",
      "Decide con qué nivel vuelves. Casi siempre, el mínimo.",
      "Decide qué día vuelves, como muy tarde.",
    ],
    basis: study(
      "lally",
      "En el estudio de la UCL, saltarse un día suelto no frenó la formación del hábito. Los fallos repetidos sí lo debilitaban: por eso lo que cuenta es volver pronto, no volver perfecto.",
    ),
    action: {
      kind: "form",
      text: "Escribe tu plan de vuelta.",
      fields: [
        {
          key: "trigger",
          label: "¿Qué te puede sacar del plan varios días?",
          placeholder: "Un viaje, ponerme enfermo, la semana de exámenes…",
        },
        { key: "level", label: "¿Con qué nivel vuelves?", placeholder: "Con el mínimo de los 3 hábitos." },
        { key: "when", label: "¿Qué día vuelves, como muy tarde?", placeholder: "El día después de volver a casa." },
      ],
    },
  },
  {
    day: 25,
    title: "Celebra el progreso pequeño",
    text: "Solemos fijarnos en lo que falta y no en lo que ya hemos construido. Hoy toca mirarlo.",
    body: [
      "Las pequeñas victorias motivan más de lo que parece. Verlas escritas te recuerda que estás avanzando, sobre todo los días en que no lo sientes.",
    ],
    steps: [
      "Mira tu calendario de 30 días en Progreso.",
      "Apunta 3 cosas que has conseguido, por pequeñas que sean.",
      "Celébralo: cuéntalo en la comunidad o date un capricho.",
    ],
    basis: practice("Escribir lo que has conseguido hace visible un progreso que en el día a día no se nota."),
    action: {
      kind: "form",
      text: "Apunta tus victorias.",
      fields: [{ key: "wins", label: "3 cosas que has construido estos días", placeholder: "1. …\n2. …\n3. …", rows: 4 }],
    },
  },
  {
    day: 26,
    title: "Compárate solo contigo",
    text: "La única comparación justa es con quien eras hace 26 días.",
    body: [
      "En redes ves el mejor momento de los demás y lo comparas con tu día normal. Es una comparación que siempre pierdes. Tus datos, en cambio, cuentan la verdad.",
    ],
    steps: [
      "Abre Progreso y mira tu primera semana.",
      "Compárala con esta: días que cuentan, niveles y racha.",
      "Quédate con una cosa que hayas mejorado, aunque sea poca.",
    ],
    action: check("Compara tu primera semana con esta en Progreso."),
  },
  {
    day: 27,
    title: "Tu ritual de revisión",
    text: "Lo que te ha traído hasta aquí es revisar cada semana. Convertirlo en ritual hace que siga funcionando después del día 30.",
    body: [
      "El programa acaba, pero el método no. Decidir, cumplir, revisar y repetir es un ciclo que puedes usar cada semana durante años.",
    ],
    steps: [
      "Mira en Perfil qué día caen tus revisiones.",
      "Añádelo a tu calendario como una cita que se repite cada semana.",
      "Usa siempre las mismas 3 preguntas: qué ha funcionado, qué no y qué ajustas.",
    ],
    action: check("Pon tu revisión en el calendario como una cita que se repite cada semana."),
  },
  {
    day: 28,
    title: "Revisión 4: lo que te llevas",
    text: "Cuatro semanas completas. Esta revisión es la base de lo que viene después.",
    body: [
      "Mira el mes entero: qué hábito se ha quedado, cuál ha costado más y qué has aprendido de cómo funcionas tú.",
    ],
    steps: [
      "Mira tus datos de la semana en la revisión de abajo.",
      "Responde pensando en el día 31, no en lo que ya pasó.",
      "Decide qué hábito mantienes, cuál subes y cuál cambias.",
    ],
    action: check("Haz tu última revisión del programa."),
  },

  // ---------------------------------------------------------------- CIERRE
  {
    day: 29,
    title: "Mira lo que has construido",
    text: "Hace 29 días decidiste empezar. Hoy toca mirar atrás y reconocer el camino.",
    body: [
      "El día 1 escribiste por qué estabas aquí. Léelo antes de escribir tu carta: te sorprenderá lo que ha cambiado.",
    ],
    steps: [
      "Lee tu porqué del día 1, aquí abajo.",
      "Escribe una carta corta a esa persona: qué has aprendido, qué te ha costado y de qué sientes orgullo.",
      "Guárdala. Es la prueba de que puedes.",
    ],
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
    text: "El progreso no termina aquí: se construye. Hoy decides cómo siguen tus próximos 90 días.",
    body: [
      "30 días bastan para construir el sistema, pero no para que todo sea automático. Las próximas semanas son las que hacen que se quede.",
      "Si dudas, elige mantener: es lo que más protege lo que ya has construido. Tu Sistema es tuyo y sigue disponible siempre.",
    ],
    steps: [
      "Repasa tu sistema completo en la pestaña Sistema.",
      "Elige tu plan para los próximos 90 días.",
      "Pon la fecha de tu próxima revisión en el calendario.",
    ],
    basis: study(
      "lally",
      "En el estudio de la UCL, convertir una conducta en automática llevó de media 66 días, con casos de entre 18 y 254. Un mes es la base; lo que viene después la consolida.",
    ),
    action: {
      kind: "choice",
      text: "Elige tu plan para los próximos 90 días.",
      entry: "plan_90",
      options: PLAN_90_OPTIONS,
    },
  },
];

/** Días con revisión semanal. */
export const REVIEW_DAYS = [7, 14, 21, 28] as const;

export function lessonForDay(day: number): Lesson | undefined {
  return LESSONS.find((l) => l.day === day);
}

/** Días cuya acción es un formulario que forma parte de "Tu sistema". */
export const FORM_DAYS = LESSONS.filter((l) => l.action.kind === "form").map((l) => l.day);
