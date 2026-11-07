-- =====================================================================
-- ELEVATE 30 v2 — Comunidad dentro de la app
-- Una red pequeña y privada: solo personas con acceso (has_access) la ven.
-- Celebra la constancia y las vueltas: sin rankings ni seguidores.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Perfil en la comunidad
-- visibility: 'all' = todo el progreso, 'ring' = solo el anillo, 'none' = nada
-- Las respuestas del cuestionario nunca se muestran.
-- ---------------------------------------------------------------------
create table public.community_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  alias text not null check (char_length(trim(alias)) between 1 and 40),
  avatar_path text check (char_length(avatar_path) <= 200),
  visibility text not null default 'all' check (visibility in ('all', 'ring', 'none')),
  milestones_enabled boolean not null default true,
  norms_accepted_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger community_profiles_updated_at before update on public.community_profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Silenciar y bloquear
-- ---------------------------------------------------------------------
create table public.community_mutes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  muted_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, muted_id),
  check (user_id <> muted_id)
);
create table public.community_blocks (
  user_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, blocked_id),
  check (user_id <> blocked_id)
);

-- ¿Hay un bloqueo entre la persona actual y `p_other`, en cualquier sentido?
create or replace function public.blocked_with(p_other uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.community_blocks
    where (user_id = (select auth.uid()) and blocked_id = p_other)
       or (user_id = p_other and blocked_id = (select auth.uid()))
  );
$$;

-- ---------------------------------------------------------------------
-- Publicaciones, comentarios y reacciones
-- kind: 'post' (texto, foto o enlace a vídeo) o 'milestone' (hito automático)
-- ---------------------------------------------------------------------
create table public.posts (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null default 'post' check (kind in ('post', 'milestone')),
  body text check (char_length(body) <= 1000),
  image_path text check (char_length(image_path) <= 200),
  link_url text check (link_url ~* '^https?://' and char_length(link_url) <= 500),
  milestone_key text check (char_length(milestone_key) <= 60),
  hidden_at timestamptz,
  created_at timestamptz not null default now(),
  check (coalesce(trim(body), '') <> '' or image_path is not null or link_url is not null),
  check ((kind = 'milestone') = (milestone_key is not null))
);
create unique index posts_milestone_once on public.posts (user_id, milestone_key) where milestone_key is not null;
create index posts_created on public.posts (created_at desc);

create table public.comments (
  id bigint generated always as identity primary key,
  post_id bigint not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 500),
  hidden_at timestamptz,
  created_at timestamptz not null default now()
);
create index comments_post on public.comments (post_id, created_at);

-- Reacciones de ánimo en vez de "me gusta"
create table public.reactions (
  post_id bigint not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('vamos', 'bien', 'cuenta')),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id, kind)
);

-- ---------------------------------------------------------------------
-- Denuncias: el equipo las revisa en 48 horas como máximo y explica lo que decide
-- ---------------------------------------------------------------------
create table public.reports (
  id bigint generated always as identity primary key,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  post_id bigint references public.posts (id) on delete set null,
  comment_id bigint references public.comments (id) on delete set null,
  reason text not null check (reason in ('acoso', 'cuerpo', 'salud', 'spam', 'otro')),
  details text check (char_length(details) <= 500),
  status text not null default 'pending' check (status in ('pending', 'hidden', 'dismissed')),
  resolution text check (char_length(resolution) <= 500),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Permisos
-- ---------------------------------------------------------------------
alter table public.community_profiles enable row level security;
alter table public.community_mutes enable row level security;
alter table public.community_blocks enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.reactions enable row level security;
alter table public.reports enable row level security;

revoke all on public.community_profiles, public.community_mutes, public.community_blocks,
  public.posts, public.comments, public.reactions, public.reports from anon, authenticated;
grant select, insert, update on public.community_profiles to authenticated;
grant select, insert, delete on public.community_mutes, public.community_blocks to authenticated;
grant select, insert, delete on public.posts, public.comments to authenticated;
grant update (hidden_at) on public.posts, public.comments to authenticated;
grant select, insert, delete on public.reactions to authenticated;
grant select, insert on public.reports to authenticated;
grant update (status, resolution, resolved_at) on public.reports to authenticated;

-- Perfiles: los ve la cohorte (salvo bloqueo); cada uno edita el suyo
create policy "cprofiles: leer" on public.community_profiles for select to authenticated
  using ((select public.has_access()) and not public.blocked_with(user_id));
create policy "cprofiles: crear" on public.community_profiles for insert to authenticated
  with check (user_id = (select auth.uid()) and (select public.has_access()));
create policy "cprofiles: editar" on public.community_profiles for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Silenciar y bloquear: cada uno los suyos
create policy "mutes: propios" on public.community_mutes for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "blocks: propios" on public.community_blocks for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Publicaciones: visibles para la cohorte si no están ocultas, bloqueadas ni silenciadas
create policy "posts: leer" on public.posts for select to authenticated
  using (
    (select public.has_access())
    and (
      (select public.is_admin())
      or user_id = (select auth.uid())
      or (
        hidden_at is null
        and not public.blocked_with(user_id)
        and not exists (
          select 1 from public.community_mutes m
          where m.user_id = (select auth.uid()) and m.muted_id = posts.user_id
        )
      )
    )
  );
create policy "posts: publicar" on public.posts for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and hidden_at is null
    and (select public.has_access())
    and exists (select 1 from public.community_profiles c where c.user_id = (select auth.uid()))
  );
