# M5 — Publicação do Boletim Interno — Design

**Data:** 2026-05-30
**Marco:** M5
**Épico:** 5 — Publicação do Boletim Interno (US-023 a US-026)
**Status:** aprovado

## Contexto

M4 entregou a validação da Coordenação: registros chegam a `status='validado'`, com
`classification` e `include_in_bulletin` definidos. M5 consome esses registros para
**criar Boletins Internos**, montar uma **prévia editável** e **aprovar** (congelar) a
versão final. A geração de PDF é o **M6** — fora do escopo aqui; a prévia HTML do M5
é o espelho visual que o M6 renderizará.

## User Stories cobertas

- **US-023** — Criar BI (número, ano, data de publicação, período; tipo diário vs por período; nº único no ano; inicia em rascunho).
- **US-024** — Buscar registros validados para o BI (montagem dos itens a partir de `records`).
- **US-025** — Montar prévia (cabeçalho, 5 partes, "Sem alteração", ocultar/reordenar/editar item, botão aprovar).
- **US-026** — Aprovar BI (congela itens; status aprovado; registra usuário/data/hora; reabertura controlada).

## Decisões de design

1. **Modelo de congelamento (Abordagem A).** Os `bulletin_items` são o *working set* da
   prévia: criados na montagem (BI `rascunho`), livremente editáveis (`content`,
   `display_order`, `visible`), e **imutáveis na aprovação**. `records` permanece como a
   fonte de verdade validada; a apresentação específica do boletim (ordem, visibilidade,
   texto editado) vive nos itens, onde pertence. Isso suporta corretamente BI por período
   (muitos registros) e a ordenação/visibilidade por-boletim.
2. **Refinamento da DT-003 → registrar DT-006.** A DT-003 dizia "cópia no momento da
   aprovação". Refina-se para: **"itens são copiados ao serem adicionados ao boletim
   (montagem da prévia); tornam-se imutáveis na aprovação"**. A garantia essencial
   permanece: PDF/prévia leem só `bulletin_items`; campos sensíveis nunca copiados;
   edição em `records` não propaga para itens aprovados.
3. **Reabertura simples (sem versionamento real no MVP).** BI `aprovado` pode ser
   **reaberto** para `rascunho` por Coordenação/Administrador (ação explícita, com motivo,
   registrada em audit). `version` fica em `1`, reservado para versionamento real numa
   fase futura. Atende US-026 ("reabertura controlada") sem o custo de snapshots.
4. **Prévia funcional em HTML.** `/boletins/[id]/previa` renderiza o documento na tela
   (cabeçalho, 5 partes, "Sem alteração"); sem nenhuma lib de PDF (M6 decide o motor).
5. **Autorização.** Restrita a Coordenação/Administrador (admin-like), consistente com M4
   (US-026 "apenas perfil autorizado").
6. **Rota `/boletins`.** Seção de nível raiz, seguindo o padrão de `/cadastros`,
   `/escalas`, `/livro-de-dia`, `/validacao`.
7. **Verificação manual** (sem framework de testes; gate de código = `npm run build`),
   consistente com M0–M4.

## 1. Banco de Dados

### Migration `0014_bulletins.sql`

**`public.bulletins`**
```
id               uuid pk default gen_random_uuid()
number           integer     not null
year             integer     not null
publication_date date
start_date       date        not null
end_date         date        not null
type             text        not null          -- 'diário' | 'período'
status           text        not null default 'rascunho'  -- rascunho | aprovado | cancelado
version          integer     not null default 1           -- reservado p/ versionamento futuro
created_by       uuid        references auth.users(id)
approved_by      uuid        references auth.users(id)
approved_at      timestamptz
created_at       timestamptz not null default now()
updated_at       timestamptz not null default now()

unique (number, year)                                     -- regra 19.1
check (type in ('diário','período'))
check (status in ('rascunho','aprovado','cancelado'))
check (end_date >= start_date)
```

