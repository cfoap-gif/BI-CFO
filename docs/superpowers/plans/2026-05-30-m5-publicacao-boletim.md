# M5 — Publicação do Boletim Interno — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que a Coordenação crie Boletins Internos a partir de registros validados+publicáveis, monte uma prévia editável (5 partes), e aprove/congele a versão final — sem geração de PDF (M6).

**Architecture:** Nova seção de nível raiz `/boletins` (guard Coordenação/Administrador), espelhando `/validacao`. Três tabelas novas: `bulletins`, `bulletin_items` (working set editável da prévia, congelado na aprovação) e `bulletin_events` (audit imutável). Server Actions controlam criação, montagem dos itens (cópia de `records.publication_text`), edições da prévia e transições de status. A prévia é HTML que lê **exclusivamente** `bulletin_items` (invariante DT-003/DT-006).

**Tech Stack:** Next.js 16 (App Router, Server Actions), React 19, TypeScript strict, Supabase (PostgreSQL + RLS), Tailwind CSS v4.

**Spec:** `docs/superpowers/specs/2026-05-30-m5-publicacao-boletim-design.md`

---

## Convenções deste projeto (leia antes de começar)

- **Não há framework de testes.** Verificação automatizada por task = `npm run build` (type-check via Next). NÃO use `npm run lint` — o script está quebrado em todo o projeto (Next 16 removeu `next lint`). Verificação funcional é **manual** (Task 11), consistente com M0–M4.
- **Server Actions** seguem o padrão de `app/validacao/[id]/actions.ts`: `"use server"`, helpers de `@/lib/cadastros/helpers` (`getString`, `getInteger`, `getOptionalString`, `buildQuery`, `shortError`), `try/catch`→`redirect(...err=...)`, sucesso→`revalidatePath`+`redirect(...ok=...)`.
- **Guard/perfil**: `getCurrentProfileName()`/`isAdminLike()` de `@/lib/auth/profile`.
- **Cliente Supabase**: `createSupabaseServerClient` de `@/lib/supabase/server`.
- **Componentes UI**: `PageHeader`, `FormFeedback`, `SubmitButton` (props `variant: "primary"|"secondary"|"danger"`), `TextField`, `SelectField`, `TextAreaField` de `@/components/admin/*`.
- **Migrations** aplicadas manualmente no Supabase SQL Editor, em ordem. O arquivo só precisa estar correto e versionado. UTF-8 com acentos preservados.
- **`records`** (migration 0012) tem: `reference_date`, `title`, `publication_text`, `classification`, `status`, `include_in_bulletin`, `bulletin_part`, `source_type`.

---

## File Structure

**Criar:**
- `supabase/migrations/0014_bulletins.sql` — `bulletins` + `bulletin_items` + `bulletin_events` + RLS + índices + triggers.
- `lib/boletins/status.ts` — estados do BI, labels das 5 partes, helper de transição.
- `components/admin/BulletinStatusBadge.tsx` — badge dos 3 status do BI.
- `app/boletins/layout.tsx` — guard Coordenação/Administrador.
- `app/boletins/page.tsx` — lista + form de criação (US-023).
- `app/boletins/actions.ts` — `createBulletin`.
- `app/boletins/[id]/page.tsx` — gestão do BI (itens, status, histórico).
- `app/boletins/[id]/actions.ts` — `assembleItems`, `toggleItemVisible`, `reorderItem`, `updateItemContent`, `approveBulletin`, `reopenBulletin`, `cancelBulletin`.
- `app/boletins/[id]/previa/page.tsx` — prévia HTML (US-025).

**Modificar:**
- `app/dashboard/page.tsx` — card de navegação para `/boletins`.
- `Apoio/_decisoes.md` — registrar DT-006.
- `README.md` — adicionar `0014` à lista de migrations e atualizar "Estado atual".

---

## Task 1: Migration `bulletins`

**Files:**
- Create: `supabase/migrations/0014_bulletins.sql`

- [ ] **Step 1: Escrever a migration**

Conteúdo completo de `supabase/migrations/0014_bulletins.sql`:

```sql
-- =============================================================================
-- 0014_bulletins.sql — Boletins Internos (M5, Épico 5)
-- =============================================================================
-- DT-003/DT-006: o PDF (M6) e a prévia leem APENAS bulletin_items. Os itens são
-- copiados de records.publication_text na montagem da prévia (BI rascunho) e
-- tornam-se imutáveis na aprovação. Campos sensíveis NUNCA são copiados.
-- Reabertura simples (sem versionamento real no MVP); `version` reservado.
-- =============================================================================

create table if not exists public.bulletins (
  id               uuid        primary key default gen_random_uuid(),
  number           integer     not null,
  year             integer     not null,
  publication_date date,
  start_date       date        not null,
  end_date         date        not null,
  type             text        not null,
  status           text        not null default 'rascunho',
  version          integer     not null default 1,
  created_by       uuid                  references auth.users(id),
  approved_by      uuid                  references auth.users(id),
  approved_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint bulletins_number_year_uq unique (number, year),
  constraint bulletins_type_chk check (type in ('diário', 'período')),
  constraint bulletins_status_chk check (status in ('rascunho', 'aprovado', 'cancelado')),
  constraint bulletins_dates_chk check (end_date >= start_date)
);

comment on table public.bulletins is
  'Boletins Internos (M5). Número único por ano. PDF/prévia leem só bulletin_items.';

create table if not exists public.bulletin_items (
  id             uuid        primary key default gen_random_uuid(),
  bulletin_id    uuid        not null references public.bulletins(id) on delete cascade,
  record_id      uuid                  references public.records(id) on delete set null,
  part_number    integer     not null,
  reference_date date,
  title          text        not null default '',
  content        text        not null default '',
  source_type    text,
  display_order  integer     not null default 0,
  visible        boolean     not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint bulletin_items_part_chk check (part_number between 1 and 5)
);

comment on table public.bulletin_items is
  'Itens do BI (working set da prévia). content = CÓPIA de records.publication_text. Imutável após aprovação (regra na app).';

create table if not exists public.bulletin_events (
  id          uuid        primary key default gen_random_uuid(),
  bulletin_id uuid        not null references public.bulletins(id) on delete cascade,
  event_type  text        not null,
  note        text        not null default '',
  created_by  uuid        not null references auth.users(id),
  created_at  timestamptz not null default now(),

  constraint bulletin_events_type_chk check (
    event_type in ('criado', 'aprovado', 'reaberto', 'cancelado')
  )
);

comment on table public.bulletin_events is
  'Histórico imutável de transições de boletins (M5). Append-only.';

create index if not exists idx_bulletins_year on public.bulletins (year, number);
create index if not exists idx_bulletin_items_bulletin
  on public.bulletin_items (bulletin_id, part_number, display_order);
create index if not exists idx_bulletin_events_bulletin
  on public.bulletin_events (bulletin_id, created_at desc);

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
alter table public.bulletins enable row level security;
alter table public.bulletin_items enable row level security;
alter table public.bulletin_events enable row level security;

-- bulletins
drop policy if exists "bulletins_read" on public.bulletins;
create policy "bulletins_read"
  on public.bulletins for select to authenticated using (true);

drop policy if exists "bulletins_insert" on public.bulletins;
create policy "bulletins_insert"
  on public.bulletins for insert to authenticated
  with check (public.user_profile_name() in ('Administrador', 'Coordenação'));

drop policy if exists "bulletins_update" on public.bulletins;
create policy "bulletins_update"
  on public.bulletins for update to authenticated
  using (public.user_profile_name() in ('Administrador', 'Coordenação'))
  with check (public.user_profile_name() in ('Administrador', 'Coordenação'));

-- bulletin_items
drop policy if exists "bulletin_items_read" on public.bulletin_items;
create policy "bulletin_items_read"
  on public.bulletin_items for select to authenticated using (true);

drop policy if exists "bulletin_items_insert" on public.bulletin_items;
create policy "bulletin_items_insert"
  on public.bulletin_items for insert to authenticated
  with check (public.user_profile_name() in ('Administrador', 'Coordenação'));

drop policy if exists "bulletin_items_update" on public.bulletin_items;
create policy "bulletin_items_update"
  on public.bulletin_items for update to authenticated
  using (public.user_profile_name() in ('Administrador', 'Coordenação'))
  with check (public.user_profile_name() in ('Administrador', 'Coordenação'));

drop policy if exists "bulletin_items_delete" on public.bulletin_items;
create policy "bulletin_items_delete"
  on public.bulletin_items for delete to authenticated
  using (public.user_profile_name() in ('Administrador', 'Coordenação'));

-- bulletin_events (append-only)
drop policy if exists "bulletin_events_read" on public.bulletin_events;
create policy "bulletin_events_read"
  on public.bulletin_events for select to authenticated using (true);

drop policy if exists "bulletin_events_insert" on public.bulletin_events;
create policy "bulletin_events_insert"
  on public.bulletin_events for insert to authenticated
  with check (
    created_by = auth.uid()
    and public.user_profile_name() in ('Administrador', 'Coordenação')
  );

-- ----------------------------------------------------------------------------
-- Triggers updated_at
-- ----------------------------------------------------------------------------
drop trigger if exists set_updated_at_bulletins on public.bulletins;
create trigger set_updated_at_bulletins
  before update on public.bulletins
  for each row execute function public.tg_set_updated_at();

drop trigger if exists set_updated_at_bulletin_items on public.bulletin_items;
create trigger set_updated_at_bulletin_items
  before update on public.bulletin_items
  for each row execute function public.tg_set_updated_at();
```

