# Decisões Técnicas — BI-CFO

Este documento registra decisões técnicas formais do projeto. Cada decisão tem um identificador (`DT-NNN`) usado em comentários de código, migrações e PRs.

> Estilo: cada decisão indica **o que** foi decidido, **por quê**, **alternativas consideradas** e **consequências**. Decisões revogadas são marcadas como `[REVOGADA por DT-XYZ]` e mantidas para histórico.

---

## DT-001 — Autenticação institucional via e-mail técnico

**Status:** ativa (revisada em 2026-05-28 — domínio alterado de `bi-cfo.local` para `abm.br`)
**Marco:** M0
**Data:** 2026-05-28

**Decisão.** O sistema usa **Supabase Auth (email + password)** com **e-mail técnico institucional** derivado do login, no formato `{login}@abm.br`. O usuário digita apenas o login (ex.: `admin`, `cad.silva`); o frontend completa com o sufixo `@abm.br` antes de chamar `signInWithPassword`.

> **Histórico.** Versão inicial usava `@abm.br` (domínio reservado RFC 6762). Alterado para `@abm.br` por preferência institucional do CBMAP/ABM. Como `Confirm email` e `Magic link` estão DESLIGADOS no provider, nenhuma mensagem real é enviada para o domínio, independentemente de ele ser roteável ou não. A constante única `INSTITUTIONAL_EMAIL_DOMAIN` em `lib/auth/constants.ts` permite trocar novamente no futuro com baixo custo.

**Configuração do provider Supabase (Auth → Providers → Email):**
- `Confirm email`: **DESLIGADO**.
- `Magic link`: **DESLIGADO**.
- `Email/Password`: **LIGADO**.
- SMTP customizado: **não configurar** (não há e-mail real saindo do sistema).

**Reset de senha.** Não há recuperação por e-mail no MVP. Reset é administrativo — pelo Dashboard Supabase ou, em fase posterior, por tela do Administrador.

**Por quê.** O público real do CFO (Coordenação, Aluno de Dia, Instrutor) é identificado por **nome de guerra / matrícula / identificador funcional**, não por e-mail pessoal. Exigir e-mail real introduz fricção desnecessária e não reflete o uso institucional. O domínio `.local` é reservado para uso interno (RFC 6762) e não é roteável, garantindo que nenhuma mensagem real seria entregue mesmo se acidentalmente enviada.

**Alternativas consideradas.**
- Login direto por `username` com tabela própria de senhas: descartado — duplica responsabilidade do Supabase Auth e exige reimplementar hashing, sessões, JWT.
- Magic link: descartado — depende de e-mail real.
- OAuth (Google/Microsoft): descartado para MVP — alunos podem não ter conta institucional.

**Consequências.**
- Simplicidade: aproveita toda a infraestrutura do Supabase Auth (sessões, JWT, refresh tokens, RLS via `auth.uid()`).
- Reset de senha exige intervenção manual no MVP (aceitável: pool pequeno de usuários).
- O campo `email` em `auth.users` não tem valor de comunicação — é apenas identificador interno.

---

## DT-002 — RLS mínima e bootstrap por service_role no M0

**Status:** ativa
**Marco:** M0
**Data:** 2026-05-28

**Decisão.** No M0, **RLS é habilitada apenas em `public.profiles` e `public.users`** (únicas tabelas existentes). As políticas são:

- `public.profiles`: leitura permitida a qualquer usuário autenticado. Nenhuma política de INSERT/UPDATE/DELETE → mudanças apenas via seed/service_role.
- `public.users`: leitura permitida apenas para `id = auth.uid()`. Nenhuma política de INSERT/UPDATE/DELETE → mudanças apenas via seed/service_role.

O **bootstrap do administrador inicial** é feito em duas etapas (descritas em `supabase/migrations/0003_seed_admin.sql`):
1. Criação manual de `auth.users` via Dashboard Supabase (e-mail `admin@abm.br`, senha aleatória forte, auto-confirmado).
2. Migração `0003_seed_admin.sql` aplicada com role `service_role`/`postgres` (ignora RLS) que insere o registro correspondente em `public.users` com perfil Administrador.

**Por quê.** Em um banco vazio com RLS estrita, não existe usuário capaz de "criar" o primeiro administrador — clássico problema do ovo e da galinha. A `service_role` resolve isso de forma segura, contanto que sua chave **nunca** seja exposta no client. Manter a senha do admin **fora** do SQL versionado evita vazamento histórico no Git.

**Alternativas consideradas.**
- RLS desligada no M0 e ligada depois: descartado — cria janela perigosa e cria o hábito errado.
- Política de bootstrap permissiva temporária: descartado — fácil esquecer de remover; superfície de ataque.

**Consequências.**
- A chave `SUPABASE_SERVICE_ROLE_KEY` precisa de tratamento rigoroso: vive apenas em `.env.local` (gitignored) e como variável de ambiente do servidor no Vercel. Nunca aparece em código com `"use client"`.
- Políticas mais amplas (Administrador lê todos os `users`, Coordenação lê seu pelotão, etc.) serão adicionadas progressivamente a partir do M1, com função auxiliar `auth.user_profile_name()` para encapsular a lógica de perfil.

---

## DT-003 — Invariante arquitetural do fluxo documental

