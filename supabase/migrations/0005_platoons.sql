-- =============================================================================
-- 0005_platoons.sql — Cadastro de pelotões
-- =============================================================================

create table if not exists public.platoons (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null unique,
  description text        not null default '',
  cfo_year    integer,
  active      boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.platoons is 'Pelotões do CFO. Ex.: 1º Pelotão, 2º Pelotão, Turma única.';

alter table public.platoons enable row level security;

-- Leitura: qualquer usuário autenticado (decisão M1 §read-amplo).
drop policy if exists "platoons_read" on public.platoons;
create policy "platoons_read"
  on public.platoons for select
  to authenticated
  using (true);

-- Escrita: apenas Administrador ou Coordenação.
drop policy if exists "platoons_insert" on public.platoons;
create policy "platoons_insert"
  on public.platoons for insert
  to authenticated
  with check (public.user_profile_name() in ('Administrador', 'Coordenação'));

drop policy if exists "platoons_update" on public.platoons;
create policy "platoons_update"
  on public.platoons for update
  to authenticated
  using      (public.user_profile_name() in ('Administrador', 'Coordenação'))
  with check (public.user_profile_name() in ('Administrador', 'Coordenação'));

-- DELETE: nenhuma policy → bloqueado. Use active = false para inativar.

drop trigger if exists set_updated_at_platoons on public.platoons;
create trigger set_updated_at_platoons
  before update on public.platoons
  for each row execute function public.tg_set_updated_at();
