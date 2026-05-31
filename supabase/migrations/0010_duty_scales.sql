-- =============================================================================
-- 0010_duty_scales.sql — Escalas e serviços
-- =============================================================================
-- US-005. Atende ao Domain Map §5 (Escalas e Serviços).
--
-- Regras invariantes:
--   * Exatamente UM entre student_id / military_staff_id deve estar preenchido.
--   * Status segue ciclo: rascunho → validada → publicada (pode ir a alterada
--     ou cancelada em qualquer ponto). No MVP, edição livre antes da validação.
--   * RLS: SELECT por qualquer autenticado; INSERT/UPDATE só Admin/Coord;
--     DELETE bloqueado (use status=cancelada).
-- =============================================================================

create table if not exists public.duty_scales (
  id                  uuid        primary key default gen_random_uuid(),
  date                date        not null,
  scale_type          text        not null,
  function_name       text        not null default '',
  student_id          uuid                  references public.students(id),
  military_staff_id   uuid                  references public.military_staff(id),
  platoon_id          uuid                  references public.platoons(id),
  start_time          time,
  end_time            time,
  location_id         uuid                  references public.locations(id) on delete set null,
  uniform             text        not null default '',
  notes               text        not null default '',
  status              text        not null default 'rascunho',
  publish_suggestion  boolean     not null default false,
  created_by          uuid                  references auth.users(id),
  validated_by        uuid                  references auth.users(id),
  validated_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint duty_scales_type_chk check (
    scale_type in (
      'Aluno de Dia ao Corpo de Alunos',
      'Aluno de Dia ao Pelotão',
      'Permanência',
      'Apoio interno',
      'Apoio à instrução',
      'Missão interna',
      'Missão externa',
      'Militar de serviço',
      'Outro'
    )
  ),
  constraint duty_scales_status_chk check (
    status in ('rascunho', 'validada', 'alterada', 'cancelada', 'publicada')
  ),
  -- Exatamente um dos dois deve estar preenchido (XOR lógico).
  constraint duty_scales_person_chk check (
    (student_id is not null and military_staff_id is null)
    or (student_id is null and military_staff_id is not null)
  ),
  -- Janela de horário coerente, se ambos preenchidos.
  constraint duty_scales_time_chk check (
    start_time is null or end_time is null or start_time <= end_time
  )
);

comment on table public.duty_scales is
  'Escalas de serviço do CFO. Exatamente um entre student_id e military_staff_id.';

create index if not exists idx_duty_scales_date on public.duty_scales (date);
create index if not exists idx_duty_scales_student on public.duty_scales (student_id);
create index if not exists idx_duty_scales_military on public.duty_scales (military_staff_id);

alter table public.duty_scales enable row level security;

drop policy if exists "duty_scales_read" on public.duty_scales;
create policy "duty_scales_read"
  on public.duty_scales for select
  to authenticated
  using (true);

drop policy if exists "duty_scales_insert" on public.duty_scales;
create policy "duty_scales_insert"
  on public.duty_scales for insert
  to authenticated
  with check (public.user_profile_name() in ('Administrador', 'Coordenação'));

drop policy if exists "duty_scales_update" on public.duty_scales;
create policy "duty_scales_update"
  on public.duty_scales for update
  to authenticated
  using      (public.user_profile_name() in ('Administrador', 'Coordenação'))
  with check (public.user_profile_name() in ('Administrador', 'Coordenação'));

drop trigger if exists set_updated_at_duty_scales on public.duty_scales;
create trigger set_updated_at_duty_scales
  before update on public.duty_scales
  for each row execute function public.tg_set_updated_at();
