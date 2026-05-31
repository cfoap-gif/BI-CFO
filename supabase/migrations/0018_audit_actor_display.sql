-- =============================================================================
-- 0018_audit_actor_display.sql — Autores legíveis para auditoria (M8)
-- =============================================================================
-- DT-002/M8: public.users continua sem SELECT amplo. Esta função SECURITY
-- DEFINER expõe apenas campos mínimos para exibir autores em históricos.
-- =============================================================================

create or replace function public.audit_actor_display_by_ids(p_user_ids uuid[])
returns table (
  user_id uuid,
  login text,
  full_name text,
  war_name text,
  profile_name text,
  active boolean
)
language sql
security definer
stable
set search_path = public
as $$
  select
    u.id as user_id,
    u.login,
    u.full_name,
    u.war_name,
    p.name as profile_name,
    u.active
  from public.users u
  join public.profiles p on p.id = u.profile_id
  where u.id = any(coalesce(p_user_ids, array[]::uuid[]));
$$;

comment on function public.audit_actor_display_by_ids(uuid[]) is
  'M8: resolve autores de auditoria sem liberar SELECT amplo em public.users. Retorna apenas campos mínimos de identificação.';

revoke all on function public.audit_actor_display_by_ids(uuid[]) from public;
grant execute on function public.audit_actor_display_by_ids(uuid[]) to authenticated;
