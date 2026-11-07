import "server-only";
import { DEFAULT_START_DATE, type ISODate } from "@/lib/domain/program";
import { createClient } from "@/lib/supabase/server";

export async function getStartDate(): Promise<ISODate> {
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("start_date").eq("id", 1).maybeSingle();
  return (data?.start_date as ISODate | undefined) ?? DEFAULT_START_DATE;
}