> Nota: `bulletin_items` PRECISA de policy de DELETE porque `assembleItems` (Task 6) apaga e remonta os itens. `bulletins` não tem DELETE (BIs não são apagados no MVP — usa-se status `cancelado`).

- [ ] **Step 2: Revisão visual / aplicação**

A migration é aplicada manualmente no Supabase SQL Editor (Task 11). Confira visualmente: (a) `unique (number, year)`; (b) FKs para `records` e `auth.users`; (c) RLS usa `public.user_profile_name()`; (d) `bulletin_events` sem UPDATE/DELETE; (e) triggers usam `public.tg_set_updated_at()` (já existe desde 0001).

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0014_bulletins.sql
git commit -m "M5: migration bulletins + bulletin_items + bulletin_events"
```

---

## Task 2: Lib de status do BI + badge

**Files:**
- Create: `lib/boletins/status.ts`
- Create: `components/admin/BulletinStatusBadge.tsx`

- [ ] **Step 1: Criar `lib/boletins/status.ts`**

Conteúdo completo:

```ts
/**
 * Estados e regras de transição de Boletins Internos (M5).
 *
 * Ciclo:
 *   rascunho → aprovado    (approveBulletin)
 *   aprovado → rascunho    (reopenBulletin — reabertura controlada)
 *   rascunho|aprovado → cancelado (cancelBulletin)
 */

export type BulletinStatus = "rascunho" | "aprovado" | "cancelado";

/** Deriva o tipo do BI a partir do período. */
export function bulletinType(startDate: string, endDate: string): "diário" | "período" {
  return startDate === endDate ? "diário" : "período";
}

/** event_type gravado em bulletin_events para cada transição-alvo. */
export const BULLETIN_EVENT_BY_TARGET: { [to: string]: string } = {
  aprovado: "aprovado",
  rascunho: "reaberto",
  cancelado: "cancelado",
};

/**
 * Verifica se uma transição de status é permitida.
 * Lança Error com mensagem clara se não for.
 */
export function assertBulletinTransition(from: string, to: BulletinStatus): void {
  const allowed: { [from: string]: BulletinStatus[] } = {
    rascunho: ["aprovado", "cancelado"],
    aprovado: ["rascunho", "cancelado"],
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

- [ ] **Step 2: Criar `components/admin/BulletinStatusBadge.tsx`**

Conteúdo completo:

```tsx
/**
 * Badge de status de um Boletim Interno (bulletins.status).
 */

const STATUS_CLASSES: { [k: string]: string } = {
  rascunho: "bg-amber-50 text-amber-700 ring-amber-200",
  aprovado: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  cancelado: "bg-gray-100 text-gray-500 ring-gray-200",
};

export function BulletinStatusBadge({ status }: { status: string }) {
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

- [ ] **Step 3: Verificar build**

Run: `npm run build`
Expected: sucesso.

- [ ] **Step 4: Commit**

```bash
git add lib/boletins/status.ts components/admin/BulletinStatusBadge.tsx
git commit -m "M5: lib de status do BI + BulletinStatusBadge"
```

---

## Task 3: Guard da seção `/boletins`

**Files:**
- Create: `app/boletins/layout.tsx`

- [ ] **Step 1: Criar `app/boletins/layout.tsx`**

Conteúdo completo (espelha `app/validacao/layout.tsx`):

```tsx
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfileName, isAdminLike } from "@/lib/auth/profile";

export default async function BoletinsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Publicação do BI é atribuição da Coordenação (e Administrador).
  const profile = await getCurrentProfileName();
  if (!isAdminLike(profile)) redirect("/dashboard");

  return <>{children}</>;
}
```

- [ ] **Step 2: Verificar build**

Run: `npm run build`
Expected: sucesso.

- [ ] **Step 3: Commit**

```bash
git add app/boletins/layout.tsx
git commit -m "M5: guard da seção /boletins (Coordenação/Administrador)"
```

---

## Task 4: Action `createBulletin`

**Files:**
- Create: `app/boletins/actions.ts`

- [ ] **Step 1: Criar `app/boletins/actions.ts`**

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
import { bulletinType } from "@/lib/boletins/status";

const BASE = "/boletins";

export async function createBulletin(formData: FormData) {
  try {
    const profile = await getCurrentProfileName();
    if (!isAdminLike(profile)) {
      throw new Error("Apenas a Coordenação pode criar boletins.");
    }

    const number = getInteger(formData, "number", { required: true, min: 1, max: 99999 });
    const year = getInteger(formData, "year", { required: true, min: 2000, max: 2099 });
    const publication_date = getOptionalString(formData, "publication_date");
    const start_date = getString(formData, "start_date", { required: true });
    const end_date = getString(formData, "end_date", { required: true });

    if (end_date < start_date) {
      throw new Error("A data final não pode ser anterior à data inicial.");
    }
    const type = bulletinType(start_date, end_date);

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: created, error } = await supabase
      .from("bulletins")
      .insert({
        number,
        year,
        publication_date,
        start_date,
        end_date,
        type,
        status: "rascunho",
        created_by: user?.id ?? null,
      })
      .select("id")
      .single();
    if (error) {
      if (error.code === "23505") {
        throw new Error(`Já existe um BI nº ${number} no ano ${year}.`);
      }
      throw error;
    }

    await supabase.from("bulletin_events").insert({
      bulletin_id: created.id,
      event_type: "criado",
      note: `BI ${type} criado (${start_date} a ${end_date}).`,
      created_by: user?.id ?? null,
    });

    revalidatePath(BASE);
    redirect(`${BASE}/${created.id}${buildQuery({ ok: "Boletim criado." })}`);
  } catch (e) {
    redirect(`${BASE}${buildQuery({ err: shortError(e) })}`);
  }
}
```