**`public.bulletin_items`** (working set da prévia → congelado na aprovação)
```
id              uuid pk default gen_random_uuid()
bulletin_id     uuid        not null references public.bulletins(id) on delete cascade
record_id       uuid        references public.records(id) on delete set null  -- rastreabilidade
part_number     integer     not null check (part_number between 1 and 5)
reference_date  date
title           text        not null default ''
content         text        not null default ''   -- CÓPIA de records.publication_text (editável até aprovar)
source_type     text
display_order   integer     not null default 0
visible         boolean     not null default true
created_at      timestamptz not null default now()
updated_at      timestamptz not null default now()
```

**`public.bulletin_events`** (audit imutável, espelha `record_events` do M4)
```
id           uuid pk default gen_random_uuid()
bulletin_id  uuid        not null references public.bulletins(id) on delete cascade
event_type   text        not null check (event_type in ('criado','aprovado','reaberto','cancelado'))
note         text        not null default ''
created_by   uuid        not null references auth.users(id)
created_at   timestamptz not null default now()
```

**RLS:**
- `bulletins`, `bulletin_items`: SELECT a `authenticated`. INSERT/UPDATE com
  `with check (public.user_profile_name() in ('Administrador','Coordenação'))`.
  DELETE bloqueado (bulletins; itens caem por cascade ao deletar BI, o que não ocorre no MVP).
- `bulletin_events`: SELECT autenticado; INSERT com `created_by = auth.uid()` e perfil
  admin-like; sem UPDATE/DELETE (append-only).
- Índices: `idx_bulletin_items_bulletin (bulletin_id, part_number, display_order)`,
  `idx_bulletins_year (year, number)`, `idx_bulletin_events_bulletin (bulletin_id, created_at desc)`.
- Triggers `set_updated_at` em `bulletins` e `bulletin_items` (reusa `public.tg_set_updated_at()`).

**Invariante (DT-003/DT-006):** `bulletin_items.content` recebe **apenas**
`records.publication_text`. Nunca `original_description`, `coordination_note`, nem dados
de registros restritos/internos.

## 2. Rotas e Server Actions

```
app/boletins/
  layout.tsx              — guard Coordenação/Administrador (espelha app/validacao/layout.tsx)
  page.tsx                — lista de BIs + form de criação (US-023)
  actions.ts              — createBulletin
  [id]/
    page.tsx              — detalhe/gestão do BI (cabeçalho, itens, ações de status, histórico)
    actions.ts            — assembleItems, toggleItemVisible, reorderItem,
                            updateItemContent, approveBulletin, reopenBulletin, cancelBulletin
    previa/
      page.tsx            — prévia HTML do documento (US-025)
```

### Server Actions

| Action | Arquivo | Efeito | Pré-condição |
|---|---|---|---|
| `createBulletin` | `actions.ts` | Cria BI `rascunho`. Deriva `type` (`start_date===end_date` → `diário`, senão `período`). Valida número/ano/datas. Erro amigável em número duplicado (viola `unique`). Evento `criado`. | perfil admin-like |
| `assembleItems` | `[id]/actions.ts` | Lê `records` com `status='validado' AND classification='publicável' AND include_in_bulletin=true AND reference_date BETWEEN start AND end`. Insere `bulletin_items` copiando `publication_text→content`, `bulletin_part→part_number`, `reference_date`, `title`, `source_type`, `display_order` sequencial (por parte). Idempotente: **apaga todos os `bulletin_items` do BI e remonta do zero** (só permitido em BI `rascunho`; descarta edições de prévia anteriores — comportamento esperado de "remontar"). | BI `rascunho`, admin-like |
| `toggleItemVisible` | `[id]/actions.ts` | Alterna `visible` de um item. | BI `rascunho` |
| `reorderItem` | `[id]/actions.ts` | Move item para cima/baixo dentro da parte (troca `display_order`). | BI `rascunho` |
| `updateItemContent` | `[id]/actions.ts` | Edita `content` (e opcionalmente `title`) de um item. | BI `rascunho` |
| `approveBulletin` | `[id]/actions.ts` | `rascunho → aprovado`. Grava `approved_by`, `approved_at`. Evento `aprovado`. Após isso, edições de item são bloqueadas. | BI `rascunho`, admin-like, ≥1 item visível |
| `reopenBulletin` | `[id]/actions.ts` | `aprovado → rascunho` (reabertura controlada). Motivo obrigatório. Evento `reaberto`. | BI `aprovado`, admin-like |
| `cancelBulletin` | `[id]/actions.ts` | `→ cancelado`. Evento `cancelado`. | BI não cancelado, admin-like |

