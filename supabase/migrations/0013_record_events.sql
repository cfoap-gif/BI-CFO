-- =============================================================================
-- 0013_record_events.sql — Histórico imutável de transições de registros (M4)
-- =============================================================================
-- US-019/US-020: a validação registra usuário, data e hora; a devolução exige
-- motivo e o histórico deve ser preservado. Em vez de sobrescrever
-- records.coordination_note, cada transição vira uma linha imutável aqui.
--
-- Imutável: há policies de SELECT e INSERT, mas NENHUMA de UPDATE/DELETE.
-- Não há updated_at nem trigger — uma linha nunca muda depois de criada.
-- =============================================================================

create table if not exists public.record_events (
  id          uuid        primary key default gen_random_uuid(),
  record_id   uuid        not null references public.records(id) on delete cascade,
  event_type  text        not null,
  from_status text,
  to_status   text        not null,
  note        text        not null default '',
  created_by  uuid        not null references auth.users(id),
  created_at  timestamptz not null default now(),

  constraint record_events_type_chk check (
    event_type in (
      'enviado', 'em_revisao', 'devolvido', 'validado', 'cancelado', 'arquivado'
    )
  )
);

comment on table public.record_events is
  'Histórico imutável de transições de status de records (M4). Append-only.';

create index if not exists idx_record_events_record
  on public.record_events (record_id, created_at desc);

alter table public.record_events enable row level security;

-- Leitura: qualquer autenticado (a visibilidade do registro pai já é filtrada
-- pela RLS de public.records; o histórico não expõe PII além do uuid do autor).
drop policy if exists "record_events_read" on public.record_events;
create policy "record_events_read"
  on public.record_events for select
  to authenticated
  using (true);

-- Inserção: apenas perfis que podem causar transições, e o autor declarado
-- precisa ser o próprio usuário (anti-forja).
drop policy if exists "record_events_insert" on public.record_events;
create policy "record_events_insert"
  on public.record_events for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and public.user_profile_name() in (
      'Administrador',
      'Coordenação',
      'Aluno de Dia ao Corpo de Alunos',
      'Aluno de Dia ao Pelotão',
      'Instrutor'
    )
  );

-- Sem policies de UPDATE/DELETE → tabela append-only (imutável).