**Status:** ativa (princípio permanente do produto)
**Marco:** M0 (registrada desde a fundação, aplicada a partir do M3)
**Data:** 2026-05-28

**Decisão.** O fluxo obrigatório do sistema é:

> **Livro de Dia → Registros → Validação da Coordenação → Boletim Interno → PDF → Arquivo**

E, como consequência direta:

> **O PDF do Boletim Interno NUNCA será gerado a partir do Livro de Dia.**

O PDF é sempre gerado a partir de `bulletin_items` — itens congelados, copiados após validação e aprovação, agrupados nas 5 partes do BI.

**Aplicações concretas (vinculantes para M3 em diante):**
1. O serviço `pdfService.generate(bulletinId)` lê **exclusivamente** `bulletin_items`. Nenhum import de `records`, `daily_books`, `absences`, etc. em `lib/pdf/`.
2. `bulletin_items.content` é **cópia** de `records.publication_text` no momento da aprovação do BI. Não é FK lookup vivo. Edições posteriores em `records` não propagam para `bulletin_items` já criados.
3. Apenas registros com `status = 'validado' AND classification = 'publicável' AND include_in_bulletin = true` viram `bulletin_items`.
4. Campos sensíveis (`restricted_details`, `coordination_note`, justificativas detalhadas, CID, laudo médico, defesa disciplinar em apuração) **nunca** são copiados para `bulletin_items.content`.
5. Numeração: `unique (bulletins.number, bulletins.year)`.

**Por quê.** O Boletim Interno é um **documento oficial**. Gerar PDF direto do Livro de Dia significaria publicar rascunhos, dados não validados ou informações sensíveis. A separação `Livro de Dia → registros → BI → PDF` garante: rastreabilidade, controle administrativo, imutabilidade documental e proteção de dados sensíveis.

**Consequências.**
- Mais tabelas e mais código do que um fluxo "linear" simples — preço justo da qualidade documental.
- Todo refactor ou nova feature precisa preservar essa separação.
- Testes automatizados (M5+) devem cobrir invariantes: (a) `pdfService` só consulta `bulletin_items`; (b) `bulletin_items.content` nunca contém substring de campos restritos; (c) edição em `records` após `bulletin.status='aprovado'` não altera `bulletin_items`.

---

## DT-004 — Helper `public.user_profile_name()` e padrão de RLS por perfil (M1)

**Status:** ativa
**Marco:** M1
**Data:** 2026-05-28

**Decisão.** Para evitar repetir o JOIN `users → profiles` em toda policy de RLS, criamos a função SQL `public.user_profile_name()` em `0004_user_profile_name.sql`. Ela é `SECURITY DEFINER`, `STABLE`, com `search_path = public`, e retorna o nome do perfil do `auth.uid()` corrente (NULL se não houver registro ativo em `public.users`).

A função tem `GRANT EXECUTE` apenas para `authenticated`. RLS é ignorada dentro da função, mas o output é apenas o nome do perfil (não vaza PII).

**Padrão de policy adotado para as tabelas de cadastro institucional (M1):**

- **SELECT** — `to authenticated using (true)`. Todos os usuários autenticados leem as 5 tabelas, porque cadastros alimentam selects de telas futuras (Livro de Dia, registros, escalas).
- **INSERT/UPDATE** — `to authenticated with check (public.user_profile_name() in ('Administrador', 'Coordenação'))`. Apenas Admin e Coordenação escrevem.
- **DELETE** — nenhuma policy → bloqueado. Inativação é feita via `active = false`. Regra do PRD §18 (registros vinculados a histórico não devem ser excluídos).

Aplicado em: `platoons`, `military_staff`, `locations`, `disciplines`, `students`.

A função `getCurrentProfileName()` (em `lib/auth/profile.ts`) é o equivalente server-side, chamada via `supabase.rpc("user_profile_name")` e usada como guard das páginas `/cadastros/*` no `app/cadastros/layout.tsx`.

**Por quê.**
- DRY em policies — `user_profile_name()` em uma policy substitui um subquery de 3 linhas.
- A função encapsula a regra de "user ativo" — desativar `public.users.active = false` automaticamente revoga permissões de escrita sem alterar policies.
- Mantém o nome do perfil como string legível na lógica de policy (vs. UUIDs), o que facilita revisão.

**Alternativas consideradas.**
- Subquery direto em cada policy: descartado — verbose e duplica lógica.
- Usar `current_setting('request.jwt.claims')` para extrair role: descartado — exigiria sincronizar perfil no JWT custom claim, mais complexidade no MVP.
- Trigger que copia o profile_id para um campo `auth.users.raw_app_meta_data`: descartado pelo mesmo motivo.

**Consequências.**
- Toda nova policy de M2+ usa o mesmo helper. Se a regra de "quem é admin-like" mudar, atualiza-se a função (ou as listas em `lib/auth/profile.ts`) e as policies seguem.
- Policies baseadas em pelotão (futuro Coord de Pelotão) virão a partir de M3, com helper adicional `user_platoon_id()` ou similar.

---

## Próximas decisões esperadas (a registrar quando ocorrerem)

- **DT-005 (M3)** — adoção de tabela central `records` em vez de tabelas especializadas no MVP (com plano de migração para fases futuras).
- **DT-006 (M6)** — escolha definitiva do motor de PDF (`@react-pdf/renderer` planejado; reavaliar conforme requisitos visuais).
