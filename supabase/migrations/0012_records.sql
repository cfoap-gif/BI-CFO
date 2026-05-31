-- =============================================================================
-- 0012_records.sql — Tabela central de registros (DT-005)
-- =============================================================================
-- DT-005: MVP usa UMA tabela `records` para todos os fatos (falta, atraso,
-- instrução, missão, material, aviso, ocorrência, etc.). Tabelas
-- especializadas (absences, missions, ...) entram em fases futuras.
--
-- INVARIANTE DT-003: registros entram no BI APENAS via bulletin_items
-- congelados, e SOMENTE se:
--   status = 'validado' AND classification = 'publicável'
--   AND include_in_bulletin = true.
-- O PDF nunca lê esta tabela diretamente.
-- =============================================================================

create table if not exists public.records (
  id                    uuid        primary key default gen_random_uuid(),
  record_type           text        not null,
  source_type           text        not null default 'manual',
  source_id             uuid,                      -- FK lógica (daily_book_id, escala_id, etc.)
  daily_book_id         uuid                  references public.daily_books(id) on delete set null,
  reference_date        date        not null,
  student_id            uuid                  references public.students(id),
  platoon_id            uuid                  references public.platoons(id),
  discipline_id         uuid                  references public.disciplines(id),
  location_id           uuid                  references public.locations(id),
  responsible_staff_id  uuid                  references public.military_staff(id),
  title                 text        not null default '',
  original_description  text        not null,         -- texto original (preservado, jamais sobrescrito pela edição final)
  publication_text      text        not null default '', -- texto editado pela Coordenação para o BI
  classification        text,                          -- publicável | interno | restrito (Coord define)
  status                text        not null default 'rascunho',
  include_in_bulletin   boolean     not null default false,
  bulletin_part         integer,                       -- 1..5
  coordination_note     text        not null default '',
  created_by            uuid                  references auth.users(id),
  submitted_by          uuid                  references auth.users(id),
  reviewed_by           uuid                  references auth.users(id),
  validated_by          uuid                  references auth.users(id),
  validated_at          timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  constraint records_type_chk check (
    record_type in (
      'falta', 'atraso', 'baixa', 'dispensa', 'apresentação', 'reapresentação',
      'instrução ministrada', 'alteração de material', 'alteração de QTS',
      'missão interna', 'missão externa', 'ocorrência disciplinar',
      'elogio', 'recompensa', 'punição', 'aviso',
      'prescrição da Coordenação', 'outro'
    )
  ),
  constraint records_source_chk check (
    source_type in (
      'daily_book', 'duty_scale', 'qts_item',
      'health_record', 'instruction_record', 'mission',
      'material_change', 'disciplinary_record', 'notice', 'manual'
    )
  ),
  constraint records_classification_chk check (
    classification is null
    or classification in ('publicável', 'interno', 'restrito')
  ),
  constraint records_status_chk check (
    status in ('rascunho', 'enviado', 'em revisão', 'pendente de correção',
               'validado', 'incluído no BI', 'interno', 'restrito',
               'cancelado', 'arquivado')
  ),
  constraint records_bulletin_part_chk check (
    bulletin_part is null or bulletin_part between 1 and 5
  )
);

comment on table public.records is
  'Tabela central de registros (DT-005). Todo fato passa por aqui antes de virar bulletin_item.';

create index if not exists idx_records_daily_book on public.records (daily_book_id);
create index if not exists idx_records_reference_date on public.records (reference_date desc);
create index if not exists idx_records_status on public.records (status);
create index if not exists idx_records_type on public.records (record_type);
create index if not exists idx_records_student on public.records (student_id);

alter table public.records enable row level security;

drop policy if exists "records_read" on public.records;
create policy "records_read"
  on public.records for select
  to authenticated
  using (
    -- Registros restritos só para perfis admin-like; demais perfis veem
    -- somente registros não-restritos. (Hardening preliminar; M4/M8 refinam.)
    coalesce(classification, '') <> 'restrito'
    or public.user_profile_name() in ('Administrador', 'Coordenação')
  );

drop policy if exists "records_insert" on public.records;
create policy "records_insert"
  on public.records for insert
  to authenticated
  with check (
    public.user_profile_name() in (
      'Administrador',
      'Coordenação',
      'Aluno de Dia ao Corpo de Alunos',
      'Aluno de Dia ao Pelotão',
      'Instrutor'
    )
  );

drop policy if exists "records_update" on public.records;
create policy "records_update"
  on public.records for update
  to authenticated
  using (
    public.user_profile_name() in (
      'Administrador',
      'Coordenação',
      'Aluno de Dia ao Corpo de Alunos',
      'Aluno de Dia ao Pelotão',
      'Instrutor'
    )
  )
  with check (
    public.user_profile_name() in (
      'Administrador',
      'Coordenação',
      'Aluno de Dia ao Corpo de Alunos',
      'Aluno de Dia ao Pelotão',
      'Instrutor'
    )
  );

drop trigger if exists set_updated_at_records on public.records;
create trigger set_updated_at_records
  before update on public.records
  for each row execute function public.tg_set_updated_at();
