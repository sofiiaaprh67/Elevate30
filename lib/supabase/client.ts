import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

/** Cliente de Supabase para componentes de cliente (check-ins, autoguardado…). */
export function createClient() {
  return createBrowserClient(env.supabaseUrl, env.supabaseKey);
}
