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

export type StartWindow = { from: ISODate; to: ISODate; recommended: ISODate };

/** Ventana en la que cada persona puede elegir su día 1, y la fecha recomendada. */
export async function getStartWindow(): Promise<StartWindow> {
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("start_from, start_to, start_date").eq("id", 1).maybeSingle();
  return {
    from: (data?.start_from as ISODate | undefined) ?? "2027-01-01",
    to: (data?.start_to as ISODate | undefined) ?? "2027-01-18",
    recommended: (data?.start_date as ISODate | undefined) ?? DEFAULT_START_DATE,
  };
}
