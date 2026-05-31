# M8 — Auditoria + Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar os históricos de registros e boletins auditáveis por humanos, registrar a decisão técnica do repositório documental e proteger invariantes críticas com checks automatizados.

**Architecture:** O M8 reutiliza `record_events` e `bulletin_events`, adicionando uma função SQL `SECURITY DEFINER` para resolver autores sem liberar leitura ampla de `public.users`. A UI resolve nomes via `lib/audit/actors.ts`, e os checks automatizados verificam invariantes de PDF, Storage, eventos append-only e uso de service role.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Supabase PostgreSQL/RLS/Storage, Node test runner.

---

## File Structure

- Create: `supabase/migrations/0018_audit_actor_display.sql` — helper SQL seguro para resolver autores de eventos.
- Create: `lib/audit/actors.ts` — formatação e carregamento server-side de autores de auditoria.
- Create: `tests/audit-actors.test.ts` — testes unitários de formatação e deduplicação.
- Create: `tests/security-invariants.test.ts` — checks textuais de invariantes críticas.
- Modify: `app/validacao/[id]/page.tsx` — histórico exibe autor legível.
- Modify: `app/boletins/[id]/page.tsx` — histórico exibe autor legível.
- Modify: `Apoio/_decisoes.md` — registra DT-008.
- Modify: `README.md` — marca M8 como implementado ao final.

---

## Conventions

- Migrations são aplicadas manualmente no Supabase SQL Editor, em ordem.
- Não liberar SELECT amplo em `public.users`.
- Não usar `SUPABASE_SERVICE_ROLE_KEY` no app para resolver nomes.
- Falha ao resolver autores não quebra a página; exibe `Usuário não identificado`.
- Verificação final: `npm test`, `npm run lint`, `npm run build`.

---

### Task 1: SQL Helper Para Autores de Auditoria

**Files:**
- Create: `supabase/migrations/0018_audit_actor_display.sql`

- [ ] **Step 1: Criar migration**

Criar `supabase/migrations/0018_audit_actor_display.sql` com:

```sql
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
```

- [ ] **Step 2: Revisão visual da migration**

Conferir:
- `security definer`;
- `set search_path = public`;
- retorno não inclui email, profile_id, timestamps ou auth metadata;
- `grant execute` apenas para `authenticated`;
- não há `create policy` em `public.users`.

- [ ] **Step 3: Commit**

```powershell
git add supabase/migrations/0018_audit_actor_display.sql
git commit -m "M8: helper SQL para autores de auditoria"
```

---

### Task 2: Lib de Autores de Auditoria com TDD

**Files:**
- Create: `tests/audit-actors.test.ts`
- Create: `lib/audit/actors.ts`

- [ ] **Step 1: Criar teste vermelho**

Criar `tests/audit-actors.test.ts`:

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatAuditActorName,
  uniqueAuditActorIds,
} from "../lib/audit/actors";

test("formats audit actor using war name first", () => {
  assert.equal(
    formatAuditActorName({
      user_id: "00000000-0000-0000-0000-000000000001",
      login: "coord.silva",
      full_name: "Joao da Silva",
      war_name: "SILVA",
      profile_name: "Coordenação",
      active: true,
    }),
    "SILVA",
  );
});

test("falls back to full name, login, then unidentified", () => {
  assert.equal(
    formatAuditActorName({
      user_id: "00000000-0000-0000-0000-000000000002",
      login: "coord.lima",
      full_name: "Maria Lima",
      war_name: "",
      profile_name: "Coordenação",
      active: true,
    }),
    "Maria Lima",
  );

  assert.equal(
    formatAuditActorName({
      user_id: "00000000-0000-0000-0000-000000000003",
      login: "instr.costa",
      full_name: "",
      war_name: null,
      profile_name: "Instrutor",
      active: true,
    }),
    "instr.costa",
  );

  assert.equal(formatAuditActorName(null), "Usuário não identificado");
});

test("deduplicates audit actor ids and removes blanks", () => {
  assert.deepEqual(
    uniqueAuditActorIds([
      "00000000-0000-0000-0000-000000000001",
      null,
      "",
      "00000000-0000-0000-0000-000000000001",
      "00000000-0000-0000-0000-000000000002",
    ]),
    [
      "00000000-0000-0000-0000-000000000001",
      "00000000-0000-0000-0000-000000000002",
    ],
  );
});
```

- [ ] **Step 2: Rodar teste e confirmar falha**

Run:

```powershell
npm test
```

Expected: falha por módulo `../lib/audit/actors` inexistente.

- [ ] **Step 3: Implementar lib**

Criar `lib/audit/actors.ts`:

```ts
import type { SupabaseClient } from "@supabase/supabase-js";

export const UNKNOWN_AUDIT_ACTOR = "Usuário não identificado";

