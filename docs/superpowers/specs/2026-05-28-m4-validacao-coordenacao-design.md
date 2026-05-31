# M4 — Validação da Coordenação — Design

**Data:** 2026-05-28
**Marco:** M4
**Épico:** 4 — Validação da Coordenação (US-018 a US-022)
**Status:** implementado (código no branch `feat/m4-validacao`; falta aplicar a migration `0013` no Supabase e rodar o checklist manual)

## Contexto

M3 entregou a tabela central `public.records` (DT-005) e o Livro de Dia. Registros
nascem em `rascunho`, são `enviado`s pelos responsáveis (Aluno de Dia, Instrutor),
e precisam passar pela validação da Coordenação antes de poderem virar
`bulletin_items` (invariante DT-003).

M4 implementa essa camada de validação: uma fila de registros pendentes, ações de
validar / devolver / classificar, edição do texto final de publicação, e um histórico
auditável de transições.

**Escopo estrito (decisão de brainstorming):** M4 cobre apenas o fluxo de validação.
As tabelas `bulletins` / `bulletin_items` e a UI de criação do BI ficam para M5
(YAGNI — migrations são baratas de criar quando a UI de M5 clarificar os campos).

## User Stories cobertas

- **US-018** — Visualizar registros pendentes (fila com filtros).
- **US-019** — Validar registro (registra usuário, data, hora; bloqueia edição comum).
- **US-020** — Devolver registro para correção (motivo obrigatório; histórico preservado).
- **US-021** — Classificar registro (publicável / interno / restrito).
- **US-022** — Editar texto final de publicação (`publication_text`) sem alterar o original.

## Decisões de design

1. **Histórico via tabela `record_events`** (não `coordination_note` sobrescrito nem
   `jsonb`). Audit trail real, queryable, imutável.
2. **Escopo estrito** — sem tabelas de BI no M4.
3. **Rota `/validacao`** — seção própria de nível raiz (workflow distinto da entrada
   de dados do Livro de Dia), seguindo o padrão de `/cadastros`, `/escalas`,
   `/livro-de-dia`.
4. **Controle de transição nas Server Actions** — sem trigger no banco
   (consistente com DT-005: "regra aplicada nas Server Actions; reforço por trigger futuro").
5. **Verificação manual** — sem suíte de testes automatizados (consistente com o
   estado do projeto; testes documentados como M5+ na DT-003).

## 1. Banco de Dados

### Nova migration: `0013_record_events.sql`

```sql
create table public.record_events (
  id          uuid        primary key default gen_random_uuid(),
  record_id   uuid        not null references public.records(id) on delete cascade,
  event_type  text        not null,   -- 'enviado' | 'em_revisao' | 'devolvido' | 'validado' | 'cancelado' | 'arquivado'
  from_status text,
  to_status   text        not null,
  note        text        not null default '',   -- motivo de devolução (obrigatório quando event_type='devolvido')
  created_by  uuid        not null references auth.users(id),
  created_at  timestamptz not null default now()
);

create index idx_record_events_record on public.record_events (record_id, created_at desc);
```

**RLS:**
- SELECT — `to authenticated using (true)` (histórico legível por autenticados; a leitura
  do registro em si já é filtrada pela RLS de `records`).
- INSERT — permitido a perfis que podem causar transições: Coordenação/Administrador
  (validação) e os perfis de entrada (Aluno de Dia ao Corpo de Alunos, Aluno de Dia ao
  Pelotão, Instrutor) para o evento `enviado`. Reuso do helper `public.user_profile_name()`.
- UPDATE / DELETE — nenhuma policy → bloqueado. Log imutável.

**Sem alteração em `records`** — todos os campos necessários já existem:
`publication_text`, `classification`, `coordination_note`, `validated_by`,
`validated_at`, `include_in_bulletin`, `bulletin_part`.

## 2. Rotas e Server Actions

```
app/validacao/
  layout.tsx          — guard: só Coordenação e Administrador (padrão getCurrentProfileName)
  page.tsx            — fila de registros (US-018): tabela com filtros
  [id]/
    page.tsx          — detalhe do registro (US-019/020/021/022)
    actions.ts        — Server Actions de validação
```

### Server Actions (`app/validacao/[id]/actions.ts`)

| Action | Transição de status | Campos alterados |
|---|---|---|
| `markInReview(id)` | `enviado → em revisão` | — + evento |
| `validateRecord(id, data)` | `em revisão → validado` | `validated_by`, `validated_at`, `classification`, `include_in_bulletin`, `bulletin_part`, `publication_text` + evento |
| `returnForCorrection(id, note)` | `em revisão → pendente de correção` | `coordination_note` + evento (note obrigatória) |
| `updatePublicationText(id, text)` | sem transição | `publication_text` |

Cada action:
- Verifica o perfil via `getCurrentProfileName()` (DT-004); rejeita se não for
  Coordenação/Administrador.
- Valida a transição de status (não age sobre estado errado).
- Insere um registro em `record_events` para rastrear a transição.
- Retorna `{ error: string }` em caso de falha (padrão das actions de `/cadastros`).

## 3. UI

### `/validacao` (fila)

Tabela com colunas: data, tipo, aluno/responsável, status (badge colorido),
classificação. Filtros no topo: data, tipo de registro, status, pelotão. Registros
`enviado` e `pendente de correção` destacados (linha com cor de atenção). Paginação
simples. Reaproveita a estrutura `table` + `thead` de `/cadastros` e `/escalas`.

### `/validacao/[id]` (detalhe)

Layout em duas colunas:
- **Esquerda (somente leitura):** tipo, data, aluno, `original_description`, e o
  histórico de eventos (`record_events` em ordem cronológica).
- **Direita (painel de ação):** `publication_text` (editável), `classification`
  (select), `include_in_bulletin` (toggle), `bulletin_part` (1–5, visível só se
  `include_in_bulletin = true`), `coordination_note` (textarea). Botões: **Validar**,
  **Devolver para correção** (modal com motivo obrigatório).

Badge de status no topo, cor por estado: rascunho=cinza, enviado=azul,
em revisão=amarelo, pendente de correção=laranja, validado=verde.

## 4. Tratamento de Erros e Invariantes

- Perfil conferido em toda action (Coordenação/Administrador).
- Transições validadas: `validateRecord` só sobre `em revisão`;
  `returnForCorrection` exige `note` não-vazio (US-020); transições inválidas
  retornam mensagem clara.
- Erros do Supabase capturados e retornados como `{ error: string }`.

**Invariante DT-003:**
- `classification` `restrito` ou `interno` força `include_in_bulletin = false`.
- `bulletin_part` só aceita valor quando `include_in_bulletin = true`.

## 5. Verificação Manual (checklist de aceite)

1. Validar um registro `enviado` → status vira `validado`, `validated_by`/`validated_at` preenchidos.
2. Devolver um registro com motivo → status `pendente de correção`, evento registrado em `record_events`.
3. Responsável reenvia → fluxo volta para a fila.
4. Classificar como `restrito` → confirmar que `include_in_bulletin` fica `false` (bloqueio do BI).
5. Editar `publication_text` → `original_description` permanece intacto.
6. Conferir histórico completo de eventos em `record_events`.
7. Acesso negado a perfis fora de Coordenação/Administrador na rota `/validacao`.
