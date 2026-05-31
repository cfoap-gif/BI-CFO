-- =============================================================================
-- 0001_init.sql — Estrutura mínima do M0 (fundação)
-- =============================================================================
-- Cria:
--   * public.profiles  — perfis de acesso (catálogo)
--   * public.users     — espelho institucional de auth.users (FK 1:1)
--   * Políticas RLS mínimas (leitura autenticada em profiles; leitura do
--     próprio registro em users). Bootstrap do administrador é feito via
--     migração 0003 executada com service_role, que ignora RLS.
--
-- Regras seguidas (ver Apoio/_decisoes.md):
--   DT-002: RLS habilitada desde o início, mas com políticas mínimas que
--           garantem que o primeiro administrador consiga ler o próprio perfil.
--   DT-003: nenhuma tabela de negócio (records, daily_books, bulletins, etc.)
--           neste momento — invariante arquitetural preservada para M3+.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Extensões necessárias
-- -----------------------------------------------------------------------------
create extension if not exists "pgcrypto";  -- gen_random_uuid()

-- -----------------------------------------------------------------------------
-- public.profiles
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null unique,
  description text        not null default '',
  active      boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is
  'Catálogo de perfis de acesso (Administrador, Coordenação, etc.). Seed em 0002.';

alter table public.profiles enable row level security;

-- Qualquer usuário autenticado pode listar os perfis (necessário para
-- exibir o nome do perfil no /dashboard).
drop policy if exists "profiles_read_authenticated" on public.profiles;
create policy "profiles_read_authenticated"
  on public.profiles
  for select
  to authenticated
  using (true);

-- -----------------------------------------------------------------------------
-- public.users
-- -----------------------------------------------------------------------------
create table if not exists public.users (
  id            uuid        primary key references auth.users(id) on delete cascade,
  login         text        not null unique,
  full_name     text        not null,
  war_name      text,
  profile_id    uuid        not null references public.profiles(id),
  active        boolean     not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.users is
  'Espelho institucional de auth.users. Armazena login, nome de guerra e perfil.';

alter table public.users enable row level security;

-- O usuário autenticado pode ler APENAS o próprio registro.
-- Políticas mais amplas (Administrador lê todos, Coordenação lê seu pelotão, etc.)
-- serão adicionadas a partir do M1.
drop policy if exists "users_read_self" on public.users;
create policy "users_read_self"
  on public.users
  for select
  to authenticated
  using (id = auth.uid());

-- INSERT/UPDATE/DELETE: nenhuma política → bloqueado para todos os perfis
-- comuns. Seed do admin é feito via service_role na migração 0003 (ignora RLS).

-- -----------------------------------------------------------------------------
-- Trigger para manter updated_at
-- -----------------------------------------------------------------------------
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists set_updated_at_profiles on public.profiles;
create trigger set_updated_at_profiles
  before update on public.profiles
  for each row execute function public.tg_set_updated_at();

drop trigger if exists set_updated_at_users on public.users;
create trigger set_updated_at_users
  before update on public.users
  for each row execute function public.tg_set_updated_at();
