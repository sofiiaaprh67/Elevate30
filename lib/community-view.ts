/** Ayudas de presentación para la comunidad (lógica pura). */
import { formatShortDate, programDay, PROGRAM_DAYS, type ISODate } from "@/lib/domain/program";

/** "Día 12 de 30", "Empieza el 11 ene" o "Ha terminado"; null si no comparte su progreso. */
export function dayLabel(programStart: ISODate | null, today: ISODate): string | null {
  if (!programStart) return null;
  const day = programDay(programStart, today);
  if (day < 1) return `Empieza el ${formatShortDate(programStart)}`;
  if (day > PROGRAM_DAYS) return "Ha terminado";
  return `Día ${day} de ${PROGRAM_DAYS}`;
}

/** Momento de la petición (se calcula una vez en el servidor y se pasa a los componentes). */
export function requestTime(): number {
  return Date.now();
}
