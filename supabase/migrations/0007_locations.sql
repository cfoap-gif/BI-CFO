-- =============================================================================
-- 0007_locations.sql — Locais de instrução, serviço, missão e eventos
-- =============================================================================

create table if not exists public.locations (
  id            uuid        primary key default gen_random_uuid(),
  name          text        not null unique,
  description   text        not null default '',
  address       text,
  location_type text        not null default 'outro',
  active        boolean     not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint locations_type_chk check (
    location_type in (
      'sala de aula', 'pátio', 'campo de instrução',
      'unidade operacional', 'local externo', 'auditório', 'outro'
    )
  )
);

comment on table public.locations is
  'Locais usáveis em QTS, escalas, missões e instruções.';

alter table public.locations enable row level security;

drop policy if exists "locations_read" on public.locations;
create policy "locations_read"
  on public.locations for select
  to authenticated
  using (true);

drop policy if exists "locations_insert" on public.locations;
create policy "locations_insert"
  on public.locations for insert
  to authenticated
  with check (public.user_profile_name() in ('Administrador', 'Coordenação'));

drop policy if exists "locations_update" on public.locations;
create policy "locations_update"
  on public.locations for update
  to authenticated
  using      (public.user_profile_name() in ('Administrador', 'Coordenação'))
  with check (public.user_profile_name() in ('Administrador', 'Coordenação'));

drop trigger if exists set_updated_at_locations on public.locations;
create trigger set_updated_at_locations
  before update on public.locations
  for each row execute function public.tg_set_updated_at();
