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

## DT-005 — Tabela central `records` no MVP (M3)

**Status:** ativa
**Marco:** M3
**Data:** 2026-05-28

**Decisão.** No MVP, **todos os fatos do CFO** (falta, atraso, baixa, instrução ministrada, missão, alteração de material, aviso, prescrição, ocorrência disciplinar, elogio, etc.) vivem numa **única tabela `public.records`**, discriminados por:

- `record_type` (CHECK enumerado — falta, atraso, baixa, instrução ministrada, alteração de material, missão interna/externa, aviso, elogio, etc.);
- `source_type` (origem do registro — `daily_book`, `duty_scale`, `manual`, etc.);
- `source_id` (FK lógica para a entidade de origem);
- `daily_book_id` (FK forte para o Livro de Dia que originou o registro, quando aplicável).

**Campos centrais para o ciclo documental:**
- `original_description` — texto original (preservado, jamais sobrescrito);
- `publication_text` — texto editado pela Coordenação para o BI (preenchido em M4);
- `classification` — `publicável | interno | restrito` (definido pela Coordenação);
- `status` — rascunho → enviado → em revisão → pendente de correção → validado → incluído no BI / interno / restrito / cancelado / arquivado;
- `include_in_bulletin` (boolean);
- `bulletin_part` (1..5).

**Por quê.**
- Modelo §32-§33 recomenda essa abordagem. Lançar o MVP rapidamente sem fragmentar em 8+ tabelas especializadas (`absences`, `missions`, `material_changes`, ...).
- Toda a lógica de validação, classificação e congelamento de `bulletin_items` opera sobre essa tabela única — simplifica services, queries e RLS.
- Permite que **DT-003 (PDF gerado só de `bulletin_items`)** continue valendo: o ciclo `records → bulletin_items → PDF` é o mesmo independente do `record_type`.

**Alternativas consideradas.**
- Tabelas especializadas desde o dia 1 (PRD §18.9 a §18.13): descartado para MVP — custo alto, ganho marginal no curto prazo.
- Documento JSON-único: descartado — perde queryability e integridade referencial.

**Plano de migração para fases futuras.**
A partir do M3+α (provavelmente fase 3 do roadmap, após MVP estabilizado), tabelas especializadas podem ser introduzidas progressivamente. Para cada especialização (ex.: `health_records`):
1. Criar `public.health_records` com campos específicos (incluindo `restricted_details`, `event_type`).
2. Backfill: para cada linha em `records` com `record_type = 'baixa'`, criar linha equivalente em `health_records` e atualizar `records.source_type='health_record'`, `records.source_id=<novo_id>`.
3. Manter `records` como a tabela "índice" do documental — `bulletin_items` continuam referenciando `records` via `source_type`/`source_id`.
4. A interface de UX pode passar a usar a tabela especializada para a entrada, mas o pipeline de publicação no BI continua passando por `records`.

**Consequências.**
- `records.original_description` é a única fonte de verdade textual do registro até a Coordenação editar `publication_text`. Edições no `original_description` são bloqueadas após `status='enviado'` (regra aplicada nas Server Actions; reforço por trigger futuro).
- `records.classification = 'restrito'` é protegido na própria RLS (policy `records_read` aplica filtro).
- Tabelas especializadas, quando criadas, NÃO são consultadas pelo PDF — o pipeline documental sempre passa por `records` → `bulletin_items`.

## DT-006 — Congelamento na montagem + reabertura simples (M5)

**Status:** ativa
**Marco:** M5
**Data:** 2026-05-30

**Decisão.** Refina a DT-003. Os `bulletin_items` são copiados de
`records.publication_text` **na montagem da prévia** (BI em `rascunho`), e tornam-se
**imutáveis na aprovação** (BI `aprovado`). Antes só falávamos em "cópia no momento da
aprovação"; na prática a prévia precisa ser editável (US-025: ocultar, reordenar, editar
texto), então os itens existem como rascunho editável e a aprovação apenas trava.

Correção pós-aprovação usa **reabertura controlada** (`aprovado → rascunho`, com motivo
registrado em `bulletin_events`), não versionamento real. O campo `bulletins.version`
fica reservado (`1`) para versionamento futuro.

**Garantias preservadas (DT-003 continua válida):**
- A prévia e o PDF (M6) leem **apenas** `bulletin_items` — nenhum acesso a `records`.
- `bulletin_items.content` recebe **só** `publication_text`; campos sensíveis
  (`original_description`, `coordination_note`, dados restritos/internos) nunca são copiados.
