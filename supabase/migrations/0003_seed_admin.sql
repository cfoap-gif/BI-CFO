-- =============================================================================
-- 0003_seed_admin.sql — Bootstrap do administrador inicial
-- =============================================================================
-- IMPORTANTE — leia antes de aplicar.
--
-- Esta migração NÃO cria o registro em auth.users e NÃO contém senha.
-- O motivo é que senhas NUNCA devem ser versionadas no Git (DT-002).
--
-- Procedimento manual obrigatório ANTES de rodar esta migração:
--
--   1) No Supabase Dashboard → Authentication → Users → Add user:
--        - Email:    admin@abm.br
--        - Password: <senha aleatória forte gerada localmente>
--        - Auto Confirm User: SIM (Confirm email = DESLIGADO no provider)
--      Anote a senha em local seguro (gerenciador de senhas). Ela será trocada
--      pelo administrador no primeiro acesso (procedimento manual no MVP — ver
--      DT-001 sobre ausência de reset por e-mail).
--
--   2) Copie o UUID do usuário criado (coluna "User UID" / id em auth.users).
--
--   3) Substitua o placeholder abaixo (<<COLE_AQUI_O_UUID_DO_AUTH_USERS>>)
--      pelo UUID copiado, ou execute o bloco DO ... ENDS para resolver
--      dinamicamente (mais robusto, recomendado).
--
--   4) Aplique esta migração via SQL Editor com role privilegiada
--      (service_role / postgres) — RLS é ignorada para esses papéis.
-- =============================================================================

do $$
declare
  v_admin_uid   uuid;
  v_profile_id  uuid;
begin
  -- Localiza o usuário criado manualmente em auth.users.
  select id into v_admin_uid
    from auth.users
   where email = 'admin@abm.br'
   limit 1;

  if v_admin_uid is null then
    raise exception
      'Usuário admin@abm.br não encontrado em auth.users. '
      'Crie-o pelo Dashboard antes de rodar esta migração (ver cabeçalho).';
  end if;

  -- Localiza o perfil Administrador (criado em 0002_seed_profiles.sql).
  select id into v_profile_id
    from public.profiles
   where name = 'Administrador'
   limit 1;

  if v_profile_id is null then
    raise exception
      'Perfil "Administrador" não encontrado em public.profiles. '
      'Aplique 0002_seed_profiles.sql antes desta migração.';
  end if;

  -- Cria (ou ajusta) o registro institucional em public.users.
  insert into public.users (id, login, full_name, war_name, profile_id, active)
  values (v_admin_uid, 'admin', 'Administrador do Sistema', null, v_profile_id, true)
  on conflict (id) do update set
    login      = excluded.login,
    full_name  = excluded.full_name,
    profile_id = excluded.profile_id,
    active     = excluded.active;
end
$$;