> Nota: o `redirect` de sucesso fica DENTRO do try (precisamos do `created.id`). `redirect` lança internamente uma exceção de controle do Next — por isso o `catch` re-checa: o helper `shortError` do projeto recebe `unknown`; o `redirect` do Next lança um erro especial que o próprio Next trata e que NÃO é capturado como erro normal aqui? **Atenção:** No App Router, `redirect()` lança `NEXT_REDIRECT`, que se chamado dentro de try/catch É capturado. Para evitar isso, veja o Step 2.

- [ ] **Step 2: Corrigir o fluxo de redirect (NEXT_REDIRECT dentro de try/catch)**

`redirect()` lança `NEXT_REDIRECT`; se ficar dentro do `try`, o `catch` o engole. Reescreva a action movendo os `redirect` para FORA do try, guardando o id numa variável. Conteúdo final correto de `createBulletin` (substitua a função inteira):

```ts
export async function createBulletin(formData: FormData) {
  let newId: string | null = null;
  try {
    const profile = await getCurrentProfileName();
    if (!isAdminLike(profile)) {
      throw new Error("Apenas a Coordenação pode criar boletins.");
    }

    const number = getInteger(formData, "number", { required: true, min: 1, max: 99999 });
    const year = getInteger(formData, "year", { required: true, min: 2000, max: 2099 });
    const publication_date = getOptionalString(formData, "publication_date");
    const start_date = getString(formData, "start_date", { required: true });
    const end_date = getString(formData, "end_date", { required: true });

    if (end_date < start_date) {
      throw new Error("A data final não pode ser anterior à data inicial.");
    }
    const type = bulletinType(start_date, end_date);

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: created, error } = await supabase
      .from("bulletins")
      .insert({
        number,
        year,
        publication_date,
        start_date,
        end_date,
        type,
        status: "rascunho",
        created_by: user?.id ?? null,
      })
      .select("id")
      .single();
    if (error) {
      if (error.code === "23505") {
        throw new Error(`Já existe um BI nº ${number} no ano ${year}.`);
      }
      throw error;
    }

    await supabase.from("bulletin_events").insert({
      bulletin_id: created.id,
      event_type: "criado",
      note: `BI ${type} criado (${start_date} a ${end_date}).`,
      created_by: user?.id ?? null,
    });
    newId = created.id;
  } catch (e) {
    redirect(`${BASE}${buildQuery({ err: shortError(e) })}`);
  }
  revalidatePath(BASE);
  redirect(`${BASE}/${newId}${buildQuery({ ok: "Boletim criado." })}`);
}
```

Apague a primeira versão do Step 1 e deixe apenas esta. (O padrão `redirect` fora do try é o mesmo usado em `app/validacao/[id]/actions.ts`.)

- [ ] **Step 3: Verificar build**

Run: `npm run build`
Expected: sucesso. (Sem `page.tsx` ainda na rota — Server Actions não exigem page; build passa.)

- [ ] **Step 4: Commit**

```bash
git add app/boletins/actions.ts
git commit -m "M5: action createBulletin (US-023)"
```

---

## Task 5: Lista + criação (`/boletins`)

**Files:**
- Create: `app/boletins/page.tsx`

- [ ] **Step 1: Criar `app/boletins/page.tsx`**

Conteúdo completo:

```tsx
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/PageHeader";
import { FormFeedback } from "@/components/admin/FormFeedback";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { TextField } from "@/components/admin/Field";
import { BulletinStatusBadge } from "@/components/admin/BulletinStatusBadge";
import { createBulletin } from "./actions";

type Bulletin = {
  id: string;
  number: number;
  year: number;
  publication_date: string | null;
  start_date: string;
  end_date: string;
  type: string;
  status: string;
};

type SearchParams = Promise<{ ok?: string; err?: string }>;

export default async function BoletinsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { ok, err } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("bulletins")
    .select("id, number, year, publication_date, start_date, end_date, type, status")
    .order("year", { ascending: false })
    .order("number", { ascending: false });
  const bulletins = (data ?? []) as Bulletin[];

  const currentYear = new Date().getFullYear();

  return (
    <div>
      <PageHeader title="Boletins Internos" description="Criação e publicação dos BIs.">
        <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
          ← Dashboard
        </Link>
      </PageHeader>

      <FormFeedback message={ok ?? null} variant="success" />
      <FormFeedback message={err ?? null} variant="error" />

      <div className="mb-6 mt-4 rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="text-sm font-medium uppercase tracking-wide text-gray-500">
          Novo boletim
        </h3>
        <p className="mt-1 text-xs text-gray-500">
          O tipo (diário/período) é derivado das datas: iguais = diário, diferentes = período.
        </p>
        <form
          action={createBulletin}
          className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <TextField label="Número" name="number" type="number" min={1} required />
          <TextField
            label="Ano"
            name="year"
            type="number"
            min={2000}
            max={2099}
            defaultValue={currentYear}
            required
          />
          <TextField label="Data de publicação" name="publication_date" type="text" placeholder="YYYY-MM-DD" />
          <div />
          <TextField label="Data inicial" name="start_date" type="text" required placeholder="YYYY-MM-DD" />
          <TextField label="Data final" name="end_date" type="text" required placeholder="YYYY-MM-DD" />
          <div className="sm:col-span-2">
            <SubmitButton>Criar boletim</SubmitButton>
          </div>
        </form>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Nº / Ano</th>
              <th className="px-4 py-3">Período</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Publicação</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bulletins.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  Nenhum boletim criado.
                </td>
              </tr>
            )}
            {bulletins.map((b) => (
              <tr key={b.id}>
                <td className="px-4 py-3 font-medium text-gray-900">
                  {b.number}/{b.year}
                </td>
                <td className="px-4 py-3 font-mono text-gray-700">
                  {b.start_date}
                  {b.start_date !== b.end_date ? ` — ${b.end_date}` : ""}
                </td>
                <td className="px-4 py-3 text-gray-700">{b.type}</td>
                <td className="px-4 py-3 font-mono text-gray-700">
                  {b.publication_date ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <BulletinStatusBadge status={b.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/boletins/${b.id}`}
                    className="text-sm font-medium text-slate-900 hover:underline"
                  >
                    Abrir
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar build**

