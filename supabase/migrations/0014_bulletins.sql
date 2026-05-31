-- =============================================================================
-- 0014_bulletins.sql — Boletins Internos (M5, Épico 5)
-- =============================================================================
-- DT-003/DT-006: o PDF (M6) e a prévia leem APENAS bulletin_items. Os itens são
-- copiados de records.publication_text na montagem da prévia (BI rascunho) e
-- tornam-se imutáveis na aprovação. Campos sensíveis NUNCA são copiados.
-- Reabertura simples (sem versionamento real no MVP); `version` reservado.
-- =============================================================================

create table if not exists public.bulletins (
  id               uuid        primary key default gen_random_uuid(),
  number           integer     not null,
  year             integer     not null,
  publication_date date,
  start_date       date        not null,
  end_date         date        not null,
  type             text        not null,
  status           text        not null default 'rascunho',
  version          integer     not null default 1,
  created_by       uuid                  references auth.users(id),
  approved_by      uuid                  references auth.users(id),
  approved_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint bulletins_number_year_uq unique (number, year),
  constraint bulletins_type_chk check (type in ('diário', 'período')),
  constraint bulletins_status_chk check (status in ('rascunho', 'aprovado', 'cancelado')),
  constraint bulletins_dates_chk check (end_date >= start_date)
);

comment on table public.bulletins is
  'Boletins Internos (M5). Número único por ano. PDF/prévia leem só bulletin_items.';

create table if not exists public.bulletin_items (
  id             uuid        primary key default gen_random_uuid(),
  bulletin_id    uuid        not null references public.bulletins(id) on delete cascade,
  record_id      uuid                  references public.records(id) on delete set null,
  part_number    integer     not null,
  reference_date date,
  title          text        not null default '',
  content        text        not null default '',
  source_type    text,
  display_order  integer     not null default 0,
  visible        boolean     not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint bulletin_items_part_chk check (part_number between 1 and 5)
);

comment on table public.bulletin_items is
  'Itens do BI (working set da prévia). content = CÓPIA de records.publication_text. Imutável após aprovação (regra na app).';

create table if not exists public.bulletin_events (
  id          uuid        primary key default gen_random_uuid(),
  bulletin_id uuid        not null references public.bulletins(id) on delete cascade,
  event_type  text        not null,
  note        text        not null default '',
  created_by  uuid        not null references auth.users(id),
  created_at  timestamptz not null default now(),

  constraint bulletin_events_type_chk check (
    event_type in ('criado', 'aprovado', 'reaberto', 'cancelado')
  )
);

comment on table public.bulletin_events is
  'Histórico imutável de transições de boletins (M5). Append-only.';

create index if not exists idx_bulletins_year on public.bulletins (year, number);
create index if not exists idx_bulletin_items_bulletin
  on public.bulletin_items (bulletin_id, part_number, display_order);
create index if not exists idx_bulletin_events_bulletin
  on public.bulletin_events (bulletin_id, created_at desc);

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
alter table public.bulletins enable row level security;
alter table public.bulletin_items enable row level security;
alter table public.bulletin_events enable row level security;

-- bulletins
drop policy if exists "bulletins_read" on public.bulletins;
create policy "bulletins_read"
  on public.bulletins for select to authenticated using (true);

drop policy if exists "bulletins_insert" on public.bulletins;
create policy "bulletins_insert"
  on public.bulletins for insert to authenticated
  with check (public.user_profile_name() in ('Administrador', 'Coordenação'));

drop policy if exists "bulletins_update" on public.bulletins;
create policy "bulletins_update"
  on public.bulletins for update to authenticated
  using (public.user_profile_name() in ('Administrador', 'Coordenação'))
  with check (public.user_profile_name() in ('Administrador', 'Coordenação'));

-- bulletin_items
drop policy if exists "bulletin_items_read" on public.bulletin_items;
create policy "bulletin_items_read"
  on public.bulletin_items for select to authenticated using (true);

drop policy if exists "bulletin_items_insert" on public.bulletin_items;
create policy "bulletin_items_insert"
  on public.bulletin_items for insert to authenticated
  with check (public.user_profile_name() in ('Administrador', 'Coordenação'));

drop policy if exists "bulletin_items_update" on public.bulletin_items;
create policy "bulletin_items_update"
  on public.bulletin_items for update to authenticated
  using (public.user_profile_name() in ('Administrador', 'Coordenação'))
  with check (public.user_profile_name() in ('Administrador', 'Coordenação'));

drop policy if exists "bulletin_items_delete" on public.bulletin_items;
create policy "bulletin_items_delete"
  on public.bulletin_items for delete to authenticated
  using (public.user_profile_name() in ('Administrador', 'Coordenação'));

-- bulletin_events (append-only)
drop policy if exists "bulletin_events_read" on public.bulletin_events;
create policy "bulletin_events_read"
  on public.bulletin_events for select to authenticated using (true);

drop policy if exists "bulletin_events_insert" on public.bulletin_events;
create policy "bulletin_events_insert"
  on public.bulletin_events for insert to authenticated
  with check (
    created_by = auth.uid()
    and public.user_profile_name() in ('Administrador', 'Coordenação')
  );

-- ----------------------------------------------------------------------------
-- Triggers updated_at
-- ----------------------------------------------------------------------------
drop trigger if exists set_updated_at_bulletins on public.bulletins;
create trigger set_updated_at_bulletins
  before update on public.bulletins
  for each row execute function public.tg_set_updated_at();

drop trigger if exists set_updated_at_bulletin_items on public.bulletin_items;
create trigger set_updated_at_bulletin_items
  before update on public.bulletin_items
  for each row execute function public.tg_set_updated_at();
