/**
 * Prueba el esquema de Supabase (tablas, RLS y funciones) en un Postgres
 * embebido (PGlite) con una simulación mínima del esquema `auth`.
 */
import { PGlite } from "@electric-sql/pglite";
import { readdirSync, readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";

const A = "00000000-0000-0000-0000-00000000000a";
const B = "00000000-0000-0000-0000-00000000000b";
const ADMIN = "00000000-0000-0000-0000-0000000000ad";

let db: PGlite;

async function as<T = Record<string, unknown>>(uid: string | null, sql: string, params: unknown[] = []) {
  await db.exec(`set role ${uid ? "authenticated" : "anon"}`);
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [uid ?? ""]);
  try {
    return (await db.query<T>(sql, params)).rows;
  } finally {
    await db.exec("reset role");
  }
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon nologin; create role authenticated nologin;
    create schema auth; create schema extensions;
    grant usage on schema public to anon, authenticated;
    grant usage on schema auth to anon, authenticated;
    create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    alter default privileges in schema public grant all on tables to anon, authenticated;
    alter default privileges in schema public grant all on functions to anon, authenticated;
  `);
  for (const file of readdirSync("supabase/migrations").filter((f) => f.endsWith(".sql")).sort()) {
    await db.exec(readFileSync(`supabase/migrations/${file}`, "utf8"));
  }
  await db.exec(`
    insert into allowed_emails (email) values ('ana@test.com'), ('bea@test.com');
    insert into allowed_emails (email, role) values ('boss@test.com', 'admin');
  `);
  await db.query(
    `insert into auth.users (id, email, raw_user_meta_data) values ($1, 'Ana@Test.com', '{"consent": true, "consent_version": "v1"}')`,
    [A],
  );
  await db.query(`insert into auth.users (id, email) values ($1, 'bea@test.com')`, [B]);
  await db.query(`insert into auth.users (id, email) values ($1, 'boss@test.com')`, [ADMIN]);
}, 60_000);

describe("lista de participantes y perfiles", () => {
  it("solo guarda emails en minúsculas", async () => {
    await expect(db.exec(`insert into allowed_emails (email) values ('Mayus@Test.com')`)).rejects.toThrow();
  });

  it("crea el perfil con el rol de la lista y el consentimiento", async () => {
    const { rows } = await db.query<{ email: string; role: string; consent_version: string | null }>(
      `select email, role, consent_version from profiles order by email`,
    );
    expect(rows).toEqual([
      { email: "ana@test.com", role: "participant", consent_version: "v1" },
      { email: "bea@test.com", role: "participant", consent_version: null },
      { email: "boss@test.com", role: "admin", consent_version: null },
    ]);
  });

  it("impide registrarse con un email fuera de la lista", async () => {
    await expect(
      db.query(`insert into auth.users (id, email) values (gen_random_uuid(), 'intruso@test.com')`),
    ).rejects.toThrow(/email_not_allowed/);
  });

  it("can_sign_in no distingue mayúsculas ni espacios", async () => {
    expect((await as<{ v: boolean }>(null, `select public.can_sign_in(' ANA@test.com ') as v`))[0].v).toBe(true);
    expect((await as<{ v: boolean }>(null, `select public.can_sign_in('x@test.com') as v`))[0].v).toBe(false);
  });

  it("record_consent guarda la versión aceptada", async () => {
    await as(B, `select public.record_consent('v2')`);
    const { rows } = await db.query<{ consent_version: string }>(`select consent_version from profiles where id = $1`, [B]);
    expect(rows[0].consent_version).toBe("v2");
  });

  it("nadie puede darse el rol de admin", async () => {
    await expect(as(B, `update profiles set role = 'admin' where id = $1`, [B])).rejects.toThrow();
  });
});

describe("row level security", () => {
  it("anon no puede llamar a las funciones privadas", async () => {
    await expect(as(null, `select public.is_admin()`)).rejects.toThrow();
    await expect(as(null, `select public.record_consent('x')`)).rejects.toThrow();
  });

  it("los triggers de updated_at funcionan para usuarios normales", async () => {
    await as(B, `insert into intake (user_id, name) values ($1, 'Bea')`, [B]);
    await as(B, `update intake set name = 'Beatriz' where user_id = $1`, [B]);
    expect((await as<{ name: string }>(B, `select name from intake`))[0].name).toBe("Beatriz");
  });

  it("anon no lee ninguna tabla", async () => {
    await expect(as(null, `select * from profiles`)).rejects.toThrow();
  });

  it("cada persona ve y escribe solo sus check-ins; el admin los lee todos", async () => {
    await as(A, `insert into checkins (user_id, date, slot, level) values ($1, '2027-01-04', 'body', 'full')`, [A]);
    await as(B, `insert into checkins (user_id, date, slot, level) values ($1, '2027-01-04', 'body', 'min')`, [B]);
    expect(await as(A, `select * from checkins`)).toHaveLength(1);
    await expect(
      as(A, `insert into checkins (user_id, date, slot, level) values ($1, '2027-01-05', 'body', 'full')`, [B]),
    ).rejects.toThrow();
    expect(await as(ADMIN, `select * from checkins`)).toHaveLength(2);
  });

  it("solo el admin cambia la fecha de inicio y ve la lista", async () => {
    await as(A, `update settings set start_date = '2027-01-04'`);
    expect((await db.query<{ d: string }>(`select start_date::text as d from settings`)).rows[0].d).toBe("2027-01-11");
    await as(ADMIN, `update settings set start_date = '2027-01-04'`);
    expect((await db.query<{ d: string }>(`select start_date::text as d from settings`)).rows[0].d).toBe("2027-01-04");
    // La fecha recomendada tiene que caer dentro de la ventana de inicio
    await expect(as(ADMIN, `update settings set start_date = '2027-02-01'`)).rejects.toThrow();
    expect(await as(A, `select * from allowed_emails`)).toHaveLength(0);
    expect(await as(ADMIN, `select * from allowed_emails`)).toHaveLength(3);
  });

  it("los vídeos se envían pendientes y solo el admin los aprueba", async () => {
    await expect(
      as(A, `insert into video_submissions (user_id, week, url, status) values ($1, 1, 'https://x.com/v', 'approved')`, [A]),
    ).rejects.toThrow();
    await as(A, `insert into video_submissions (user_id, week, url) values ($1, 1, 'https://x.com/v')`, [A]);
    await expect(as(A, `update video_submissions set status = 'approved' where user_id = $1`, [A])).rejects.toThrow();
    await as(ADMIN, `update video_submissions set status = 'approved', reviewed_at = now()`);
    expect((await db.query<{ status: string }>(`select status from video_submissions`)).rows[0].status).toBe("approved");
  });

  it("Día 0: cada persona elige su fecha dentro de la ventana y edita solo su ancla y su compromiso", async () => {
    await as(B, `select public.set_program_start('2027-01-11')`);
    expect((await db.query<{ d: string }>(`select program_start::text as d from profiles where id = $1`, [B])).rows[0].d).toBe(
      "2027-01-11",
    );
    await expect(as(B, `select public.set_program_start('2027-02-01')`)).rejects.toThrow();
    await expect(as(null, `select public.set_program_start('2027-01-11')`)).rejects.toThrow();
    // No puede cambiarse la fecha directamente (sin pasar por la función)
    await expect(as(B, `update profiles set program_start = '2027-01-02' where id = $1`, [B])).rejects.toThrow();

    await as(B, `update profiles set anchor_slot = 'goal', committed_at = now() where id = $1`, [B]);
    // Actualizar el perfil de otra persona no cambia nada
    await as(B, `update profiles set anchor_slot = 'mind' where id = $1`, [A]);
    const rows = (await db.query<{ id: string; anchor_slot: string | null }>(`select id, anchor_slot from profiles`)).rows;
    expect(rows.find((r) => r.id === B)?.anchor_slot).toBe("goal");
    expect(rows.find((r) => r.id === A)?.anchor_slot).toBeNull();
    await expect(as(B, `update profiles set anchor_slot = 'nada' where id = $1`, [B])).rejects.toThrow();
  });

  it("comunidad: hace falta perfil para publicar y la cohorte ve las publicaciones", async () => {
    await expect(as(A, `insert into posts (user_id, body) values ($1, 'Hola')`, [A])).rejects.toThrow();
    await as(A, `insert into community_profiles (user_id, alias, norms_accepted_at) values ($1, 'Ana', now())`, [A]);
    await as(B, `insert into community_profiles (user_id, alias, visibility, norms_accepted_at) values ($1, 'Bea', 'none', now())`, [B]);
    await as(A, `insert into posts (user_id, body) values ($1, 'Día 1 hecho')`, [A]);
    await as(B, `insert into posts (user_id, body) values ($1, 'Vuelvo tras un día en blanco')`, [B]);
    expect(await as(A, `select * from posts`)).toHaveLength(2);
    // Nadie publica en nombre de otra persona
    await expect(as(A, `insert into posts (user_id, body) values ($1, 'falso')`, [B])).rejects.toThrow();
    // Sin texto, foto ni enlace no hay publicación
    await expect(as(A, `insert into posts (user_id, body) values ($1, '  ')`, [A])).rejects.toThrow();
  });

  it("comunidad: reacciones de ánimo y comentarios", async () => {
    const [post] = await as<{ id: number }>(A, `select id from posts where body = 'Vuelvo tras un día en blanco'`);
    await as(A, `insert into reactions (post_id, user_id, kind) values ($1, $2, 'cuenta')`, [post.id, A]);
    // Reaccionar dos veces no falla (la app usa "insertar si no existe", sin permiso de editar)
    await as(A, `insert into reactions (post_id, user_id, kind) values ($1, $2, 'cuenta') on conflict do nothing`, [post.id, A]);
    await expect(
      as(A, `insert into reactions (post_id, user_id, kind) values ($1, $2, 'cuenta') on conflict (post_id, user_id, kind) do update set kind = 'cuenta'`, [post.id, A]),
    ).rejects.toThrow();
    await expect(as(A, `insert into reactions (post_id, user_id, kind) values ($1, $2, 'like')`, [post.id, A])).rejects.toThrow();
    await as(A, `insert into comments (post_id, user_id, body) values ($1, $2, '¡Bien!')`, [post.id, A]);
    expect(await as(B, `select * from comments`)).toHaveLength(1);
  });

  it("comunidad: la privacidad decide qué progreso se ve", async () => {
    await as(A, `insert into checkins (user_id, date, slot, level) values ($1, '2027-01-05', 'mind', 'min')`, [A]);
    const ana = await as<{ date: string; level: string }>(B, `select date::text, level from community_progress($1) order by date`, [A]);
    expect(ana).toEqual([
      { date: "2027-01-04", level: "full" },
      { date: "2027-01-05", level: "min" },
    ]);
    // Bea eligió "nada": ni su progreso ni su fecha de inicio
    expect(await as(A, `select * from community_progress($1)`, [B])).toHaveLength(0);
    const members = await as<{ alias: string; program_start: string | null }>(A, `select alias, program_start from community_members()`);
    expect(members.find((m) => m.alias === "Bea")?.program_start).toBeNull();
  });

  it("comunidad: silenciar oculta solo para quien silencia; bloquear, en los dos sentidos", async () => {
    await as(A, `insert into community_mutes (user_id, muted_id) values ($1, $2)`, [A, B]);
    expect(await as(A, `select * from posts where user_id = $1`, [B])).toHaveLength(0);
    await as(A, `delete from community_mutes where user_id = $1`, [A]);
    await as(A, `insert into community_blocks (user_id, blocked_id) values ($1, $2)`, [A, B]);
    expect(await as(A, `select * from posts where user_id = $1`, [B])).toHaveLength(0);
    expect(await as(B, `select * from posts where user_id = $1`, [A])).toHaveLength(0);
    expect(await as(B, `select * from community_members() where user_id = $1`, [A])).toHaveLength(0);
    expect(await as(B, `select * from community_progress($1)`, [A])).toHaveLength(0);
    await as(A, `delete from community_blocks where user_id = $1`, [A]);
  });

  it("comunidad: denuncias y moderación", async () => {
    const [post] = await as<{ id: number }>(B, `select id from posts where body = 'Día 1 hecho'`);
    await as(B, `insert into reports (reporter_id, post_id, reason) values ($1, $2, 'spam')`, [B, post.id]);
    await expect(
      as(B, `insert into reports (reporter_id, post_id, reason, status) values ($1, $2, 'spam', 'hidden')`, [B, post.id]),
    ).rejects.toThrow();
    expect(await as(A, `select * from reports`)).toHaveLength(0);
    // Solo el admin oculta
    await as(B, `update posts set hidden_at = now() where id = $1`, [post.id]);
    expect(await as(B, `select * from posts where id = $1`, [post.id])).toHaveLength(1);
    await as(ADMIN, `update posts set hidden_at = now() where id = $1`, [post.id]);
    await as(ADMIN, `update reports set status = 'hidden', resolution = 'Era spam', resolved_at = now()`);
    expect(await as(B, `select * from posts where id = $1`, [post.id])).toHaveLength(0);
    // Quien publicó sigue viendo su publicación oculta
    expect(await as(A, `select * from posts where id = $1`, [post.id])).toHaveLength(1);
    expect((await as<{ resolution: string }>(B, `select resolution from reports`))[0].resolution).toBe("Era spam");
  });

  it("has_access pasa a false al quitar el email de la lista", async () => {
    expect((await as<{ v: boolean }>(A, `select public.has_access() as v`))[0].v).toBe(true);
    await db.exec(`delete from allowed_emails where email = 'ana@test.com'`);
    expect((await as<{ v: boolean }>(A, `select public.has_access() as v`))[0].v).toBe(false);
    expect((await as<{ v: boolean }>(ADMIN, `select public.has_access() as v`))[0].v).toBe(true);
  });
});