Run: `npm run build`
Expected: sucesso; rota `/boletins` aparece.

- [ ] **Step 3: Commit**

```bash
git add app/boletins/page.tsx
git commit -m "M5: lista de boletins + form de criação (US-023)"
```

---

## Task 6: Actions de gestão do BI

**Files:**
- Create: `app/boletins/[id]/actions.ts`

- [ ] **Step 1: Criar `app/boletins/[id]/actions.ts`**

Conteúdo completo:

```ts
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getString,
  buildQuery,
  shortError,
} from "@/lib/cadastros/helpers";
import { getCurrentProfileName, isAdminLike } from "@/lib/auth/profile";
import {
  assertBulletinTransition,
  BULLETIN_EVENT_BY_TARGET,
  type BulletinStatus,
} from "@/lib/boletins/status";

function base(id: string): string {
  return `/boletins/${id}`;
}

type BulletinRow = { id: string; status: string; start_date: string; end_date: string };

/** Confere perfil admin-like e carrega o boletim. Lança Error em problema. */
async function loadGuarded(bulletinId: string) {
  const profile = await getCurrentProfileName();
  if (!isAdminLike(profile)) {
    throw new Error("Apenas a Coordenação pode gerenciar boletins.");
  }
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão expirada.");

  const { data: bulletin, error } = await supabase
    .from("bulletins")
    .select("id, status, start_date, end_date")
    .eq("id", bulletinId)
    .maybeSingle();
  if (error) throw error;
  if (!bulletin) throw new Error("Boletim não encontrado.");

  return { supabase, user, bulletin: bulletin as BulletinRow };
}

function assertDraft(status: string) {
  if (status !== "rascunho") {
    throw new Error("Só é possível editar itens de um boletim em rascunho.");
  }
}

async function logBulletinEvent(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  args: { bulletinId: string; to: BulletinStatus; note: string; createdBy: string },
) {
  const { error } = await supabase.from("bulletin_events").insert({
    bulletin_id: args.bulletinId,
    event_type: BULLETIN_EVENT_BY_TARGET[args.to] ?? args.to,
    note: args.note,
    created_by: args.createdBy,
  });
  if (error) throw error;
}

/**
 * Monta os itens do BI a partir de records validados+publicáveis+incluídos no período.
 * Idempotente: apaga TODOS os itens do BI e remonta do zero (só em rascunho).
 */
export async function assembleItems(formData: FormData) {
  const id = getString(formData, "id", { required: true });
  try {
    const { supabase, bulletin } = await loadGuarded(id);
    assertDraft(bulletin.status);

    // Apaga itens existentes (remonta do zero).
    const { error: delErr } = await supabase
      .from("bulletin_items")
      .delete()
      .eq("bulletin_id", id);
    if (delErr) throw delErr;

    // Busca registros elegíveis (DT-003): validado + publicável + incluído, no período.
    const { data: recsRaw, error: recErr } = await supabase
      .from("records")
      .select(
        "id, reference_date, title, publication_text, bulletin_part, source_type",
      )
      .eq("status", "validado")
      .eq("classification", "publicável")
      .eq("include_in_bulletin", true)
      .gte("reference_date", bulletin.start_date)
      .lte("reference_date", bulletin.end_date)
      .order("bulletin_part", { ascending: true })
      .order("reference_date", { ascending: true });
    if (recErr) throw recErr;

    const recs = recsRaw ?? [];
    if (recs.length > 0) {
      // display_order sequencial por parte.
      const orderByPart: { [part: number]: number } = {};
      const rows = recs.map((r) => {
        const part = r.bulletin_part ?? 3; // sem parte definida → 3ª (Assuntos Gerais)
        const order = orderByPart[part] ?? 0;
        orderByPart[part] = order + 1;
        return {
          bulletin_id: id,
          record_id: r.id,
          part_number: part,
          reference_date: r.reference_date,
          title: r.title ?? "",
          content: r.publication_text ?? "",
          source_type: r.source_type ?? null,
          display_order: order,
          visible: true,
        };
      });
      const { error: insErr } = await supabase.from("bulletin_items").insert(rows);
      if (insErr) throw insErr;
    }
  } catch (e) {
    redirect(`${base(id)}${buildQuery({ err: shortError(e) })}`);
  }
  revalidatePath(base(id));
  redirect(`${base(id)}${buildQuery({ ok: "Itens montados a partir dos registros validados." })}`);
}

/** Alterna a visibilidade de um item (só em rascunho). */
export async function toggleItemVisible(formData: FormData) {
  const id = getString(formData, "id", { required: true });
  try {
    const { supabase, bulletin } = await loadGuarded(id);
    assertDraft(bulletin.status);
    const itemId = getString(formData, "item_id", { required: true });
    const next = getString(formData, "next", { required: true }) === "true";
    const { error } = await supabase
      .from("bulletin_items")
      .update({ visible: next })
      .eq("id", itemId)
      .eq("bulletin_id", id);
    if (error) throw error;
  } catch (e) {
    redirect(`${base(id)}${buildQuery({ err: shortError(e) })}`);
  }
  revalidatePath(base(id));
  redirect(`${base(id)}${buildQuery({ ok: "Visibilidade alterada." })}`);
}

/**
 * Reordena um item para cima/baixo dentro da MESMA parte (troca display_order
 * com o vizinho). direction = "up" | "down".
 */
export async function reorderItem(formData: FormData) {
  const id = getString(formData, "id", { required: true });
  try {
    const { supabase, bulletin } = await loadGuarded(id);
    assertDraft(bulletin.status);
    const itemId = getString(formData, "item_id", { required: true });
    const direction = getString(formData, "direction", { required: true });

    const { data: item, error: e1 } = await supabase
      .from("bulletin_items")
      .select("id, part_number, display_order")
      .eq("id", itemId)
      .eq("bulletin_id", id)
      .maybeSingle();
    if (e1) throw e1;
    if (!item) throw new Error("Item não encontrado.");

    // Busca o vizinho na mesma parte (ordem imediatamente acima/abaixo).
    const cmp = direction === "up" ? "lt" : "gt";
    const neighborOrder = direction === "up" ? { ascending: false } : { ascending: true };
    let q = supabase
      .from("bulletin_items")
      .select("id, display_order")
      .eq("bulletin_id", id)
      .eq("part_number", item.part_number);
    q = cmp === "lt"
      ? q.lt("display_order", item.display_order)
      : q.gt("display_order", item.display_order);
    const { data: neighbors, error: e2 } = await q
      .order("display_order", neighborOrder)
      .limit(1);
    if (e2) throw e2;
    const neighbor = (neighbors ?? [])[0];
    if (!neighbor) {
      // Já está no extremo — nada a fazer.
      revalidatePath(base(id));
      redirect(`${base(id)}${buildQuery({ ok: "Item já está no limite." })}`);
    }

    // Troca os display_order.
    const { error: u1 } = await supabase
      .from("bulletin_items")
      .update({ display_order: neighbor.display_order })
      .eq("id", item.id);
    if (u1) throw u1;
    const { error: u2 } = await supabase
      .from("bulletin_items")
      .update({ display_order: item.display_order })
      .eq("id", neighbor.id);
    if (u2) throw u2;
  } catch (e) {
    redirect(`${base(id)}${buildQuery({ err: shortError(e) })}`);
  }
  revalidatePath(base(id));
  redirect(`${base(id)}${buildQuery({ ok: "Ordem alterada." })}`);
}

/** Edita título/conteúdo de um item (só em rascunho). */
export async function updateItemContent(formData: FormData) {
  const id = getString(formData, "id", { required: true });
  try {
    const { supabase, bulletin } = await loadGuarded(id);
    assertDraft(bulletin.status);
    const itemId = getString(formData, "item_id", { required: true });
    const title = getString(formData, "title");
    const content = getString(formData, "content");
    const { error } = await supabase
      .from("bulletin_items")
      .update({ title, content })
      .eq("id", itemId)
      .eq("bulletin_id", id);
    if (error) throw error;
  } catch (e) {
    redirect(`${base(id)}${buildQuery({ err: shortError(e) })}`);
  }
  revalidatePath(base(id));
  redirect(`${base(id)}${buildQuery({ ok: "Item atualizado." })}`);
}

/** rascunho → aprovado (congela). Exige ≥1 item visível. */
export async function approveBulletin(formData: FormData) {
  const id = getString(formData, "id", { required: true });
  try {
    const { supabase, user, bulletin } = await loadGuarded(id);
    assertBulletinTransition(bulletin.status, "aprovado");

    const { count, error: cErr } = await supabase
      .from("bulletin_items")
      .select("id", { count: "exact", head: true })
      .eq("bulletin_id", id)
      .eq("visible", true);
    if (cErr) throw cErr;
    if (!count || count === 0) {
      throw new Error("O boletim precisa de ao menos um item visível para ser aprovado.");
    }

    const { error } = await supabase
      .from("bulletins")
      .update({
        status: "aprovado",
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) throw error;

    await logBulletinEvent(supabase, {
      bulletinId: id,
      to: "aprovado",
      note: "Boletim aprovado e congelado.",
      createdBy: user.id,
    });
  } catch (e) {
    redirect(`${base(id)}${buildQuery({ err: shortError(e) })}`);
  }
  revalidatePath(base(id));
  redirect(`${base(id)}${buildQuery({ ok: "Boletim aprovado." })}`);
}

/** aprovado → rascunho (reabertura controlada, motivo obrigatório). */
export async function reopenBulletin(formData: FormData) {
  const id = getString(formData, "id", { required: true });
  try {
    const { supabase, user, bulletin } = await loadGuarded(id);
    assertBulletinTransition(bulletin.status, "rascunho");
    const note = getString(formData, "note", { required: true });

    const { error } = await supabase
      .from("bulletins")
      .update({ status: "rascunho", approved_by: null, approved_at: null })
      .eq("id", id);
    if (error) throw error;

    await logBulletinEvent(supabase, {
      bulletinId: id,
      to: "rascunho",
      note,
      createdBy: user.id,
    });
  } catch (e) {
    redirect(`${base(id)}${buildQuery({ err: shortError(e) })}`);
  }
  revalidatePath(base(id));
  redirect(`${base(id)}${buildQuery({ ok: "Boletim reaberto para edição." })}`);
}

/** → cancelado. */
export async function cancelBulletin(formData: FormData) {
  const id = getString(formData, "id", { required: true });
  try {
    const { supabase, user, bulletin } = await loadGuarded(id);
    assertBulletinTransition(bulletin.status, "cancelado");
    const { error } = await supabase
      .from("bulletins")
      .update({ status: "cancelado" })
      .eq("id", id);
    if (error) throw error;

    await logBulletinEvent(supabase, {
      bulletinId: id,
      to: "cancelado",
      note: "Boletim cancelado.",
      createdBy: user.id,
    });
  } catch (e) {
    redirect(`${base(id)}${buildQuery({ err: shortError(e) })}`);
  }
  revalidatePath(base(id));
  redirect(`${base(id)}${buildQuery({ ok: "Boletim cancelado." })}`);
}
```