Padrões: `"use server"`; helpers `getString/getInteger/getOptionalString/buildQuery/shortError`;
guard via `getCurrentProfileName`/`isAdminLike`; `try/catch`→`redirect(err)`,
sucesso→`revalidatePath`+`redirect(ok)`. Cada transição de status grava `bulletin_events`.

### Constantes compartilhadas
Reusa `BULLETIN_PARTS` de `lib/records/options.ts`. Novo `lib/boletins/status.ts` com os
estados do BI (`rascunho|aprovado|cancelado`), labels das 5 partes e helper de transição
análogo a `lib/validacao/status.ts`.

## 3. UI

### `/boletins` (lista + criar)
Form de criação no topo: número, ano, data de publicação, data inicial, data final
(o `type` é derivado, exibido como informação, não é campo). Tabela de BIs: número/ano,
período, tipo, status (badge), ação "Abrir". Padrão visual de `/cadastros` e `/validacao`.
Badge de status: rascunho=âmbar, aprovado=verde, cancelado=cinza.

### `/boletins/[id]` (detalhe/gestão)
Cabeçalho (número, ano, período, status badge). Botão **"Montar itens"** (`assembleItems`)
quando rascunho. Itens agrupados por parte (1ª…5ª), cada um com: ocultar/mostrar, ↑/↓,
editar texto (`content` em textarea inline). Botões de status conforme estado:
**Aprovar** (confirmação), **Reabrir** (modal com motivo), **Cancelar**. Histórico de
`bulletin_events` ao final. Link **"Ver prévia"**. Quando `aprovado`, itens são read-only.

### `/boletins/[id]/previa` (US-025)
Documento renderizado em HTML, layout A4-like (papel branco, títulos caixa-alta,
espaçamento formal):
- Cabeçalho institucional (ABM/CFO, número/ano, data de publicação, período).
- As **5 partes** em sequência; cada uma lista seus itens `visible` ordenados por
  `display_order`. **Parte sem itens visíveis → "Sem alteração".**
- Lê **exclusivamente** `bulletin_items` (nenhum import de `records`).
- Botão **"Aprovar para PDF"** quando `rascunho`.

## 4. Tratamento de Erros e Invariantes

- Perfil admin-like conferido em toda action.
- `createBulletin`: campos obrigatórios; `end_date >= start_date`; número duplicado no
  ano → mensagem clara (captura violação de `unique(number,year)`).
- Edições de item e `approveBulletin` só sobre BI `rascunho`; estado errado → erro.
- `reopenBulletin` exige motivo (igual à devolução do M4).
- `approveBulletin` exige ao menos 1 item visível.

**Invariantes DT-003/DT-006:**
- `assembleItems` filtra estritamente `validado` + `publicável` + `include_in_bulletin`.
- `content` recebe só `publication_text`; campos sensíveis nunca copiados.
- Prévia lê só `bulletin_items`.
- BI aprovado: itens imutáveis.

## 5. Documentação

Registrar **DT-006** em `Apoio/_decisoes.md`: refinamento do momento de congelamento
(copiado na montagem, imutável na aprovação) + reabertura simples sem versionamento real
no MVP (campo `version` reservado).

## 6. Verificação Manual (checklist de aceite)

1. Criar BI **diário** (start=end) → `type='diário'`, status `rascunho`.
2. Criar BI **por período** (start≠end) → `type='período'`.
3. Criar BI com número/ano já existentes → erro de duplicidade.
4. "Montar itens" → traz apenas registros validados+publicáveis+incluídos do período,
   agrupados nas 5 partes; `content` = `publication_text`.
5. Ocultar um item → some da prévia; reordenar → ordem muda na prévia; editar texto →
   `content` muda (sem afetar `records`).
6. Parte sem itens visíveis → prévia mostra "Sem alteração".
7. Aprovar → status `aprovado`, `approved_by/at` setados, itens read-only, evento `aprovado`.
8. Reabrir (com motivo) → volta a `rascunho`, itens editáveis, evento `reaberto`.
9. Acesso negado a perfil fora de Coordenação/Administrador em `/boletins`.
