-- =============================================================================
-- 0002_seed_profiles.sql — Seed dos 7 perfis de acesso
-- =============================================================================
-- Fonte: PRD §16 e Domain Map §12.2.
-- Idempotente: usa ON CONFLICT (name) DO NOTHING.
-- =============================================================================

insert into public.profiles (name, description) values
  ('Administrador',
   'Acesso total ao sistema. Configura usuários, permissões e parâmetros.'),
  ('Coordenação',
   'Coordenação do CFO. Cria BI, revisa registros, valida, classifica, aprova, gera PDF e arquiva.'),
  ('Coordenador de Pelotão',
   'Revisa registros do próprio pelotão, conforme permissão da Coordenação.'),
  ('Aluno de Dia ao Corpo de Alunos',
   'Preenche Livro de Dia geral, consolida informações dos pelotões e envia para revisão.'),
  ('Aluno de Dia ao Pelotão',
   'Preenche informações do respectivo pelotão.'),
  ('Instrutor',
   'Confirma instrução ministrada, carga horária, faltas e alterações da disciplina.'),
  ('Consulta',
   'Visualiza apenas BIs publicados e autorizados.')
on conflict (name) do nothing;