export type AuditActorRow = {
  user_id: string;
  login: string | null;
  full_name: string | null;
  war_name: string | null;
  profile_name: string | null;
  active: boolean | null;
};

export function formatAuditActorName(
  actor: Pick<AuditActorRow, "war_name" | "full_name" | "login"> | null | undefined,
): string {
  if (!actor) return UNKNOWN_AUDIT_ACTOR;

  const name = [actor.war_name, actor.full_name, actor.login]
    .map((value) => value?.trim())
    .find((value): value is string => Boolean(value));

  return name ?? UNKNOWN_AUDIT_ACTOR;
}

export function uniqueAuditActorIds(ids: Array<string | null | undefined>): string[] {
  return Array.from(new Set(ids.filter((id): id is string => Boolean(id?.trim()))));
}

export async function loadAuditActorDisplayMap(
  supabase: SupabaseClient,
  ids: Array<string | null | undefined>,
): Promise<Map<string, string>> {
  const userIds = uniqueAuditActorIds(ids);
  if (userIds.length === 0) return new Map();

  const { data, error } = await supabase.rpc("audit_actor_display_by_ids", {
    p_user_ids: userIds,
  });
  if (error) return new Map();

  const rows = (data ?? []) as AuditActorRow[];
  return new Map(
    rows.map((row) => [row.user_id, formatAuditActorName(row)]),
  );
}
```

- [ ] **Step 4: Rodar teste e confirmar sucesso**

Run:

```powershell
npm test
```

Expected: todos os testes passam, incluindo `tests/audit-actors.test.ts`.

- [ ] **Step 5: Commit**

```powershell
git add lib/audit/actors.ts tests/audit-actors.test.ts
git commit -m "M8: lib de autores de auditoria"
```

---

### Task 3: Autores no Histórico de Validação

**Files:**
- Modify: `app/validacao/[id]/page.tsx`

- [ ] **Step 1: Atualizar imports**

Adicionar:

```ts
import {
  loadAuditActorDisplayMap,
  UNKNOWN_AUDIT_ACTOR,
} from "@/lib/audit/actors";
```

- [ ] **Step 2: Atualizar tipo `EventRow`**

Substituir o tipo por:

```ts
type EventRow = {
  id: string;
  event_type: string;
  from_status: string | null;
  to_status: string;
  note: string;
  created_by: string | null;
  created_at: string;
};
```

- [ ] **Step 3: Selecionar `created_by`**

Substituir:

```ts
.select("id, event_type, from_status, to_status, note, created_at")
```

por:

```ts
.select("id, event_type, from_status, to_status, note, created_by, created_at")
```

- [ ] **Step 4: Resolver autores antes do render**

Logo após:

```ts
const events = (evRaw ?? []) as EventRow[];
```

adicionar:

```ts
const actorNames = await loadAuditActorDisplayMap(
  supabase,
  events.map((ev) => ev.created_by),
);
```

- [ ] **Step 5: Exibir autor no histórico**

Substituir o bloco de data:

```tsx
<div className="text-xs text-gray-500">
  {new Date(ev.created_at).toLocaleString("pt-BR")}
</div>
```

por:

```tsx
<div className="text-xs text-gray-500">
  {new Date(ev.created_at).toLocaleString("pt-BR")} · Autor:{" "}
  {ev.created_by
    ? (actorNames.get(ev.created_by) ?? UNKNOWN_AUDIT_ACTOR)
    : UNKNOWN_AUDIT_ACTOR}
</div>
```

- [ ] **Step 6: Verificar build**

Run:

```powershell
npm run build
```

Expected: build concluído sem erro TypeScript.

- [ ] **Step 7: Commit**

```powershell
git add app/validacao/[id]/page.tsx
git commit -m "M8: exibir autor no histórico de validação"
```

---

### Task 4: Autores no Histórico de Boletins

**Files:**
- Modify: `app/boletins/[id]/page.tsx`

- [ ] **Step 1: Atualizar imports**

Adicionar:

```ts
import {
  loadAuditActorDisplayMap,
  UNKNOWN_AUDIT_ACTOR,
} from "@/lib/audit/actors";
```

- [ ] **Step 2: Atualizar tipo `EventRow`**

Substituir o tipo por:

```ts
type EventRow = {
  id: string;
  event_type: string;
  note: string;
  created_by: string | null;
  created_at: string;
};
```

- [ ] **Step 3: Selecionar `created_by`**

Substituir:

```ts
.select("id, event_type, note, created_at")
```

por:

```ts
.select("id, event_type, note, created_by, created_at")
```

- [ ] **Step 4: Resolver autores antes do render**

Logo após:

```ts
const events = (evRaw ?? []) as EventRow[];
```

adicionar:

```ts
const actorNames = await loadAuditActorDisplayMap(
  supabase,
  events.map((ev) => ev.created_by),
);
```

- [ ] **Step 5: Exibir autor no histórico**

Substituir o bloco de data:

```tsx
<div className="text-xs text-gray-500">
  {new Date(ev.created_at).toLocaleString("pt-BR")}
