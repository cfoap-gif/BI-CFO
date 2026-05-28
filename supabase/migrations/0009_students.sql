-- =============================================================================
-- 0009_students.sql — Alunos oficiais do CFO
-- =============================================================================
-- Depende: 0005_platoons.sql (FK obrigatória platoon_id).
-- =============================================================================

create table if not exists public.students (
  id                  uuid        primary key default gen_random_uuid(),
  student_number      integer     not null,
  full_name           text        not null,
  war_name            text        not null,
  platoon_id          uuid        not null references public.platoons(id),
  registration_number text,                            -- matrícula institucional
  situation           text        not null default 'ativo',
  phone               text,
  active              boolean     not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint students_situation_chk check (
    situation in ('ativo', 'desligado', 'trancado', 'baixa temporária', 'concluído', 'outro')
  ),
  -- Número do aluno único dentro do pelotão (US-001).
  constraint students_number_per_platoon_unique unique (platoon_id, student_number)
);

comment on table public.students is
  'Alunos oficiais. student_number é único por pelotão (US-001).';

alter table public.students enable row level security;

drop policy if exists "students_read" on public.students;
create policy "students_read"
  on public.students for select
  to authenticated
  using (true);

drop policy if exists "students_insert" on public.students;
create policy "students_insert"
  on public.students for insert
  to authenticated
  with check (public.user_profile_name() in ('Administrador', 'Coordenação'));

drop policy if exists "students_update" on public.students;
create policy "students_update"
  on public.students for update
  to authenticated
  using      (public.user_profile_name() in ('Administrador', 'Coordenação'))
  with check (public.user_profile_name() in ('Administrador', 'Coordenação'));

drop trigger if exists set_updated_at_students on public.students;
create trigger set_updated_at_students
  before update on public.students
  for each row execute function public.tg_set_updated_at();
