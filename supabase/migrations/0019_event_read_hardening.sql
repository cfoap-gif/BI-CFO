-- =============================================================================
-- 0019_event_read_hardening.sql — Leitura restrita de eventos de auditoria (M8)
-- =============================================================================
-- M8: eventos de auditoria não devem formar um feed global para qualquer usuário
-- autenticado. As telas que exibem estes históricos já são restritas à
-- Coordenação/Administrador; a RLS passa a refletir isso diretamente.
-- =============================================================================

drop policy if exists "record_events_read" on public.record_events;
create policy "record_events_read"
  on public.record_events for select
  to authenticated
  using (public.user_profile_name() in ('Administrador', 'Coordenação'));

drop policy if exists "bulletin_events_read" on public.bulletin_events;
create policy "bulletin_events_read"
  on public.bulletin_events for select
  to authenticated
  using (public.user_profile_name() in ('Administrador', 'Coordenação'));