</div>
```

por:

```tsx
<div className="text-xs text-gray-500">
  {new Date(ev.created_at).toLocaleString("pt-BR")} · Autor:{" "}
  {ev.created_by
    ? (actorNames.get(ev.created_by) ?? UNKNOWN_AUDIT_ACTOR)
    : UNKNOWN_AUDIT_ACTOR}
</div>
```

- [ ] **Step 6: Verificar build**

Run:

```powershell
npm run build
```

Expected: build concluído sem erro TypeScript.

- [ ] **Step 7: Commit**

```powershell
git add app/boletins/[id]/page.tsx
git commit -m "M8: exibir autor no histórico de boletins"
```

---

### Task 5: Checks Automatizados de Segurança

**Files:**
- Create: `tests/security-invariants.test.ts`

- [ ] **Step 1: Criar testes de invariantes**

Criar `tests/security-invariants.test.ts`:

```ts
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const ROOT = process.cwd();

function read(path: string): string {
  return readFileSync(join(ROOT, path), "utf8");
}

function listFiles(dir: string): string[] {
  const absolute = join(ROOT, dir);
  return readdirSync(absolute).flatMap((entry) => {
    const full = join(absolute, entry);
    const relative = join(dir, entry).replaceAll("\\", "/");
    if (statSync(full).isDirectory()) return listFiles(relative);
    return [relative];
  });
}

