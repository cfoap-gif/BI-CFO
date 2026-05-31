-- =============================================================================
-- 0006_military_staff.sql — Militares, instrutores, monitores, coordenação
-- =============================================================================

create table if not exists public.military_staff (
  id                  uuid        primary key default gen_random_uuid(),
  rank                text,                            -- posto/graduação (ex.: "Cap", "1º Ten")
  full_name           text        not null,
  war_name            text,
  registration_number text,                            -- matrícula institucional
  staff_type          text        not null default 'outro',
  phone               text,
  active              boolean     not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint military_staff_type_chk check (
    staff_type in ('coordenação', 'instrutor', 'monitor', 'apoio', 'comandante', 'outro')
  )
);

comment on table public.military_staff is
  'Militares vinculados ao CFO. Tipos: coordenação | instrutor | monitor | apoio | comandante | outro.';

alter table public.military_staff enable row level security;

drop policy if exists "military_staff_read" on public.military_staff;
create policy "military_staff_read"
  on public.military_staff for select
  to authenticated
  using (true);

drop policy if exists "military_staff_insert" on public.military_staff;
create policy "military_staff_insert"
  on public.military_staff for insert
  to authenticated
  with check (public.user_profile_name() in ('Administrador', 'Coordenação'));

drop policy if exists "military_staff_update" on public.military_staff;
create policy "military_staff_update"
  on public.military_staff for update
  to authenticated
  using      (public.user_profile_name() in ('Administrador', 'Coordenação'))
  with check (public.user_profile_name() in ('Administrador', 'Coordenação'));

drop trigger if exists set_updated_at_military_staff on public.military_staff;
create trigger set_updated_at_military_staff
  before update on public.military_staff
  for each row execute function public.tg_set_updated_at();
