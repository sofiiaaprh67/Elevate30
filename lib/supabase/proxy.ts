import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env, isSupabaseConfigured } from "@/lib/env";

/** Rutas que se pueden ver sin sesión. */
// /api/recordatorios lo llama Supabase cada 10 minutos (se protege con su propio secreto)
const PUBLIC_PATHS = ["/entrar", "/auth", "/privacidad", "/api/recordatorios"];

function isPublic(pathname: string) {
  if (process.env.NODE_ENV === "development" && pathname.startsWith("/dev")) return true;
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Refresca la sesión en cada navegación y redirige a /entrar si no hay
 * sesión. Es una comprobación optimista: cada página vuelve a verificar
 * el usuario en el servidor.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!isSupabaseConfigured) {
    return isPublic(request.nextUrl.pathname)
      ? response
      : NextResponse.redirect(new URL("/entrar", request.url));
  }

  const supabase = createServerClient(env.supabaseUrl, env.supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // No pongas código entre createServerClient y getClaims().
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);

  if (!signedIn && !isPublic(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.search = "";
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }

  return response;
}
