# M4 — Validação da Coordenação — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir a camada de validação da Coordenação — fila de registros pendentes com filtros, ações de validar/devolver/classificar, edição do texto de publicação, e histórico auditável de transições.

**Architecture:** Nova seção de nível raiz `/validacao` (guard Coordenação/Administrador), espelhando o padrão de `/cadastros` e `/escalas`. Server Actions controlam as transições de status sobre a tabela `public.records` (já existente) e gravam cada transição numa nova tabela imutável `public.record_events`. Sem alteração de schema em `records` — todos os campos necessários já existem. Sem tabelas de BI (escopo estrito; ficam para M5).

**Tech Stack:** Next.js 16 (App Router, Server Actions), React 19, TypeScript strict, Supabase (PostgreSQL + RLS), Tailwind CSS v4.

**Spec:** `docs/superpowers/specs/2026-05-28-m4-validacao-coordenacao-design.md`

---

## Convenções deste projeto (leia antes de começar)

- **Não há framework de testes.** A verificação automatizada de cada task é `npm run lint` (ESLint) e, nas tasks de UI/tipos, `npm run build` (que roda o type-check do TypeScript strict via Next). A verificação funcional é **manual**, via checklist na Task 10 (decisão registrada na spec, consistente com DT-003 que adia testes automatizados para M5+).
- **Server Actions** seguem o padrão: `"use server"`, validação via helpers de `@/lib/cadastros/helpers` (`getString`, `getInteger`, `getOptionalString`, `buildQuery`, `shortError`), `try/catch` que em erro faz `redirect(... err=...)`, e em sucesso `revalidatePath` + `redirect(... ok=...)`.
- **Perfil/guard**: `getCurrentProfileName()` e `isAdminLike()` de `@/lib/auth/profile`.
- **Cliente Supabase server**: `createSupabaseServerClient` de `@/lib/supabase/server`.
- **Componentes de UI**: `PageHeader`, `FormFeedback`, `SubmitButton`, `TextField`, `SelectField`, `TextAreaField` de `@/components/admin/*`.
- **Migrations** são aplicadas manualmente no SQL Editor do Supabase (ver README). O arquivo só precisa estar correto e versionado.

---

## File Structure

**Criar:**
- `supabase/migrations/0013_record_events.sql` — tabela de histórico imutável + RLS.
- `lib/records/options.ts` — opções de domínio compartilhadas (partes do BI, classificações). Fonte única de verdade.
- `lib/validacao/status.ts` — lógica de transição de status da validação (estados da fila, transições válidas, mapeamento para `event_type`).
- `components/admin/RecordStatusBadge.tsx` — badge de status do registro, extraído do inline de `livro-de-dia` para reuso.
- `app/validacao/layout.tsx` — guard (Coordenação/Administrador).
- `app/validacao/page.tsx` — fila de registros com filtros (US-018).
- `app/validacao/[id]/page.tsx` — detalhe + painel de ação (US-019/020/021/022).
- `app/validacao/[id]/actions.ts` — Server Actions de validação.

**Modificar:**
- `app/livro-de-dia/[id]/page.tsx` — passar a importar `BULLETIN_PARTS` de `lib/records/options.ts` e usar `RecordStatusBadge` (remove duplicação).
- `app/dashboard/page.tsx` — adicionar card de navegação para `/validacao`.

---

## Task 1: Migration `record_events`

**Files:**
- Create: `supabase/migrations/0013_record_events.sql`

- [ ] **Step 1: Escrever a migration**

Conteúdo completo de `supabase/migrations/0013_record_events.sql`:

```sql
-- =============================================================================
-- 0013_record_events.sql — Histórico imutável de transições de registros (M4)
-- =============================================================================
-- US-019/US-020: a validação registra usuário, data e hora; a devolução exige
-- motivo e o histórico deve ser preservado. Em vez de sobrescrever
-- records.coordination_note, cada transição vira uma linha imutável aqui.
--
-- Imutável: há policies de SELECT e INSERT, mas NENHUMA de UPDATE/DELETE.
-- Não há updated_at nem trigger — uma linha nunca muda depois de criada.
-- =============================================================================

create table if not exists public.record_events (
  id          uuid        primary key default gen_random_uuid(),
  record_id   uuid        not null references public.records(id) on delete cascade,
  event_type  text        not null,
  from_status text,
  to_status   text        not null,
  note        text        not null default '',
  created_by  uuid        not null references auth.users(id),
  created_at  timestamptz not null default now(),

  constraint record_events_type_chk check (
    event_type in (
      'enviado', 'em_revisao', 'devolvido', 'validado', 'cancelado', 'arquivado'
    )
  )
);

comment on table public.record_events is
  'Histórico imutável de transições de status de records (M4). Append-only.';

create index if not exists idx_record_events_record
  on public.record_events (record_id, created_at desc);

alter table public.record_events enable row level security;

-- Leitura: qualquer autenticado (a visibilidade do registro pai já é filtrada
-- pela RLS de public.records; o histórico não expõe PII além do uuid do autor).
drop policy if exists "record_events_read" on public.record_events;
create policy "record_events_read"
  on public.record_events for select
  to authenticated
  using (true);

-- Inserção: apenas perfis que podem causar transições, e o autor declarado
-- precisa ser o próprio usuário (anti-forja).
drop policy if exists "record_events_insert" on public.record_events;
create policy "record_events_insert"
  on public.record_events for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and public.user_profile_name() in (
      'Administrador',
      'Coordenação',
      'Aluno de Dia ao Corpo de Alunos',
      'Aluno de Dia ao Pelotão',
      'Instrutor'
    )
  );

-- Sem policies de UPDATE/DELETE → tabela append-only (imutável).
```