> Nota sobre `reorderItem`: o `redirect` no caminho "já está no limite" fica fora do try? Não — está dentro. Como `redirect` lança `NEXT_REDIRECT` e isso seria capturado pelo `catch`, mova esse caso: em vez de `redirect` ali, use `return` após `revalidatePath` **não é possível dentro do try sem redirect**. Solução adotada no código acima: aceitar que o `NEXT_REDIRECT` do caso-limite seja relançado pelo `catch` como erro — **isso está errado**. Corrija conforme o Step 2.

- [ ] **Step 2: Corrigir o caso-limite de `reorderItem`**

Para não cair no problema do `NEXT_REDIRECT` dentro do try, substitua o bloco do vizinho inexistente: em vez de `redirect(...)` dentro do try, lance um sentinela tratado fora. Reescreva `reorderItem` para usar uma flag em vez de redirect interno:

```ts
export async function reorderItem(formData: FormData) {
  const id = getString(formData, "id", { required: true });
  let atLimit = false;
  try {
    const { supabase, bulletin } = await loadGuarded(id);
    assertDraft(bulletin.status);
    const itemId = getString(formData, "item_id", { required: true });
    const direction = getString(formData, "direction", { required: true });

    const { data: item, error: e1 } = await supabase
      .from("bulletin_items")
      .select("id, part_number, display_order")
      .eq("id", itemId)
      .eq("bulletin_id", id)
      .maybeSingle();
    if (e1) throw e1;
    if (!item) throw new Error("Item não encontrado.");

    let q = supabase
      .from("bulletin_items")
      .select("id, display_order")
      .eq("bulletin_id", id)
      .eq("part_number", item.part_number);
    q = direction === "up"
      ? q.lt("display_order", item.display_order).order("display_order", { ascending: false })
      : q.gt("display_order", item.display_order).order("display_order", { ascending: true });
    const { data: neighbors, error: e2 } = await q.limit(1);
    if (e2) throw e2;
    const neighbor = (neighbors ?? [])[0];

    if (!neighbor) {
      atLimit = true;
    } else {
      const { error: u1 } = await supabase
        .from("bulletin_items")
        .update({ display_order: neighbor.display_order })
        .eq("id", item.id);
      if (u1) throw u1;
      const { error: u2 } = await supabase
        .from("bulletin_items")
        .update({ display_order: item.display_order })
        .eq("id", neighbor.id);
      if (u2) throw u2;
    }
  } catch (e) {
    redirect(`${base(id)}${buildQuery({ err: shortError(e) })}`);
  }
  revalidatePath(base(id));
  redirect(
    `${base(id)}${buildQuery({ ok: atLimit ? "Item já está no limite." : "Ordem alterada." })}`,
  );
}
```