create policy "posts: borrar la propia" on public.posts for delete to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "posts: moderar" on public.posts for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Comentarios: se ven si se ve la publicación
create policy "comments: leer" on public.comments for select to authenticated
  using (
    (select public.has_access())
    and exists (select 1 from public.posts p where p.id = comments.post_id)
    and (
      (select public.is_admin())
      or user_id = (select auth.uid())
      or (hidden_at is null and not public.blocked_with(user_id))
    )
  );
create policy "comments: comentar" on public.comments for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and hidden_at is null
    and exists (select 1 from public.posts p where p.id = comments.post_id)
    and exists (select 1 from public.community_profiles c where c.user_id = (select auth.uid()))
  );
create policy "comments: borrar el propio" on public.comments for delete to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "comments: moderar" on public.comments for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Reacciones
create policy "reactions: leer" on public.reactions for select to authenticated
  using (exists (select 1 from public.posts p where p.id = reactions.post_id));
create policy "reactions: reaccionar" on public.reactions for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.posts p where p.id = reactions.post_id)
  );
create policy "reactions: quitar" on public.reactions for delete to authenticated
  using (user_id = (select auth.uid()));

-- Denuncias: quien denuncia ve las suyas (y la decisión); el admin, todas
create policy "reports: leer" on public.reports for select to authenticated
  using (reporter_id = (select auth.uid()) or (select public.is_admin()));
create policy "reports: denunciar" on public.reports for insert to authenticated
  with check (
    reporter_id = (select auth.uid())
    and status = 'pending'
    and resolution is null
    and resolved_at is null
    and (post_id is not null) <> (comment_id is not null)
  );
create policy "reports: resolver" on public.reports for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- Lo que la cohorte puede ver de cada persona (sin exponer tablas privadas)
-- ---------------------------------------------------------------------

-- Miembros: alias, foto, fecha de inicio y visibilidad
create or replace function public.community_members()
returns table (user_id uuid, alias text, avatar_path text, program_start date, visibility text)
language sql
stable
security definer
set search_path = ''
as $$
  select c.user_id, c.alias, c.avatar_path,
         case when c.visibility = 'none' then null else p.program_start end,
         c.visibility
    from public.community_profiles c
    join public.profiles p on p.id = c.user_id
   where public.has_access()
     and not public.blocked_with(c.user_id);
$$;

-- Progreso de una persona: mejor nivel de cada día (solo si lo comparte)
create or replace function public.community_progress(p_user uuid)
returns table (date date, level text)
language sql
stable
security definer
set search_path = ''
as $$
  select ch.date,
         (array['min', 'half', 'full'])[max(case ch.level when 'full' then 3 when 'half' then 2 when 'min' then 1 end)]
    from public.checkins ch
    join public.community_profiles c on c.user_id = ch.user_id
   where ch.user_id = p_user
     and ch.level <> 'skip'
     and c.visibility in ('all', 'ring')
     and public.has_access()
     and not public.blocked_with(p_user)
   group by ch.date;
$$;

revoke all on function public.blocked_with(uuid) from public, anon;
revoke all on function public.community_members() from public, anon;
revoke all on function public.community_progress(uuid) from public, anon;
grant execute on function public.blocked_with(uuid) to authenticated;
grant execute on function public.community_members() to authenticated;
grant execute on function public.community_progress(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- Fotos: bucket privado "community". Cada persona sube a su carpeta (<uid>/...)
-- y la cohorte las lee. (Solo existe en Supabase, no en los tests locales.)
-- ---------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage')
     and exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
                 where n.nspname = 'storage' and c.relname = 'buckets') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('community', 'community', false, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
    on conflict (id) do nothing;

    execute $p$
      create policy "community: leer" on storage.objects for select to authenticated
      using (bucket_id = 'community' and (select public.has_access()))
    $p$;
    execute $p$
      create policy "community: subir a tu carpeta" on storage.objects for insert to authenticated
      with check (
        bucket_id = 'community'
        and (select public.has_access())
        and (storage.foldername(name))[1] = (select auth.uid())::text
      )
    $p$;
    execute $p$
      create policy "community: borrar lo tuyo" on storage.objects for delete to authenticated
      using (
        bucket_id = 'community'
        and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin()))
      )
    $p$;
  end if;
end;
$$;