- [ ] **Step 2: Verificar a sintaxe SQL com o parser do Postgres (se disponível) ou revisão visual**

Run (se `psql` estiver instalado e apontado para o projeto):
```
psql "$DATABASE_URL" -f supabase/migrations/0013_record_events.sql --single-transaction --set ON_ERROR_STOP=1
```
Expected: `CREATE TABLE`, `COMMENT`, `CREATE INDEX`, `ALTER TABLE`, `CREATE POLICY` (x2) sem erro.

Se `psql`/`DATABASE_URL` não estiverem disponíveis no ambiente local, pule a execução: a migration é aplicada manualmente no Supabase SQL Editor (Task 10). Confira visualmente que: (a) referencia `public.records(id)`, (b) usa `public.user_profile_name()` (helper de DT-004), (c) não há policy de UPDATE/DELETE.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0013_record_events.sql
git commit -m "M4: migration record_events (histórico imutável de transições)"
```

---

## Task 2: Opções de domínio compartilhadas

Extrai constantes de domínio que hoje vivem inline em `livro-de-dia` para uma fonte única, reusada pela tela de validação. Mantém as 5 partes do BI em sincronia em todo o sistema.

**Files:**
- Create: `lib/records/options.ts`
- Modify: `app/livro-de-dia/[id]/page.tsx` (substituir o `const BULLETIN_PARTS` local por import)

- [ ] **Step 1: Criar `lib/records/options.ts`**

Conteúdo completo:

```ts
/**
 * Opções de domínio compartilhadas para registros (records).
 * Fonte única de verdade — usada por Livro de Dia e Validação.
 */

/** As 5 partes do Boletim Interno (Modelo §12). */
export const BULLETIN_PARTS: { value: string; label: string }[] = [
  { value: "1", label: "1ª — Legislação/Ensino" },
  { value: "2", label: "2ª — Alteração de Pessoal" },
  { value: "3", label: "3ª — Assuntos Gerais" },
  { value: "4", label: "4ª — Justiça/Disciplina" },
  { value: "5", label: "5ª — Comunicação/Avisos" },
];

/** Classificações possíveis de um registro (records.classification). */
export const CLASSIFICATIONS: { value: string; label: string }[] = [
  { value: "publicável", label: "Publicável (entra no BI)" },
  { value: "interno", label: "Interno (não publica)" },
  { value: "restrito", label: "Restrito (acesso limitado)" },
];

/** Apenas registros publicáveis podem entrar no Boletim Interno (DT-003). */
export function canEnterBulletin(classification: string | null): boolean {
  return classification === "publicável";
}
```

- [ ] **Step 2: Refatorar `livro-de-dia` para importar `BULLETIN_PARTS`**

Em `app/livro-de-dia/[id]/page.tsx`, adicione o import junto aos demais imports do topo:

```ts
import { BULLETIN_PARTS } from "@/lib/records/options";
```

E **remova** o bloco local (linhas que definem `const BULLETIN_PARTS = [ ... ];`):

```ts
const BULLETIN_PARTS = [
  { value: "1", label: "1ª — Legislação/Ensino" },
  { value: "2", label: "2ª — Alteração de Pessoal" },
  { value: "3", label: "3ª — Assuntos Gerais" },
  { value: "4", label: "4ª — Justiça/Disciplina" },
  { value: "5", label: "5ª — Comunicação/Avisos" },
];
```

(O restante do arquivo usa `BULLETIN_PARTS` normalmente — agora vem do import.)

- [ ] **Step 3: Verificar lint e build**

Run: `npm run lint`
Expected: sem erros.

Run: `npm run build`
Expected: build conclui sem erros de tipo. (`livro-de-dia` continua compilando com o import.)

- [ ] **Step 4: Commit**

```bash
git add lib/records/options.ts app/livro-de-dia/[id]/page.tsx
git commit -m "M4: extrai opções de domínio de records para lib compartilhada"
```

---

## Task 3: Componente `RecordStatusBadge`

Extrai o badge de status (hoje inline em `livro-de-dia`) para um componente reusável pela tela de validação. Cobre todos os estados do ciclo de `records`.

**Files:**
- Create: `components/admin/RecordStatusBadge.tsx`
- Modify: `app/livro-de-dia/[id]/page.tsx` (usar o componente, remover a função local `recordStatusBadge`)

- [ ] **Step 1: Criar `components/admin/RecordStatusBadge.tsx`**

Conteúdo completo:

```tsx
/**
 * Badge de status de um registro (records.status).
 * Cobre todo o ciclo documental. Usado em Livro de Dia e Validação.
 */

const STATUS_CLASSES: { [k: string]: string } = {
  rascunho: "bg-gray-100 text-gray-700 ring-gray-200",
  enviado: "bg-blue-50 text-blue-700 ring-blue-200",
  "em revisão": "bg-amber-50 text-amber-700 ring-amber-200",
  "pendente de correção": "bg-orange-50 text-orange-700 ring-orange-200",
  validado: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "incluído no BI": "bg-emerald-100 text-emerald-800 ring-emerald-300",
  interno: "bg-purple-50 text-purple-700 ring-purple-200",
  restrito: "bg-red-50 text-red-700 ring-red-200",
  cancelado: "bg-gray-100 text-gray-500 ring-gray-200",
  arquivado: "bg-gray-100 text-gray-500 ring-gray-200",
};

