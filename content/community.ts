/** Textos de la comunidad ELEVATE. Edita aquí. */

export const COMMUNITY_NAME = "Cohorte Fundadora";

/** Normas que se aceptan en el Día 0. */
export const NORMS: { title: string; text: string }[] = [
  { title: "Celebramos la constancia, no el rendimiento", text: "Aquí cuenta volver, no ganar. Sin rankings ni comparaciones." },
  {
    title: "Nada de cuerpos, pesos ni calorías",
    text: "No se publican fotos de «antes y después», ni pesos, ni calorías, ni dietas.",
  },
  { title: "Sin consejos médicos", text: "Comparte lo que te funciona, pero no des consejos de salud a nadie." },
  { title: "Respeto siempre", text: "Ni burlas, ni acoso, ni mensajes que hagan sentir mal a otra persona." },
  {
    title: "Si algo no está bien, denúncialo",
    text: "El equipo revisa cada denuncia en 48 horas como máximo y explica lo que decide.",
  },
];

export const VISIBILITY_OPTIONS = [
  { value: "all", label: "Todo mi progreso", detail: "Tu anillo, tu calendario, tu racha y tus insignias." },
  { value: "ring", label: "Solo el anillo", detail: "Se ve en qué día vas, sin detalle." },
  { value: "none", label: "Nada", detail: "Solo tu nombre y lo que publiques." },
] as const;

export const REACTION_LABELS = { vamos: "Vamos", bien: "Bien hecho", cuenta: "Cuenta" } as const;

export const REPORT_REASONS = [
  { value: "acoso", label: "Acoso o falta de respeto" },
  { value: "cuerpo", label: "Cuerpos, pesos o calorías" },
  { value: "salud", label: "Consejos médicos o algo que preocupa" },
  { value: "spam", label: "Spam o publicidad" },
  { value: "otro", label: "Otra cosa" },
] as const;

/** Lo que se muestra cuando alguien cuenta algo que preocupa. */
export const CARE_NOTE =
  "Si estás pasando por un momento difícil, no tienes que pasarlo sin ayuda: en España puedes llamar al 024 (atención a la conducta suicida, 24 horas) o al 112 si es una emergencia.";
