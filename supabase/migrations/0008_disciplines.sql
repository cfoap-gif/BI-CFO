-- =============================================================================
-- 0008_disciplines.sql — Disciplinas do CFO
-- =============================================================================
-- Depende: 0006_military_staff.sql (FK opcional main_instructor_id).
-- =============================================================================

create table if not exists public.disciplines (
  id                  uuid        primary key default gen_random_uuid(),
  name                text        not null,
  cfo_year            integer,
  workload_hours      integer     not null default 0,
  discipline_type     text        not null default 'teórica',
  main_instructor_id  uuid                  references public.military_staff(id) on delete set null,
  active              boolean     not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint disciplines_type_chk check (
    discipline_type in ('teórica', 'prática', 'mista', 'estágio', 'atividade complementar')
  ),
  constraint disciplines_workload_chk check (workload_hours >= 0),
  constraint disciplines_name_year_unique unique (name, cfo_year)
);

comment on table public.disciplines is
  'Disciplinas do CFO. Pode vincular um instrutor principal em military_staff.';

alter table public.disciplines enable row level security;

drop policy if exists "disciplines_read" on public.disciplines;
create policy "disciplines_read"
  on public.disciplines for select
  to authenticated
  using (true);

drop policy if exists "disciplines_insert" on public.disciplines;
create policy "disciplines_insert"
  on public.disciplines for insert
  to authenticated
  with check (public.user_profile_name() in ('Administrador', 'Coordenação'));

drop policy if exists "disciplines_update" on public.disciplines;
create policy "disciplines_update"
  on public.disciplines for update
  to authenticated
  using      (public.user_profile_name() in ('Administrador', 'Coordenação'))
  with check (public.user_profile_name() in ('Administrador', 'Coordenação'));

drop trigger if exists set_updated_at_disciplines on public.disciplines;
create trigger set_updated_at_disciplines
  before update on public.disciplines
  for each row execute function public.tg_set_updated_at();