- `assembleItems` só importa registros com `status='validado' AND classification='publicável'
  AND include_in_bulletin=true` no período.
- Edição em `records` após a aprovação não propaga para `bulletin_items`.

**Por quê.** A apresentação de um boletim (ordem, visibilidade, texto editado) é
específica do documento, não do registro. Mantê-la em `bulletin_items` evita poluir
`records` e suporta corretamente BI por período e múltiplos boletins.

**Consequências.**
- `assembleItems` é idempotente: apaga e remonta os itens (só em rascunho).
- A montagem é executada pela função SQL transacional
  `public.assemble_bulletin_items(bulletin_id)` (0016), evitando BI parcialmente
  remontado se houver falha entre apagar e reinserir itens.
- Versionamento real (snapshots de versões anteriores) fica para fase futura, a registrar
  como nova DT quando ocorrer.

---

## DT-007 — Motor de PDF server-side com React-PDF (M6)

**Status:** ativa
**Marco:** M6
**Data:** 2026-05-30

**Decisão.** A geração do PDF do Boletim Interno usa `@react-pdf/renderer` no
servidor, em rota Node.js (`/boletins/[id]/pdf`), retornando um arquivo
`application/pdf` para download.

**Garantias preservadas (DT-003/DT-006):**
- A rota e o loader de PDF leem apenas `bulletins` e `bulletin_items`.
- O PDF só é gerado para BI `aprovado`.
- O conteúdo publicado vem de `bulletin_items.content`, já congelado no M5.
- Partes sem itens visíveis exibem "Sem alteração".

**Por quê.** O PRD pede PDF por template. React-PDF permite expressar o documento
como componentes React dedicados a PDF, sem depender de Chromium/headless browser no
deploy e sem montar páginas linha por linha.

**Alternativas consideradas.**
- HTML + Playwright/Chromium: melhor paridade com a prévia HTML, mas maior custo
  operacional e dependência de browser em produção.
- Biblioteca PDF de baixo nível: mais controle, porém mais verbosa e menos aderente
  ao modelo de template do PRD.

**Consequências.**
- A prévia HTML e o PDF são templates irmãos, não o mesmo CSS renderizado por dois
  motores.
- Supabase Storage, `pdf_url` e versionamento real de PDFs ficam para uma fatia
  posterior do repositório documental.

---

## DT-008 — Repositório documental simples em Storage (M7/M8)

**Status:** ativa
**Marco:** M7/M8
**Data:** 2026-05-31

**Decisão.** O repositório documental do MVP usa um bucket privado do Supabase Storage
chamado `bulletins`. Cada BI aprovado pode ter um PDF oficial vigente arquivado nesse
bucket. A tabela `public.bulletins` guarda os metadados do arquivo vigente em
`pdf_path`, `pdf_generated_at` e `pdf_generated_by`.

A aplicação expõe o download do arquivo arquivado pela rota autenticada
`/boletins/[id]/arquivo`, com guarda de perfil Administrador/Coordenação. O bucket não
é público, não há exposição direta de URL pública no MVP, e a própria RLS do Storage
também restringe leitura/escrita a usuários autenticados desses perfis.

**Sobrescrita controlada.** Enquanto não houver versionamento real, gerar novamente o
arquivo arquivado do mesmo BI aprovado sobrescreve o caminho vigente (`upsert: true`) e
atualiza os metadados `pdf_*`. O re-arquivamento em si mantém apenas o estado vigente do
arquivo; mudanças de conteúdo exigem reabertura/aprovação do BI e essas transições ficam
registradas em `bulletin_events`. O campo `bulletins.version` permanece reservado para
uma fase futura.

**Não decidido neste marco.**
- retenção legal avançada;
- múltiplas versões arquivadas por BI;
- hash criptográfico do arquivo;
- assinatura digital;
- acesso por perfis de consulta externos à Coordenação.

**Por quê.** O M7 precisava garantir persistência e download autenticado do PDF oficial
sem transformar o MVP em um GED completo. O modelo simples reduz risco operacional e
mantém o caminho aberto para versionamento real depois.

**Consequências.**
- `pdf_path` aponta para o arquivo vigente, não para um histórico de versões.
- O Storage é parte do fluxo oficial: `Livro de Dia → Registros → Validação →
  Boletim Interno → PDF → Arquivo`.
- Qualquer implementação futura de versionamento deve criar nova DT, provavelmente
  adicionando tabela própria de versões de PDF.

---

## Próximas decisões esperadas (a registrar quando ocorrerem)

- **DT-009** — versionamento real de PDFs, retenção, hash e assinatura digital.
