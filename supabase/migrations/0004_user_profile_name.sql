-- =============================================================================
-- 0004_user_profile_name.sql — Helper de perfil para RLS
-- =============================================================================
-- Cria `public.user_profile_name()` que retorna o nome do perfil do usuário
-- autenticado (linha em public.users joined com public.profiles).
--
-- Decisão registrada em Apoio/_decisoes.md (DT-004).
--
-- Por que SECURITY DEFINER:
--   * Permite que a função leia public.users e public.profiles ignorando RLS,
--     necessário em policies onde o próprio user não tem SELECT em outros
--     registros (ele só pode SELECT em si mesmo via política users_read_self).
--   * A função expõe apenas o nome do perfil — nenhum PII sensível.
--   * search_path é fixado em public para evitar shadowing malicioso.
-- =============================================================================

create or replace function public.user_profile_name()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select p.name
    from public.users u
    join public.profiles p on p.id = u.profile_id
   where u.id = auth.uid()
     and u.active = true
   limit 1
$$;

comment on function public.user_profile_name() is
  'Retorna o nome do perfil do usuário autenticado (NULL se não logado / inativo / sem registro em public.users). Usado em policies de RLS.';

revoke all on function public.user_profile_name() from public;
grant execute on function public.user_profile_name() to authenticated;