test("PDF and archive code do not read records directly", () => {
  const files = [
    ...listFiles("lib/pdf").filter((file) => file.endsWith(".ts") || file.endsWith(".tsx")),
    "app/boletins/[id]/pdf/route.ts",
    "app/boletins/[id]/arquivo/route.ts",
  ];

  for (const file of files) {
    assert.doesNotMatch(
      read(file),
      /\.from\(["']records["']\)/,
      `${file} must not query records; DT-003 requires PDF/archive to use bulletins + bulletin_items`,
    );
  }
});

test("event tables remain append-only in migrations", () => {
  const recordEvents = read("supabase/migrations/0013_record_events.sql");
  const bulletinEvents = read("supabase/migrations/0014_bulletins.sql");

  assert.doesNotMatch(
    recordEvents,
    /record_events[^;]*(for update|for delete)/i,
    "record_events must not have UPDATE/DELETE policies",
  );
  assert.doesNotMatch(
    bulletinEvents,
    /bulletin_events[^;]*(for update|for delete)/i,
    "bulletin_events must not have UPDATE/DELETE policies",
  );
});

test("PDF routes keep authenticated admin-like guards", () => {
  for (const file of [
    "app/boletins/[id]/pdf/route.ts",
    "app/boletins/[id]/arquivo/route.ts",
  ]) {
    const source = read(file);
    assert.match(source, /supabase\.auth\.getUser\(\)/, `${file} must check session`);
    assert.match(source, /getCurrentProfileName\(\)/, `${file} must load profile`);
    assert.match(source, /isAdminLike\(profile\)/, `${file} must require Admin/Coordenação`);
  }
});

test("service role key is not used by application code", () => {
  const files = [
    ...listFiles("app"),
    ...listFiles("components"),
    ...listFiles("lib"),
  ].filter((file) => /\.(ts|tsx)$/.test(file));

  for (const file of files) {
    assert.doesNotMatch(
      read(file),
      /SUPABASE_SERVICE_ROLE_KEY/,
      `${file} must not read SUPABASE_SERVICE_ROLE_KEY`,
    );
  }
});
```

- [ ] **Step 2: Rodar teste**

Run:

```powershell
npm test
```

Expected: todos os testes passam.

- [ ] **Step 3: Commit**

```powershell
git add tests/security-invariants.test.ts
git commit -m "M8: checks automatizados de invariantes de segurança"
```

---

### Task 6: DT-008 do Repositório Documental

**Files:**
- Modify: `Apoio/_decisoes.md`

- [ ] **Step 1: Inserir DT-008**

Em `Apoio/_decisoes.md`, substituir a seção:

```markdown
## Próximas decisões esperadas (a registrar quando ocorrerem)

- **DT-008 (M7)** — estratégia do repositório documental: Storage, `pdf_url`, retenção e versionamento real.
```

por:

```markdown
## DT-008 — Repositório documental simples em Storage (M7/M8)

**Status:** ativa
**Marco:** M7/M8
**Data:** 2026-05-31

**Decisão.** O repositório documental do MVP usa um bucket privado do Supabase Storage
chamado `bulletins`. Cada BI aprovado pode ter um PDF oficial vigente arquivado nesse
bucket. A tabela `public.bulletins` guarda os metadados do arquivo vigente em
`pdf_path`, `pdf_generated_at` e `pdf_generated_by`.

O download do arquivo arquivado passa sempre por rota autenticada
`/boletins/[id]/arquivo`, com guarda de perfil Administrador/Coordenação. O bucket não
é público e não há exposição direta de URL pública no MVP.

**Sobrescrita controlada.** Enquanto não houver versionamento real, gerar novamente o
arquivo arquivado do mesmo BI aprovado sobrescreve o caminho vigente (`upsert: true`) e
atualiza os metadados `pdf_*`. Isso é aceitável no MVP porque a reabertura do BI já
registra evento em `bulletin_events`, e o campo `bulletins.version` permanece reservado
para uma fase futura.

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
```

- [ ] **Step 2: Commit**

```powershell
git add Apoio/_decisoes.md
git commit -m "docs: registrar DT-008 repositório documental"
```

---

### Task 7: README Final do M8

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Atualizar estado atual**

Substituir o parágrafo de estado atual por:

```markdown
> **Estado atual:** Marco **M8 — Auditoria + hardening** implementado. Já implementados: fundação técnica + auth (M0), cadastros institucionais (M1), escalas (M2), Livro de Dia + tabela central `records` (M3), validação da Coordenação (M4), criação/montagem/aprovação de Boletins Internos com prévia HTML (M5), download de PDF formal a partir de `bulletin_items` congelados (M6), arquivamento simples do PDF em Supabase Storage (M7) e auditoria operacional com autores legíveis e checks de invariantes (M8). Veja `Apoio/_decisoes.md` (DT-003/DT-006/DT-007/DT-008) para as invariantes do fluxo documental.
```

- [ ] **Step 2: Adicionar migration 0018**

Na lista de migrations, depois de `0017_bulletin_pdf_archive.sql`, adicionar:

```markdown
   - `supabase/migrations/0018_audit_actor_display.sql`
```

- [ ] **Step 3: Atualizar roadmap**

Substituir:

```markdown
| M8    | Auditoria + hardening                                          | pendente |
```

por:

```markdown
| M8    | Auditoria + hardening                                          | implementado |
```

- [ ] **Step 4: Commit**

```powershell
git add README.md
git commit -m "docs: atualizar README para M8"
```

---

### Task 8: Verificação Final

**Files:** nenhum arquivo novo.

- [ ] **Step 1: Rodar testes**

Run:

```powershell
npm test
```

Expected: todos os testes passam.

- [ ] **Step 2: Rodar lint**

Run:

```powershell
npm run lint
```

Expected: exit code 0.

- [ ] **Step 3: Rodar build**

Run:

```powershell
npm run build
```

Expected: build concluído, rotas `/validacao/[id]`, `/boletins/[id]`, `/boletins/[id]/pdf` e `/boletins/[id]/arquivo` presentes.

- [ ] **Step 4: Checklist manual**

No Supabase SQL Editor, aplicar `supabase/migrations/0018_audit_actor_display.sql`.

Depois, com `npm run dev`:
- abrir um registro em `/validacao/[id]` com eventos e confirmar autor legível no histórico;
- abrir um BI em `/boletins/[id]` com eventos e confirmar autor legível no histórico;
- confirmar que `/boletins/[id]/pdf` continua baixando PDF para BI aprovado;
- confirmar que `/boletins/[id]/arquivo` continua baixando PDF arquivado;
- testar um usuário sem perfil Administrador/Coordenação e confirmar redirecionamento/403 nas áreas restritas.

- [ ] **Step 5: Commit de verificação, se houver docs de evidência**

Se registrar evidência manual em docs, commitar:

```powershell
git add docs README.md Apoio/_decisoes.md
git commit -m "docs: registrar verificação M8 auditoria e hardening"
```

Caso não haja arquivo novo de evidência, não criar commit vazio.

---

## Self-Review

**Spec coverage:**
- Autor legível em `record_events` e `bulletin_events` → Tasks 1–4.
- `public.users` sem leitura ampla → Task 1.
- DT-008 → Task 6.
- Checks de PDF/arquivo/eventos/service role → Task 5.
- README final → Task 7.
- Verificação automatizada e manual → Task 8.

**Placeholder scan:** não há `TBD`, `TODO`, “implementar depois” ou steps sem conteúdo concreto.

**Type consistency:** `audit_actor_display_by_ids` retorna `user_id`, `login`, `full_name`, `war_name`, `profile_name`, `active`; `AuditActorRow` usa os mesmos nomes; as páginas usam `created_by` como chave do mapa retornado por `loadAuditActorDisplayMap`.