export function RecordStatusBadge({ status }: { status: string }) {
  const cls = STATUS_CLASSES[status] ?? STATUS_CLASSES.rascunho;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}
    >
      {status}
    </span>
  );
}
```

- [ ] **Step 2: Refatorar `livro-de-dia` para usar o componente**

Em `app/livro-de-dia/[id]/page.tsx`:

Adicione o import:
```tsx
import { RecordStatusBadge } from "@/components/admin/RecordStatusBadge";
```

Remova a função local `recordStatusBadge` inteira (o bloco `function recordStatusBadge(s: string): React.ReactNode { ... }`, incluindo o objeto `map` interno).

Substitua a chamada na tabela:
```tsx
<td className="px-4 py-3">{recordStatusBadge(r.status)}</td>
```
por:
```tsx
<td className="px-4 py-3"><RecordStatusBadge status={r.status} /></td>
```

- [ ] **Step 3: Verificar lint e build**

Run: `npm run lint`
Expected: sem erros (sem variáveis/imports não usados).

Run: `npm run build`
Expected: build conclui sem erros.

- [ ] **Step 4: Commit**

```bash
git add components/admin/RecordStatusBadge.tsx app/livro-de-dia/[id]/page.tsx
git commit -m "M4: extrai RecordStatusBadge para componente reusável"
```

---

## Task 4: Lógica de transição da validação

Encapsula as regras de transição num módulo testável e reusado por actions e UI. Define os estados da fila e o mapeamento de transição → `event_type`.

**Files:**
- Create: `lib/validacao/status.ts`

- [ ] **Step 1: Criar `lib/validacao/status.ts`**

Conteúdo completo:

```ts
/**
 * Regras de transição de status para a Validação da Coordenação (M4).
 *
 * Ciclo coberto nesta fase:
 *   enviado            → em revisão            (markInReview)
 *   em revisão         → validado             (validateRecord)
 *   em revisão         → pendente de correção (returnForCorrection)
 *
 * Cada transição gera uma linha em public.record_events com um event_type.
 */

export type RecordStatus =
  | "rascunho"
  | "enviado"
  | "em revisão"
  | "pendente de correção"
  | "validado"
  | "incluído no BI"
  | "interno"
  | "restrito"
  | "cancelado"
  | "arquivado";

/** Estados que aparecem na fila de validação por padrão (pendentes de ação da Coord). */
export const QUEUE_STATUSES: RecordStatus[] = [
  "enviado",
  "em revisão",
  "pendente de correção",
];

/** Todos os estados, para o filtro de status da fila. */
export const ALL_STATUSES: RecordStatus[] = [
  "rascunho",
  "enviado",
  "em revisão",
  "pendente de correção",
  "validado",
  "incluído no BI",
  "interno",
  "restrito",
  "cancelado",
  "arquivado",
];

/** event_type gravado em record_events para cada transição-alvo. */
export const EVENT_TYPE_BY_TARGET: { [to: string]: string } = {
  "em revisão": "em_revisao",
  validado: "validado",
  "pendente de correção": "devolvido",
};

/**
 * Verifica se uma transição é permitida no fluxo de validação.
 * Lança Error com mensagem clara se não for.
 */
export function assertTransition(from: string, to: RecordStatus): void {
  const allowed: { [from: string]: RecordStatus[] } = {
    enviado: ["em revisão"],
    "em revisão": ["validado", "pendente de correção"],
  };
  const targets = allowed[from] ?? [];
  if (!targets.includes(to)) {
    throw new Error(
      `Transição inválida: "${from}" → "${to}". A partir de "${from}" ` +
        `só é permitido: ${targets.length ? targets.join(", ") : "(nenhuma ação)"}.`,
    );
  }
}
```

- [ ] **Step 2: Verificar lint e build**

Run: `npm run lint`
Expected: sem erros.

Run: `npm run build`
Expected: build conclui sem erros.

- [ ] **Step 3: Commit**

```bash
git add lib/validacao/status.ts
git commit -m "M4: lógica de transição de status da validação"
```

---

## Task 5: Guard da seção `/validacao`

**Files:**
- Create: `app/validacao/layout.tsx`

- [ ] **Step 1: Criar `app/validacao/layout.tsx`**

Conteúdo completo (espelha `app/escalas/layout.tsx`):

```tsx
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfileName, isAdminLike } from "@/lib/auth/profile";

export default async function ValidacaoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Validação é atribuição da Coordenação (e Administrador).
  const profile = await getCurrentProfileName();
  if (!isAdminLike(profile)) redirect("/dashboard");

  return <>{children}</>;
}
```

- [ ] **Step 2: Verificar lint**

Run: `npm run lint`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add app/validacao/layout.tsx
git commit -m "M4: guard da seção /validacao (Coordenação/Administrador)"
```

---

## Task 6: Server Actions de validação

**Files:**
- Create: `app/validacao/[id]/actions.ts`

- [ ] **Step 1: Criar `app/validacao/[id]/actions.ts`**

Conteúdo completo:

```ts
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getString,
  getOptionalString,
  getInteger,
  buildQuery,
  shortError,
} from "@/lib/cadastros/helpers";
import { getCurrentProfileName, isAdminLike } from "@/lib/auth/profile";
import {
  assertTransition,
  EVENT_TYPE_BY_TARGET,
  type RecordStatus,
} from "@/lib/validacao/status";
import { canEnterBulletin } from "@/lib/records/options";

function base(id: string): string {
  return `/validacao/${id}`;
}

/**
 * Carrega o registro, confere perfil admin-like e devolve { supabase, user, record }.
 * Lança Error em caso de problema (perfil, registro inexistente).
 */
async function loadGuarded(recordId: string) {
  const profile = await getCurrentProfileName();
  if (!isAdminLike(profile)) {
    throw new Error("Apenas a Coordenação pode validar registros.");
  }
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão expirada.");

  const { data: record, error } = await supabase
    .from("records")
    .select("id, status")
    .eq("id", recordId)
    .maybeSingle();
  if (error) throw error;
  if (!record) throw new Error("Registro não encontrado.");

  return { supabase, user, record: record as { id: string; status: string } };
}

/** Insere uma linha de histórico para a transição. */
async function logEvent(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  args: {
    recordId: string;
    from: string;
    to: RecordStatus;
    note: string;
    createdBy: string;
  },
) {
  const { error } = await supabase.from("record_events").insert({
    record_id: args.recordId,
    event_type: EVENT_TYPE_BY_TARGET[args.to] ?? args.to,
    from_status: args.from,
    to_status: args.to,
    note: args.note,
    created_by: args.createdBy,
  });
  if (error) throw error;
}

/** enviado → em revisão. */
export async function markInReview(formData: FormData) {
  const id = getString(formData, "id", { required: true });
  try {
    const { supabase, user, record } = await loadGuarded(id);
    assertTransition(record.status, "em revisão");

    const { error } = await supabase
      .from("records")
      .update({ status: "em revisão", reviewed_by: user.id })
      .eq("id", id);
    if (error) throw error;

    await logEvent(supabase, {
      recordId: id,
      from: record.status,
      to: "em revisão",
      note: "",
      createdBy: user.id,
    });
  } catch (e) {
    redirect(`${base(id)}${buildQuery({ err: shortError(e) })}`);
  }
  revalidatePath(base(id));
  redirect(`${base(id)}${buildQuery({ ok: "Registro em revisão." })}`);
}

/**
 * em revisão → validado.
 * Aplica classificação, texto de publicação e (se publicável) inclusão no BI.
 * Invariante DT-003: só "publicável" pode entrar no BI; parte do BI só com inclusão.
 */
export async function validateRecord(formData: FormData) {
  const id = getString(formData, "id", { required: true });
  try {
    const { supabase, user, record } = await loadGuarded(id);
    assertTransition(record.status, "validado");

    const classification = getString(formData, "classification", {
      required: true,
    });
    if (!["publicável", "interno", "restrito"].includes(classification)) {
      throw new Error("Classificação inválida.");
    }
    const publication_text = getString(formData, "publication_text");

    // Inclusão no BI só é possível para publicável (DT-003).
    const wantsInclude = getString(formData, "include_in_bulletin") === "on";
    const include_in_bulletin = canEnterBulletin(classification) && wantsInclude;

    // Parte do BI só faz sentido quando incluído.
    const partRaw = getInteger(formData, "bulletin_part", { min: 1, max: 5 });
    const bulletin_part = include_in_bulletin ? partRaw : null;

    const { error } = await supabase
      .from("records")
      .update({
        status: "validado",
        classification,
        publication_text,
        include_in_bulletin,
        bulletin_part,
        validated_by: user.id,
        validated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) throw error;

    await logEvent(supabase, {
      recordId: id,
      from: record.status,
      to: "validado",
      note: include_in_bulletin
        ? `Validado — entra no BI (parte ${bulletin_part ?? "?"}).`
        : `Validado — classificação ${classification}.`,
      createdBy: user.id,
    });
  } catch (e) {
    redirect(`${base(id)}${buildQuery({ err: shortError(e) })}`);
  }
  revalidatePath(base(id));
  redirect(`${base(id)}${buildQuery({ ok: "Registro validado." })}`);
}

/** em revisão → pendente de correção (motivo obrigatório). */
export async function returnForCorrection(formData: FormData) {
  const id = getString(formData, "id", { required: true });
  try {
    const { supabase, user, record } = await loadGuarded(id);
    assertTransition(record.status, "pendente de correção");

    const note = getString(formData, "note", { required: true });

    const { error } = await supabase
      .from("records")
      .update({ status: "pendente de correção", coordination_note: note })
      .eq("id", id);
    if (error) throw error;

    await logEvent(supabase, {
      recordId: id,
      from: record.status,
      to: "pendente de correção",
      note,
      createdBy: user.id,
    });
  } catch (e) {
    redirect(`${base(id)}${buildQuery({ err: shortError(e) })}`);
  }
  revalidatePath(base(id));
  redirect(`${base(id)}${buildQuery({ ok: "Registro devolvido para correção." })}`);
}

/** Edição do texto de publicação sem transição de status (US-022). */
export async function updatePublicationText(formData: FormData) {
  const id = getString(formData, "id", { required: true });
  try {
    const profile = await getCurrentProfileName();
    if (!isAdminLike(profile)) {
      throw new Error("Apenas a Coordenação pode editar o texto de publicação.");
    }
    const publication_text = getOptionalString(formData, "publication_text") ?? "";
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("records")
      .update({ publication_text })
      .eq("id", id);
    if (error) throw error;
  } catch (e) {
    redirect(`${base(id)}${buildQuery({ err: shortError(e) })}`);
  }
  revalidatePath(base(id));
  redirect(`${base(id)}${buildQuery({ ok: "Texto de publicação salvo." })}`);
}
```

