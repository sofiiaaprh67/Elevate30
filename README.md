# ELEVATE 30 — Web app

App del programa ELEVATE 30 (PWA). Next.js 16 (App Router) + TypeScript + Supabase.

## Puesta en marcha en local

```bash
npm install
cp .env.example .env.local   # y rellena los valores (ver abajo)
npm run dev                   # http://localhost:3000
```

Comprobaciones:

```bash
npm test          # reglas del programa + esquema SQL (Postgres embebido)
npm run typecheck
npm run lint
```

> Usa Node 22 o superior. Con Node 20 funciona, pero Supabase avisa de que dejará de ser compatible.

## Estructura

| Carpeta | Qué hay |
| --- | --- |
| `app/` | Pantallas (`entrar`, `cuestionario`, `(app)/hoy`, `(app)/progreso`, `(app)/perfil`, `privacidad`) y rutas de auth |
| `components/ui/` | Componentes base con el sistema visual de la landing (píldoras, tarjetas, campos) |
| `content/` | Textos editables: lecciones (idea, pasos, ciencia y acción), revisiones semanales, catálogo de hábitos con consejos, cuestionario, frases "PARA TI" |
| `lib/domain/` | Reglas del programa en TypeScript puro, sin React ni Supabase (reutilizable en la app nativa) |
| `lib/supabase/` | Clientes de Supabase para servidor, navegador y proxy |
| `supabase/` | Esquema SQL, alta del admin y plantilla del email |
| `tests/` | Tests con Vitest |
| `app/dev/` | Vistas previas con datos de ejemplo (`/dev/cuestionario`, `/dev/plan`); solo existen con `npm run dev` |

Los colores, tipografías y radios están en `app/globals.css` como variables, copiados de la landing.

## Contenido del programa

- Cada lección (`content/lessons.ts`) tiene la idea principal, un desarrollo corto, 2–4 pasos para aplicarla hoy, la evidencia que la respalda con su fuente y una acción.
- Las lecciones con formulario (días 1, 3, 6, 16, 20, 22, 24 y 25) guardan sus respuestas en `entries` con `kind = 'lesson'`. Junto con la carta del día 29 y la elección del día 30 forman la pestaña **Sistema** (`lib/domain/system.ts`).
- Las revisiones semanales (`content/reviews.ts`) muestran los check-ins de la semana, tienen preguntas propias de cada semana y una decisión por hábito (mantener, bajar o subir).
- Las lecciones ya desbloqueadas se pueden reabrir en `/lecciones`.
- Si cambias los textos de `content/habits.ts`, los planes ya guardados no se actualizan solos: genera el SQL con `npx tsx scripts/refresh-habits.ts filas.json` (instrucciones dentro del script).

## Configurar Supabase (una vez)

> **Estado actual:** el proyecto `elevate-30` (ref `xzmwaspvljwxhsdexkgr`, Irlanda) ya existe, con las migraciones `0001` y `0002` aplicadas y la cuenta de admin dada de alta. Faltan los pasos 4, 5 y 6 (se hacen en el panel de Supabase).
>
> Las migraciones nuevas van numeradas en `supabase/migrations/` y se aplican en orden.

