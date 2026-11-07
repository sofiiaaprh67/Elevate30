import "server-only";
import { DEFAULT_START_DATE, type ISODate } from "@/lib/domain/program";
import { createClient } from "@/lib/supabase/server";

/**
 * Fecha de inicio del programa. Con `userId`, usa la fecha propia de esa
 * persona si la tiene (usuario de demostración); si no, la general.
 */
export async function getStartDate(userId?: string): Promise<ISODate> {
  const supabase = await createClient();
  const [{ data: settings }, own] = await Promise.all([
    supabase.from("settings").select("start_date").eq("id", 1).maybeSingle(),
    userId
      ? supabase.from("profiles").select("program_start").eq("id", userId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  return (
    (own.data?.program_start as ISODate | null | undefined) ??
    (settings?.start_date as ISODate | undefined) ??
    DEFAULT_START_DATE
  );
}