Substitua a versão do Step 1 por esta. (Mesmo princípio: nenhum `redirect` dentro do `try`.)

- [ ] **Step 3: Verificar build**

Run: `npm run build`
Expected: sucesso.

- [ ] **Step 4: Commit**

```bash
git add app/boletins/[id]/actions.ts
git commit -m "M5: actions de gestão do BI (montar/editar/aprovar/reabrir/cancelar)"
```

---

## Task 7: Gestão do BI (`/boletins/[id]`)

**Files:**
- Create: `app/boletins/[id]/page.tsx`

- [ ] **Step 1: Criar `app/boletins/[id]/page.tsx`**

Conteúdo completo:

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/PageHeader";
import { FormFeedback } from "@/components/admin/FormFeedback";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { BulletinStatusBadge } from "@/components/admin/BulletinStatusBadge";
import { BULLETIN_PARTS } from "@/lib/records/options";
import {
  assembleItems,
  toggleItemVisible,
  reorderItem,
  updateItemContent,
  approveBulletin,
  reopenBulletin,
  cancelBulletin,
} from "./actions";

type Bulletin = {
  id: string;
  number: number;
  year: number;
  publication_date: string | null;
  start_date: string;
  end_date: string;
  type: string;
  status: string;
  approved_at: string | null;
};

type Item = {
  id: string;
  part_number: number;
  reference_date: string | null;
  title: string;
  content: string;
  display_order: number;
  visible: boolean;
};

type EventRow = {
  id: string;
  event_type: string;
  note: string;
  created_at: string;
};

function partLabel(n: number): string {
  return BULLETIN_PARTS.find((p) => p.value === String(n))?.label ?? `Parte ${n}`;
}

type SearchParams = Promise<{ ok?: string; err?: string }>;

