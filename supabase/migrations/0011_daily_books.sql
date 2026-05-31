-- =============================================================================
-- 0011_daily_books.sql — Livro de Dia (principal)
-- =============================================================================
-- US-008 a US-017. Modelo §14.
--
-- Regras:
--   * 1 Livro de Dia por (date, course_label). Inicialmente course_label vai
--     ser "Geral" no MVP (turma única). Permitirá segmentar futuramente.
--   * Aluno de Dia ao Corpo de Alunos preenche e envia.
--   * Coordenação valida.
--   * Livro de Dia NÃO gera PDF diretamente. Os registros associados (records)
--     entram no BI via congelamento em bulletin_items (DT-003).
-- =============================================================================

create table if not exists public.daily_books (
  id                    uuid        primary key default gen_random_uuid(),
  date                  date        not null,
  course_label          text        not null default 'Geral',
  student_duty_ca_id    uuid                  references public.students(id),
  expected_effective    integer,
  present_effective     integer,
  general_summary       text        not null default '',
  service_passage       text        not null default '',
  status                text        not null default 'rascunho',
  submitted_by          uuid                  references auth.users(id),
  submitted_at          timestamptz,
  reviewed_by           uuid                  references auth.users(id),
  reviewed_at           timestamptz,
  validated_by          uuid                  references auth.users(id),
  validated_at          timestamptz,
  created_by            uuid                  references auth.users(id),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  constraint daily_books_status_chk check (
    status in ('rascunho', 'enviado', 'em revisão', 'pendente de correção',
               'validado', 'arquivado')
  ),
  constraint daily_books_effective_chk check (
    (expected_effective is null or expected_effective >= 0)
    and (present_effective is null or present_effective >= 0)
  ),
  constraint daily_books_unique_per_day unique (date, course_label)
);

comment on table public.daily_books is
  'Livro de Dia principal. 1 por (data, curso). Status: rascunho → enviado → em revisão → validado.';

create index if not exists idx_daily_books_date on public.daily_books (date desc);
create index if not exists idx_daily_books_status on public.daily_books (status);

alter table public.daily_books enable row level security;

drop policy if exists "daily_books_read" on public.daily_books;
create policy "daily_books_read"
  on public.daily_books for select
  to authenticated
  using (true);

-- Escrita liberada para os 4 perfis que operam o Livro de Dia.
-- A regra "quem pode mudar para qual status" é aplicada nas Server Actions.
drop policy if exists "daily_books_insert" on public.daily_books;
create policy "daily_books_insert"
  on public.daily_books for insert
  to authenticated
  with check (
    public.user_profile_name() in (
      'Administrador',
      'Coordenação',
      'Aluno de Dia ao Corpo de Alunos',
      'Aluno de Dia ao Pelotão'
    )
  );

drop policy if exists "daily_books_update" on public.daily_books;
create policy "daily_books_update"
  on public.daily_books for update
  to authenticated
  using (
    public.user_profile_name() in (
      'Administrador',
      'Coordenação',
      'Aluno de Dia ao Corpo de Alunos',
      'Aluno de Dia ao Pelotão'
    )
  )
  with check (
    public.user_profile_name() in (
      'Administrador',
      'Coordenação',
      'Aluno de Dia ao Corpo de Alunos',
      'Aluno de Dia ao Pelotão'
    )
  );

drop trigger if exists set_updated_at_daily_books on public.daily_books;
create trigger set_updated_at_daily_books
  before update on public.daily_books
  for each row execute function public.tg_set_updated_at();