- [ ] **Step 2: Verificar lint e build**

Run: `npm run lint`
Expected: sem erros.

Run: `npm run build`
Expected: erro de build esperado neste ponto: Next pode reclamar que a rota `app/validacao/[id]/actions.ts` não tem `page.tsx` irmã? Não — Server Actions em arquivo `actions.ts` não geram rota e não exigem `page`. O build deve concluir sem erros. Se houver erro de "module not found" para `@/lib/validacao/status` ou `@/lib/records/options`, confirme que as Tasks 2 e 4 foram concluídas.

- [ ] **Step 3: Commit**

```bash
git add app/validacao/[id]/actions.ts
git commit -m "M4: server actions de validação (validar/devolver/revisar/texto)"
```

---

## Task 7: Fila de registros (`/validacao`)

US-018 — tela com filtros (data, tipo, status, pelotão) destacando pendentes.

**Files:**
- Create: `app/validacao/page.tsx`

- [ ] **Step 1: Criar `app/validacao/page.tsx`**

Conteúdo completo:

```tsx
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/PageHeader";
import { FormFeedback } from "@/components/admin/FormFeedback";
import { RecordStatusBadge } from "@/components/admin/RecordStatusBadge";
import { QUEUE_STATUSES, ALL_STATUSES } from "@/lib/validacao/status";

type Row = {
  id: string;
  record_type: string;
  reference_date: string;
  title: string;
  original_description: string;
  classification: string | null;
  status: string;
  platoon_id: string | null;
  student: { war_name: string; student_number: number } | { war_name: string; student_number: number }[] | null;
  platoon: { name: string } | { name: string }[] | null;
};

type Platoon = { id: string; name: string };

const RECORD_TYPE_OPTIONS = [
  "falta", "atraso", "baixa", "dispensa", "apresentação", "reapresentação",
  "instrução ministrada", "alteração de material", "alteração de QTS",
  "missão interna", "missão externa", "ocorrência disciplinar",
  "elogio", "recompensa", "punição", "aviso",
  "prescrição da Coordenação", "outro",
];

function pickOne<T>(v: T | T[] | null): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

function studentLabel(r: Row): string {
  const s = pickOne(r.student);
  if (!s) return "—";
  return `#${s.student_number} ${s.war_name}`;
}

function platoonLabel(r: Row): string {
  const p = pickOne(r.platoon);
  return p?.name ?? "—";
}

type SearchParams = Promise<{
  date?: string;
  type?: string;
  status?: string;
  platoon?: string;
  ok?: string;
  err?: string;
}>;