export default async function BulletinDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const { ok, err } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const { data: bRaw } = await supabase
    .from("bulletins")
    .select(
      "id, number, year, publication_date, start_date, end_date, type, status, approved_at",
    )
    .eq("id", id)
    .maybeSingle();
  if (!bRaw) notFound();
  const b = bRaw as Bulletin;

  const { data: itemsRaw } = await supabase
    .from("bulletin_items")
    .select("id, part_number, reference_date, title, content, display_order, visible")
    .eq("bulletin_id", id)
    .order("part_number", { ascending: true })
    .order("display_order", { ascending: true });
  const items = (itemsRaw ?? []) as Item[];

  const { data: evRaw } = await supabase
    .from("bulletin_events")
    .select("id, event_type, note, created_at")
    .eq("bulletin_id", id)
    .order("created_at", { ascending: false });
  const events = (evRaw ?? []) as EventRow[];

  const isDraft = b.status === "rascunho";
  const isApproved = b.status === "aprovado";
  const periodo =
    b.start_date + (b.start_date !== b.end_date ? ` — ${b.end_date}` : "");

  return (
    <div>
      <PageHeader
        title={`BI ${b.number}/${b.year}`}
        description={`${b.type} · ${periodo}`}
      >
        <Link href="/boletins" className="text-sm text-gray-600 hover:text-gray-900">
          ← Lista
        </Link>
        <Link
          href={`/boletins/${b.id}/previa`}
          className="text-sm font-medium text-slate-900 hover:underline"
        >
          Ver prévia
        </Link>
      </PageHeader>

      <div className="mb-4 flex items-center gap-2">
        <span className="text-xs text-gray-500">Status:</span>
        <BulletinStatusBadge status={b.status} />
      </div>

      <FormFeedback message={ok ?? null} variant="success" />
      <FormFeedback message={err ?? null} variant="error" />

      {/* Ações de status */}
      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white p-4">
        {isDraft && (
          <form action={assembleItems}>
            <input type="hidden" name="id" value={b.id} />
            <SubmitButton variant="secondary">Montar itens (dos registros validados)</SubmitButton>
          </form>
        )}
        {isDraft && (
          <form action={approveBulletin}>
            <input type="hidden" name="id" value={b.id} />
            <SubmitButton>Aprovar boletim</SubmitButton>
          </form>
        )}
        {isApproved && (
          <form action={reopenBulletin} className="flex items-end gap-2">
            <input type="hidden" name="id" value={b.id} />
            <input
              type="text"
              name="note"
              required
              placeholder="Motivo da reabertura"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
            <SubmitButton variant="secondary">Reabrir</SubmitButton>
          </form>
        )}
        {b.status !== "cancelado" && (
          <form action={cancelBulletin}>
            <input type="hidden" name="id" value={b.id} />
            <SubmitButton variant="danger">Cancelar</SubmitButton>
          </form>
        )}
        {isApproved && b.approved_at && (
          <span className="text-xs text-emerald-700">
            Aprovado em {new Date(b.approved_at).toLocaleString("pt-BR")}
          </span>
        )}
      </div>

      {/* Itens agrupados por parte */}
      <div className="mt-6 space-y-6">
        {BULLETIN_PARTS.map((p) => {
          const part = Number(p.value);
          const partItems = items.filter((it) => it.part_number === part);
          return (
            <div key={p.value} className="rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="text-sm font-medium uppercase tracking-wide text-gray-500">
                {p.label}
              </h3>
              {partItems.length === 0 ? (
                <p className="mt-3 text-sm text-gray-400">Sem itens nesta parte.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {partItems.map((it) => (
                    <li
                      key={it.id}
                      className={`rounded-md border p-3 ${
                        it.visible ? "border-gray-200" : "border-gray-200 bg-gray-50 opacity-60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="font-mono text-xs text-gray-500">
                            {it.reference_date ?? "—"}
                          </div>
                          {isDraft ? (
                            <form action={updateItemContent} className="mt-1 space-y-2">
                              <input type="hidden" name="id" value={b.id} />
                              <input type="hidden" name="item_id" value={it.id} />
                              <input
                                type="text"
                                name="title"
                                defaultValue={it.title}
                                placeholder="Título"
                                className="block w-full rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-900"
                              />
                              <textarea
                                name="content"
                                defaultValue={it.content}
                                rows={2}
                                className="block w-full rounded-md border border-slate-300 px-2 py-1 text-sm leading-relaxed text-slate-900"
                              />
                              <SubmitButton variant="secondary">Salvar</SubmitButton>
                            </form>
                          ) : (
                            <>
                              {it.title && (
                                <div className="font-medium text-gray-900">{it.title}</div>
                              )}
                              <div className="whitespace-pre-wrap text-sm text-gray-700">
                                {it.content}
                              </div>
                            </>
                          )}
                        </div>
                        {isDraft && (
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <div className="flex gap-1">
                              <form action={reorderItem}>
                                <input type="hidden" name="id" value={b.id} />
                                <input type="hidden" name="item_id" value={it.id} />
                                <input type="hidden" name="direction" value="up" />
                                <button type="submit" className="px-1 text-sm text-gray-600 hover:text-gray-900">↑</button>
                              </form>
                              <form action={reorderItem}>
                                <input type="hidden" name="id" value={b.id} />
                                <input type="hidden" name="item_id" value={it.id} />
                                <input type="hidden" name="direction" value="down" />
                                <button type="submit" className="px-1 text-sm text-gray-600 hover:text-gray-900">↓</button>
                              </form>
                            </div>
                            <form action={toggleItemVisible}>
                              <input type="hidden" name="id" value={b.id} />
                              <input type="hidden" name="item_id" value={it.id} />
                              <input type="hidden" name="next" value={String(!it.visible)} />
                              <button type="submit" className="text-xs font-medium text-gray-600 hover:underline">
                                {it.visible ? "Ocultar" : "Mostrar"}
                              </button>
                            </form>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {/* Histórico */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="text-sm font-medium uppercase tracking-wide text-gray-500">
          Histórico
        </h3>
        <ul className="mt-4 space-y-3 text-sm">
          {events.length === 0 && <li className="text-gray-500">Sem eventos.</li>}
          {events.map((ev) => (
            <li key={ev.id} className="border-l-2 border-gray-200 pl-3">
              <div className="font-medium text-gray-900">{ev.event_type}</div>
              <div className="text-xs text-gray-500">
                {new Date(ev.created_at).toLocaleString("pt-BR")}
              </div>
              {ev.note && <div className="mt-1 text-gray-700">{ev.note}</div>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar build**

Run: `npm run build`
Expected: sucesso; rota `/boletins/[id]` aparece.

- [ ] **Step 3: Commit**

```bash
git add app/boletins/[id]/page.tsx
git commit -m "M5: gestão do BI — itens, ações de status e histórico (US-024/026)"
```

---

## Task 8: Prévia HTML (`/boletins/[id]/previa`)

**Files:**
- Create: `app/boletins/[id]/previa/page.tsx`

- [ ] **Step 1: Criar `app/boletins/[id]/previa/page.tsx`**

Conteúdo completo. Lê **apenas** `bulletins` (cabeçalho) e `bulletin_items` (corpo) — nenhum import de `records` (invariante DT-003/DT-006):

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { BULLETIN_PARTS } from "@/lib/records/options";
import { approveBulletin } from "../actions";

type Bulletin = {
  id: string;
  number: number;
  year: number;
  publication_date: string | null;
  start_date: string;
  end_date: string;
  type: string;
  status: string;
};

type Item = {
  id: string;
  part_number: number;
  reference_date: string | null;
  title: string;
  content: string;
  display_order: number;
};

export default async function BulletinPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: bRaw } = await supabase
    .from("bulletins")
    .select("id, number, year, publication_date, start_date, end_date, type, status")
    .eq("id", id)
    .maybeSingle();
  if (!bRaw) notFound();
  const b = bRaw as Bulletin;

  // Lê SOMENTE itens visíveis (DT-003/DT-006). Nenhum acesso a records aqui.
  const { data: itemsRaw } = await supabase
    .from("bulletin_items")
    .select("id, part_number, reference_date, title, content, display_order")
    .eq("bulletin_id", id)
    .eq("visible", true)
    .order("part_number", { ascending: true })
    .order("display_order", { ascending: true });
  const items = (itemsRaw ?? []) as Item[];

  const periodo =
    b.start_date + (b.start_date !== b.end_date ? ` a ${b.end_date}` : "");

  return (
    <div>
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link href={`/boletins/${b.id}`} className="text-sm text-gray-600 hover:text-gray-900">
          ← Gestão
        </Link>
        {b.status === "rascunho" && (
          <form action={approveBulletin}>
            <input type="hidden" name="id" value={b.id} />
            <SubmitButton>Aprovar para PDF</SubmitButton>
          </form>
        )}
      </div>

      {/* Documento A4-like */}
      <article className="mx-auto max-w-3xl rounded-xl border border-gray-200 bg-white p-10 shadow-sm">
        <header className="border-b border-gray-300 pb-4 text-center">
          <h1 className="text-lg font-bold uppercase tracking-wide text-gray-900">
            Academia Bombeiro Militar — CBMAP
          </h1>
          <p className="text-sm uppercase tracking-wide text-gray-700">
            Curso de Formação de Oficiais — Boletim Interno
          </p>
          <p className="mt-2 text-sm text-gray-900">
            <strong>BI nº {b.number}/{b.year}</strong> · {b.type}
          </p>
          <p className="text-sm text-gray-700">
            Período: {periodo}
            {b.publication_date ? ` · Publicação: ${b.publication_date}` : ""}
          </p>
        </header>

        {BULLETIN_PARTS.map((p) => {
          const part = Number(p.value);
          const partItems = items.filter((it) => it.part_number === part);
          return (
            <section key={p.value} className="mt-6">
              <h2 className="text-sm font-bold uppercase tracking-wide text-gray-900">
                {p.label}
              </h2>
              {partItems.length === 0 ? (
                <p className="mt-2 text-sm italic text-gray-500">Sem alteração.</p>
              ) : (
                <ul className="mt-2 space-y-3">
                  {partItems.map((it) => (
                    <li key={it.id} className="text-sm text-gray-900">
                      {it.title && <div className="font-semibold">{it.title}</div>}
                      <div className="whitespace-pre-wrap leading-relaxed">{it.content}</div>
                      {it.reference_date && (
                        <div className="mt-0.5 font-mono text-xs text-gray-500">
                          {it.reference_date}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}

        <footer className="mt-10 border-t border-gray-300 pt-3 text-center text-xs text-gray-500">
          Documento gerado pelo BI-CFO · Prévia (status: {b.status})
        </footer>
      </article>
    </div>
  );
}
```

- [ ] **Step 2: Verificar build**

Run: `npm run build`
Expected: sucesso; rota `/boletins/[id]/previa` aparece.

- [ ] **Step 3: Commit**

```bash
git add app/boletins/[id]/previa/page.tsx
git commit -m "M5: prévia HTML do BI com 5 partes e Sem alteração (US-025)"
```

---

## Task 9: Card de navegação no Dashboard

**Files:**
- Modify: `app/dashboard/page.tsx`

- [ ] **Step 1: Adicionar o card de Boletins**

Em `app/dashboard/page.tsx`, logo após o card de `/validacao` (o bloco `{canManageCadastros && ( ... href="/validacao" ... )}`), adicione:

```tsx
        {canManageCadastros && (
          <Link
            href="/boletins"
            className="block rounded-xl border border-gray-200 bg-white p-6 transition hover:border-gray-900 hover:shadow-sm"
          >
            <h3 className="text-base font-semibold text-gray-900">Boletins Internos</h3>
            <p className="mt-1 text-sm text-gray-500">
              Criar BI, montar prévia e aprovar a versão final.
            </p>
          </Link>
        )}
```

- [ ] **Step 2: Atualizar o subtítulo do dashboard**

Troque a linha:
```tsx
          Marco M4 — validação da Coordenação disponível.
```
por:
```tsx
          Marco M5 — publicação do Boletim Interno disponível.
```

- [ ] **Step 3: Verificar build**

Run: `npm run build`
Expected: sucesso.

- [ ] **Step 4: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "M5: card de navegação para /boletins no dashboard"
```

---

## Task 10: Documentação (DT-006 + README)

**Files:**
- Modify: `Apoio/_decisoes.md`
- Modify: `README.md`

- [ ] **Step 1: Registrar a DT-006 em `Apoio/_decisoes.md`**

Abra `Apoio/_decisoes.md`. Localize a seção "Próximas decisões esperadas" (perto do fim) e **insira a DT-006 ANTES dela** (após a última decisão registrada, a DT-005). Conteúdo a inserir:

```markdown
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
- Versionamento real (snapshots de versões anteriores) fica para fase futura, a registrar
  como nova DT quando ocorrer.
```

- [ ] **Step 2: Atualizar `README.md`**

(a) Na lista de migrations do passo 4 (Setup local), adicione ao fim:
```markdown
   - `supabase/migrations/0014_bulletins.sql`
```

(b) Atualize a linha "Estado atual". Troque:
```markdown
> **Estado atual:** Marco **M4 — Validação da Coordenação**.
```
pelo início:
```markdown
> **Estado atual:** Marco **M5 — Publicação do Boletim Interno**.
```
E ajuste o restante da frase para mencionar que o M5 (criação de BI, prévia das 5 partes e aprovação/congelamento) está implementado, e que a geração de PDF é o M6.

- [ ] **Step 3: Commit**

```bash
git add Apoio/_decisoes.md README.md
git commit -m "docs: DT-006 (congelamento/reabertura) + README M5"
```

---

## Task 11: Aplicação da migration + verificação manual

**Files:** nenhum arquivo de código.

- [ ] **Step 1: Aplicar a migration**

No Supabase Dashboard → SQL Editor, execute `supabase/migrations/0014_bulletins.sql`.
Expected: sem erro; tabelas `bulletins`, `bulletin_items`, `bulletin_events` criadas com RLS habilitada.

- [ ] **Step 2: Build final**

Run: `npm run build`
Expected: sucesso; rotas `/boletins`, `/boletins/[id]`, `/boletins/[id]/previa` presentes.

- [ ] **Step 3: Checklist funcional**

Run: `npm run dev`, logar como Coordenação/Administrador. Pré-condição: existirem registros `validado`+`publicável`+`include_in_bulletin=true` (gerados no fluxo M4). Se não houver, valide alguns registros em `/validacao` primeiro.

- [ ] Criar BI **diário** (data inicial = final) → `type` = `diário`, status `rascunho`.
- [ ] Criar BI **por período** (datas diferentes) → `type` = `período`.
- [ ] Criar BI com nº/ano já existentes → erro "Já existe um BI nº X no ano Y".
- [ ] "Montar itens" → traz só registros validados+publicáveis+incluídos do período, agrupados nas 5 partes; `content` = `publication_text`.
- [ ] Ocultar item → some da prévia; ↑/↓ reordena dentro da parte; editar texto → muda `content` (sem afetar `records`).
- [ ] Parte sem itens visíveis → prévia mostra "Sem alteração".
- [ ] Aprovar (com ≥1 item visível) → status `aprovado`, itens read-only na gestão, evento `aprovado` no histórico. Aprovar sem itens visíveis → erro.
- [ ] Reabrir (com motivo) → volta a `rascunho`, itens editáveis, evento `reaberto`.
- [ ] Logar como perfil não-autorizado (ex.: Instrutor) → `/boletins` redireciona para `/dashboard`.

- [ ] **Step 4 (opcional): marcar spec como implementada**

```bash
git add docs/superpowers/specs/2026-05-30-m5-publicacao-boletim-design.md
git commit -m "docs: M5 implementado"
```

---

## Self-Review (preenchido pelo autor do plano)

**Cobertura da spec:**
- §1 Banco (`bulletins`/`bulletin_items`/`bulletin_events` + RLS + índices + triggers) → Task 1. ✓
- §2 Rotas e Server Actions (layout, lista+create, gestão+7 actions, prévia) → Tasks 3–8. ✓
- §3 UI (lista/criar; gestão com itens agrupados, ocultar/reordenar/editar, ações de status, histórico; prévia A4 com 5 partes e "Sem alteração") → Tasks 5, 7, 8. ✓
- §4 Erros e invariantes (perfil; nº duplicado; edição só em rascunho; reabrir exige motivo; aprovar exige item visível; `assembleItems` filtra validado+publicável+incluído; content só de publication_text; prévia lê só bulletin_items) → Tasks 4, 6, 8. ✓
- §5 Documentação (DT-006) → Task 10. ✓
- §6 Verificação manual (checklist) → Task 11. ✓
- US-023→026 mapeadas (criar; buscar/montar; prévia; aprovar+reabrir). ✓

**Placeholders:** nenhum TBD/TODO; todo passo de código mostra conteúdo completo. As Tasks 4 e 6 têm um Step de "correção" que SUBSTITUI a versão anterior pelo motivo do `NEXT_REDIRECT` — a versão final está completa e explícita.

**Consistência de tipos/nomes:** `bulletinType`, `assertBulletinTransition`, `BULLETIN_EVENT_BY_TARGET`, `BulletinStatus` (lib/boletins/status.ts) usados igualmente em actions. `BulletinStatusBadge` prop `status`. `BULLETIN_PARTS` (lib/records/options.ts, do M4) reusado em gestão e prévia. Colunas batem com a migration 0014 (`number, year, publication_date, start_date, end_date, type, status, version, approved_by, approved_at`; itens: `bulletin_id, record_id, part_number, reference_date, title, content, source_type, display_order, visible`). Campos lidos de `records` em `assembleItems` existem na 0012 (`reference_date, title, publication_text, bulletin_part, source_type, status, classification, include_in_bulletin`).
```