1. **Crea el proyecto.** En [supabase.com](https://supabase.com) → *New project*. Nombre: `elevate-30`. Región: *West EU (Ireland)* o *Central EU (Frankfurt)*. Guarda la contraseña de la base de datos en tu gestor de contraseñas (no la necesita la app).
2. **Crea las tablas.** *SQL Editor* → *New query* → pega cada archivo de `supabase/migrations/` en orden → *Run*.
3. **Date de alta como admin.** Abre `supabase/admin.sql`, cambia `tu-email@ejemplo.com` por tu email (en minúsculas) y ejecútalo en el *SQL Editor*.
4. **Inicio de sesión por email.** *Authentication* → *Sign In / Providers* → *Email*:
   - *Enable Email provider*: activado.
   - *Email OTP Length*: **6**. *Email OTP Expiration*: **3600** segundos.
   - *Allow new users to sign up*: activado (la base de datos solo deja entrar a la lista).
5. **Direcciones.** *Authentication* → *URL Configuration*:
   - *Site URL*: `http://localhost:3000` (cuando despleguemos, la cambiaremos por tu dominio).
   - *Redirect URLs*: añade `http://localhost:3000/**`.
6. **Plantilla del email.** *Authentication* → *Emails* → *Templates*. En **Magic link** y en **Confirm signup**:
   - Asunto: `Tu código para entrar en ELEVATE 30`
   - Cuerpo: el contenido de `supabase/email-template.html`.
7. **Claves para la app.** *Project Settings* → *API Keys* (o el botón *Connect*): copia la **Project URL** y la **Publishable key** (`sb_publishable_…`) en `.env.local`. La *Secret key* no se usa en la app y nunca debe ir al repositorio.

### Envío de emails (antes del piloto)

El servidor de correo incluido en Supabase solo envía unos pocos emails por hora: vale para probar, no para 20 personas. Antes del piloto configura un SMTP propio en *Authentication* → *Emails* → *SMTP Settings* (por ejemplo, Resend con tu dominio verificado).

## Cómo funciona el acceso

- Solo pueden entrar los emails de `allowed_emails`. La app lo comprueba antes de enviar el email, y la base de datos rechaza cualquier registro que no esté en la lista.
- Con la plantilla por defecto de Supabase, el enlace lleva a `/auth/enlace` y funciona aunque se abra en otro navegador o dispositivo. Con la plantilla propia (`supabase/email-template.html`, requiere SMTP propio) el enlace va a `/auth/confirm`.
- El email lleva un **código de 6 cifras** y un **enlace**. El código es necesario en iPhone cuando la app está en la pantalla de inicio, porque el enlace abre Safari, que no comparte sesión con la app.
- La casilla de consentimiento es obligatoria; se guarda la fecha y la versión del texto en `profiles`.
- Si quitas un email de la lista, esa persona pierde el acceso en su siguiente visita.

## PWA

- `app/manifest.ts` genera `/manifest.webmanifest` (nombre, colores e iconos).
- Iconos en `public/icons/`, generados desde el isotipo con `npm run icons`. Con un isotipo de 1024 px o en SVG: `node scripts/make-icons.mjs ruta/al/isotipo.png`.
- `public/sw.js`: service worker básico. Guarda JS, CSS e iconos para abrir rápido; las páginas siempre van a la red (tienen datos personales) y sin conexión se muestra `public/offline.html`. Solo se registra en producción. Si lo cambias, sube `VERSION`.

## Despliegue en Vercel

1. **Sube el proyecto a GitHub** (repositorio privado) o usa la CLI: `npx vercel` desde esta carpeta.
2. En [vercel.com](https://vercel.com) → *Add New* → *Project* → importa el repositorio. *Root Directory*: `elevate-30` si el repositorio incluye la carpeta de la landing.
3. **Variables de entorno** (*Settings* → *Environment Variables*), las mismas que `.env.example`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` = la dirección final, por ejemplo `https://app.tudominio.com`
   - `NEXT_PUBLIC_WAITLIST_URL`
4. **Dominio:** *Settings* → *Domains* → añade `app.tudominio.com` y crea en tu proveedor de dominio el registro CNAME que indique Vercel.
5. **Supabase** → *Authentication* → *URL Configuration*: cambia la *Site URL* a la dirección final y añade `https://app.tudominio.com/**` a *Redirect URLs*.
6. Abre la app en el móvil y añádela a la pantalla de inicio para comprobar el icono y el modo app.

## Usuario de demostración (día 9)

Para enseñar la app con datos, sin cambiar la fecha de nadie más:

1. Añade a `.env.local` la clave secreta de Supabase (*Project Settings* → *API Keys* → *Secret keys*):
   `SUPABASE_SECRET_KEY=sb_secret_…` — solo en tu ordenador; nunca en Vercel ni en el repositorio.
2. Ejecuta:
   ```bash
   npm run seed:demo
   ```
   Opciones: `npm run seed:demo -- --email demo@ejemplo.com --dia 9 --site https://elevate30.vercel.app` (con `--site` el enlace lleva a la app publicada).
3. El script crea o reinicia a **Lucía** (`demo@ejemplo.com`): plan generado con las reglas, 8 días de check-ins (con los avisos de «3 días sin cumplir» y «5 días en completo»), lecciones hechas, la revisión del día 7 y un vídeo aprobado. Tiene su propia fecha de inicio (`profiles.program_start`), así que hoy está en el día 9.
4. Al terminar muestra un **enlace para entrar** como Lucía (un solo uso, caduca en 1 hora). No envía emails.

Vuelve a ejecutarlo antes de cada demo para dejarla otra vez en el día 9. Lucía aparece en el panel de admin con la nota «Demo»; puedes quitarla de la lista cuando ya no la necesites.