export default async function ValidacaoQueuePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { date, type, status, platoon, ok, err } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const { data: plaRaw } = await supabase
    .from("platoons")
    .select("id, name")
    .eq("active", true)
    .order("name");
  const platoons = (plaRaw ?? []) as Platoon[];

  let query = supabase
    .from("records")
    .select(
      `id, record_type, reference_date, title, original_description, classification,
       status, platoon_id,
       student:students(war_name, student_number),
       platoon:platoons(name)`,
    )
    .order("reference_date", { ascending: false })
    .order("created_at", { ascending: false });

  // Filtro de status: específico, ou o conjunto padrão da fila.
  if (status) {
    query = query.eq("status", status);
  } else {
    query = query.in("status", QUEUE_STATUSES);
  }
  if (date) query = query.eq("reference_date", date);
  if (type) query = query.eq("record_type", type);
  if (platoon) query = query.eq("platoon_id", platoon);

  const { data: rowsRaw } = await query;
  const rows = (rowsRaw ?? []) as unknown as Row[];

  return (
    <div>
      <PageHeader
        title="Validação"
        description="Registros pendentes de revisão da Coordenação."
      >
        <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
          ← Dashboard
        </Link>
      </PageHeader>

      <FormFeedback message={ok ?? null} variant="success" />
      <FormFeedback message={err ?? null} variant="error" />

      {/* Filtros */}
      <form
        method="get"
        className="mb-4 mt-4 grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-5"
      >
        <div>
          <label htmlFor="date" className="block text-xs font-medium text-slate-700">
            Data
          </label>
          <input
            id="date"
            name="date"
            type="date"
            defaultValue={date ?? ""}
            className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          />
        </div>
        <div>
          <label htmlFor="type" className="block text-xs font-medium text-slate-700">
            Tipo
          </label>
          <select
            id="type"
            name="type"
            defaultValue={type ?? ""}
            className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          >
            <option value="">Todos</option>
            {RECORD_TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="status" className="block text-xs font-medium text-slate-700">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={status ?? ""}
            className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          >
            <option value="">Pendentes (padrão)</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="platoon" className="block text-xs font-medium text-slate-700">
            Pelotão
          </label>
          <select
            id="platoon"
            name="platoon"
            defaultValue={platoon ?? ""}
            className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          >
            <option value="">Todos</option>
            {platoons.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Filtrar
          </button>
          <Link
            href="/validacao"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Limpar
          </Link>
        </div>
      </form>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Aluno</th>
              <th className="px-4 py-3">Pelotão</th>
              <th className="px-4 py-3">Título / Descrição</th>
              <th className="px-4 py-3">Classificação</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                  Nenhum registro para os filtros atuais.
                </td>
              </tr>
            )}
            {rows.map((r) => {
              const needsAttention =
                r.status === "enviado" || r.status === "pendente de correção";
              return (
                <tr key={r.id} className={needsAttention ? "bg-amber-50/40" : undefined}>
                  <td className="px-4 py-3 font-mono text-gray-700">{r.reference_date}</td>
                  <td className="px-4 py-3 text-gray-700">{r.record_type}</td>
                  <td className="px-4 py-3 text-gray-700">{studentLabel(r)}</td>
                  <td className="px-4 py-3 text-gray-700">{platoonLabel(r)}</td>
                  <td className="px-4 py-3 text-gray-900">
                    {r.title && <span className="font-medium">{r.title}</span>}
                    {r.title && r.original_description && <br />}
                    <span className="text-gray-600">
                      {r.original_description.slice(0, 120)}
                      {r.original_description.length > 120 ? "…" : ""}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{r.classification ?? "—"}</td>
                  <td className="px-4 py-3">
                    <RecordStatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/validacao/${r.id}`}
                      className="text-sm font-medium text-slate-900 hover:underline"
                    >
                      Revisar
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar lint e build**

Run: `npm run lint`
Expected: sem erros.

Run: `npm run build`
Expected: build conclui sem erros; a rota `/validacao` aparece na lista de rotas geradas.

- [ ] **Step 3: Commit**

```bash
git add app/validacao/page.tsx
git commit -m "M4: fila de validação com filtros (US-018)"
```

---

## Task 8: Detalhe + painel de ação (`/validacao/[id]`)

US-019/020/021/022 — duas colunas: registro (somente leitura) + histórico; painel de ação.

**Files:**
- Create: `app/validacao/[id]/page.tsx`

- [ ] **Step 1: Criar `app/validacao/[id]/page.tsx`**

Conteúdo completo:

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/PageHeader";
import { FormFeedback } from "@/components/admin/FormFeedback";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { SelectField, TextField, TextAreaField } from "@/components/admin/Field";
import { RecordStatusBadge } from "@/components/admin/RecordStatusBadge";
import { BULLETIN_PARTS, CLASSIFICATIONS } from "@/lib/records/options";
import {
  markInReview,
  validateRecord,
  returnForCorrection,
  updatePublicationText,
} from "./actions";

type RecordDetail = {
  id: string;
  record_type: string;
  reference_date: string;
  title: string;
  original_description: string;
  publication_text: string;
  classification: string | null;
  status: string;
  include_in_bulletin: boolean;
  bulletin_part: number | null;
  coordination_note: string;
  validated_at: string | null;
  student: { war_name: string; student_number: number } | { war_name: string; student_number: number }[] | null;
  platoon: { name: string } | { name: string }[] | null;
  discipline: { name: string } | { name: string }[] | null;
};

type EventRow = {
  id: string;
  event_type: string;
  from_status: string | null;
  to_status: string;
  note: string;
  created_at: string;
};

function pickOne<T>(v: T | T[] | null): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

type SearchParams = Promise<{ ok?: string; err?: string }>;

export default async function ValidacaoDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const { ok, err } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const { data: rec } = await supabase
    .from("records")
    .select(
      `id, record_type, reference_date, title, original_description, publication_text,
       classification, status, include_in_bulletin, bulletin_part, coordination_note,
       validated_at,
       student:students(war_name, student_number),
       platoon:platoons(name),
       discipline:disciplines(name)`,
    )
    .eq("id", id)
    .maybeSingle();

  if (!rec) notFound();
  const r = rec as unknown as RecordDetail;

  const { data: evRaw } = await supabase
    .from("record_events")
    .select("id, event_type, from_status, to_status, note, created_at")
    .eq("record_id", id)
    .order("created_at", { ascending: false });
  const events = (evRaw ?? []) as EventRow[];

  const student = pickOne(r.student);
  const platoon = pickOne(r.platoon);
  const discipline = pickOne(r.discipline);

  const isReviewing = r.status === "em revisão";
  const isSubmitted = r.status === "enviado";

  return (
    <div>
      <PageHeader title={`Registro — ${r.record_type}`} description={`Data: ${r.reference_date}`}>
        <Link href="/validacao" className="text-sm text-gray-600 hover:text-gray-900">
          ← Fila
        </Link>
      </PageHeader>

      <div className="mb-4 flex items-center gap-2">
        <span className="text-xs text-gray-500">Status:</span>
        <RecordStatusBadge status={r.status} />
      </div>

      <FormFeedback message={ok ?? null} variant="success" />
      <FormFeedback message={err ?? null} variant="error" />

      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Coluna esquerda: registro (somente leitura) + histórico */}
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="text-sm font-medium uppercase tracking-wide text-gray-500">
              Registro original
            </h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-gray-500">Título</dt>
                <dd className="font-medium text-gray-900">{r.title || "—"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Aluno</dt>
                <dd className="text-gray-900">
                  {student ? `#${student.student_number} ${student.war_name}` : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Pelotão</dt>
                <dd className="text-gray-900">{platoon?.name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Disciplina</dt>
                <dd className="text-gray-900">{discipline?.name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Descrição original (preservada)</dt>
                <dd className="whitespace-pre-wrap text-gray-900">
                  {r.original_description}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="text-sm font-medium uppercase tracking-wide text-gray-500">
              Histórico
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              {events.length === 0 && (
                <li className="text-gray-500">Sem eventos registrados.</li>
              )}
              {events.map((ev) => (
                <li key={ev.id} className="border-l-2 border-gray-200 pl-3">
                  <div className="font-medium text-gray-900">
                    {ev.from_status ? `${ev.from_status} → ` : ""}
                    {ev.to_status}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(ev.created_at).toLocaleString("pt-BR")}
                  </div>
                  {ev.note && (
                    <div className="mt-1 text-gray-700">{ev.note}</div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Coluna direita: painel de ação */}
        <div className="space-y-6">
          {isSubmitted && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="text-sm font-medium uppercase tracking-wide text-gray-500">
                Iniciar revisão
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Coloque o registro em revisão para validar ou devolver.
              </p>
              <form action={markInReview} className="mt-4">
                <input type="hidden" name="id" value={r.id} />
                <SubmitButton>Colocar em revisão</SubmitButton>
              </form>
            </div>
          )}

          {/* Texto de publicação (US-022) — editável quando em revisão. */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="text-sm font-medium uppercase tracking-wide text-gray-500">
              Texto para o BI
            </h3>
            <form action={updatePublicationText} className="mt-4 space-y-3">
              <input type="hidden" name="id" value={r.id} />
              <TextAreaField
                label="Texto de publicação"
                name="publication_text"
                defaultValue={r.publication_text}
                rows={4}
                hint="Editado pela Coordenação. Não altera a descrição original."
              />
              <SubmitButton>Salvar texto</SubmitButton>
            </form>
          </div>

          {/* Validar / Devolver — apenas quando em revisão (US-019/020/021). */}
          {isReviewing && (
            <>
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <h3 className="text-sm font-medium uppercase tracking-wide text-gray-500">
                  Validar registro
                </h3>
                <form action={validateRecord} className="mt-4 space-y-4">
                  <input type="hidden" name="id" value={r.id} />
                  <SelectField
                    label="Classificação"
                    name="classification"
                    required
                    options={CLASSIFICATIONS}
                    defaultValue={r.classification ?? ""}
                  />
                  <TextAreaField
                    label="Texto de publicação"
                    name="publication_text"
                    defaultValue={r.publication_text}
                    rows={3}
                    hint="Confirme o texto que irá ao BI (se publicável)."
                  />
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      name="include_in_bulletin"
                      defaultChecked={r.include_in_bulletin}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    Incluir no Boletim Interno (apenas se publicável)
                  </label>
                  <SelectField
                    label="Parte do BI"
                    name="bulletin_part"
                    options={BULLETIN_PARTS}
                    defaultValue={
                      r.bulletin_part != null ? String(r.bulletin_part) : ""
                    }
                    hint="Aplicada apenas quando incluído no BI."
                  />
                  <SubmitButton>Validar</SubmitButton>
                </form>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <h3 className="text-sm font-medium uppercase tracking-wide text-gray-500">
                  Devolver para correção
                </h3>
                <form action={returnForCorrection} className="mt-4 space-y-3">
                  <input type="hidden" name="id" value={r.id} />
                  <TextAreaField
                    label="Motivo da devolução"
                    name="note"
                    required
                    rows={3}
                    hint="Obrigatório. Fica registrado no histórico."
                  />
                  <SubmitButton>Devolver</SubmitButton>
                </form>
              </div>
            </>
          )}

          {r.status === "validado" && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-800">
              Registro validado
              {r.validated_at
                ? ` em ${new Date(r.validated_at).toLocaleString("pt-BR")}`
                : ""}
              .{" "}
              {r.include_in_bulletin
                ? `Marcado para o BI (parte ${r.bulletin_part ?? "?"}).`
                : "Não entra no BI."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar lint e build**

Run: `npm run lint`
Expected: sem erros.

Run: `npm run build`
Expected: build conclui sem erros; rota `/validacao/[id]` listada.

- [ ] **Step 3: Commit**

```bash
git add app/validacao/[id]/page.tsx
git commit -m "M4: detalhe de validação com painel de ação e histórico (US-019..022)"
```

---

## Task 9: Card de navegação no Dashboard

**Files:**
- Modify: `app/dashboard/page.tsx`

- [ ] **Step 1: Adicionar o card de Validação**

Em `app/dashboard/page.tsx`, o bloco `canManageCadastros` já existe para Cadastros e Escalas. Logo após o card de `/escalas` (o segundo bloco `{canManageCadastros && ( ... )}`), adicione um terceiro card:

```tsx
        {canManageCadastros && (
          <Link
            href="/validacao"
            className="block rounded-xl border border-gray-200 bg-white p-6 transition hover:border-gray-900 hover:shadow-sm"
          >
            <h3 className="text-base font-semibold text-gray-900">Validação</h3>
            <p className="mt-1 text-sm text-gray-500">
              Revisar, validar e classificar registros para o BI.
            </p>
          </Link>
        )}
```

- [ ] **Step 2: Atualizar o subtítulo do dashboard**

Na mesma página, troque a linha:
```tsx
          Marco M1 — cadastros institucionais disponíveis.
```
por:
```tsx
          Marco M4 — validação da Coordenação disponível.
```

- [ ] **Step 3: Verificar lint e build**

Run: `npm run lint`
Expected: sem erros.

Run: `npm run build`
Expected: build conclui sem erros.

- [ ] **Step 4: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "M4: card de navegação para /validacao no dashboard"
```

---

## Task 10: Aplicação da migration + verificação manual

Esta task fecha o marco. Aplica a migration no Supabase e roda o checklist de aceite da spec.

**Files:**
- Nenhum arquivo de código novo.

- [ ] **Step 1: Aplicar a migration no Supabase**

No Supabase Dashboard → SQL Editor, cole e execute o conteúdo de
`supabase/migrations/0013_record_events.sql`.
Expected: execução sem erro; a tabela `public.record_events` aparece em Table Editor com RLS habilitada e 2 policies (`record_events_read`, `record_events_insert`).

- [ ] **Step 2: Build final + lint**

Run: `npm run lint`
Expected: sem erros.

Run: `npm run build`
Expected: build completo sem erros; rotas `/validacao` e `/validacao/[id]` presentes.

- [ ] **Step 3: Subir o servidor e rodar o checklist de aceite**

Run: `npm run dev` e acesse http://localhost:3000, logado como `admin` (perfil Administrador) ou um usuário Coordenação.

Pré-condição de dados: tenha pelo menos um Livro de Dia com registros já **enviados** (status `enviado`). Se não houver, abra `/livro-de-dia`, crie/edite um livro, adicione um registro e use "Enviar para revisão" no livro (isso marca os records como `enviado`).

Checklist (marque cada item ao confirmar):
- [ ] `/validacao` lista os registros `enviado` por padrão; linhas `enviado`/`pendente de correção` ficam destacadas.
- [ ] Filtros por data, tipo, status e pelotão alteram a lista; "Limpar" volta ao padrão.
- [ ] Abrir um registro `enviado` → "Colocar em revisão" muda status para `em revisão` e cria evento no histórico.
- [ ] Com o registro `em revisão`, classificar como **restrito** e validar → status `validado`; confirmar que **não** entrou no BI (mesmo marcando o checkbox, `include_in_bulletin` fica `false`).
- [ ] Em outro registro `em revisão`, classificar como **publicável**, marcar "Incluir no BI", escolher parte e validar → `include_in_bulletin = true`, `bulletin_part` preenchido, `validated_at` setado.
- [ ] "Devolver para correção" sem motivo → erro ("Campo \"note\" é obrigatório."). Com motivo → status `pendente de correção`, evento com o motivo no histórico.
- [ ] Editar "Texto para o BI" e salvar → `publication_text` muda, "Descrição original" permanece intacta.
- [ ] Histórico mostra os eventos em ordem cronológica decrescente (transição + motivo + timestamp).
- [ ] Logar com um perfil fora de Coordenação/Administrador (ex.: Instrutor) e acessar `/validacao` → redireciona para `/dashboard`.

> Nota: o histórico não exibe o **nome** do autor de cada evento porque a RLS de `public.users` (DT-002) só permite ler o próprio registro. O `created_by` (uuid) fica gravado para auditoria via service role. Ampliar a leitura de nomes é trabalho de um marco futuro (M8 hardening), fora do escopo do M4.

- [ ] **Step 4: Atualizar a spec com o estado concluído (opcional, recomendado)**

Se desejar, atualize o cabeçalho `Status:` da spec para `implementado` e ajuste o README (seção "Estado atual") para refletir o M4. Commit:

```bash
git add docs/superpowers/specs/2026-05-28-m4-validacao-coordenacao-design.md README.md
git commit -m "docs: M4 concluído — atualiza spec e README"
```

---

## Self-Review (preenchido pelo autor do plano)

**Cobertura da spec:**
- §1 Banco (`record_events` + RLS imutável, sem alteração em `records`) → Task 1. ✓
- §2 Rotas e Server Actions (layout, page, [id]/page, [id]/actions; 4 actions com a tabela de transições) → Tasks 5, 6, 7, 8. ✓
- §3 UI (fila com filtros; detalhe em 2 colunas; badge de status por estado) → Tasks 3, 7, 8. ✓
- §4 Erros e invariantes (perfil conferido; transições validadas; `note` obrigatória; restrito/interno força `include_in_bulletin=false`; `bulletin_part` só com inclusão) → Tasks 4, 6. ✓
- §5 Verificação manual (checklist) → Task 10. ✓
- US-018→022 todas mapeadas (fila/filtros; validar; devolver; classificar; editar texto). ✓

**Placeholders:** nenhum TBD/TODO; todo passo de código mostra conteúdo completo.

**Consistência de tipos/nomes:** `assertTransition`, `EVENT_TYPE_BY_TARGET`, `QUEUE_STATUSES`, `ALL_STATUSES`, `RecordStatus` (lib/validacao/status.ts) usados de forma idêntica em actions e page. `BULLETIN_PARTS`, `CLASSIFICATIONS`, `canEnterBulletin` (lib/records/options.ts) idem. `RecordStatusBadge` com prop `status`. Nomes de campos batem com `0012_records.sql` (`publication_text`, `classification`, `include_in_bulletin`, `bulletin_part`, `coordination_note`, `validated_by`, `validated_at`, `reviewed_by`).
