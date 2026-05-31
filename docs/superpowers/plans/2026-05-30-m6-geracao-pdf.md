# M6 — Geração de PDF Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gerar e baixar PDF formal do Boletim Interno aprovado, usando somente `bulletins` e `bulletin_items`.

**Architecture:** O PDF será renderizado no servidor por `@react-pdf/renderer`. A rota `GET /boletins/[id]/pdf` valida sessão e status aprovado, carrega dados congelados, renderiza o documento e retorna `application/pdf` com nome padronizado.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Supabase, `@react-pdf/renderer`, Node test runner para funções puras.

---

## File Structure

- Create: `lib/pdf/filename.ts` — nome padronizado do arquivo.
- Create: `lib/pdf/types.ts` — tipos de dados do PDF.
- Create: `lib/pdf/bulletin-data.ts` — loader do BI e itens visíveis; não consulta `records`.
- Create: `lib/pdf/bulletin-document.tsx` — template React-PDF.
- Create: `app/boletins/[id]/pdf/route.ts` — endpoint de download.
- Modify: `app/boletins/[id]/page.tsx` — botão "Baixar PDF" em BI aprovado.
- Modify: `app/boletins/[id]/previa/page.tsx` — botão "Baixar PDF" em BI aprovado.
- Modify: `package.json` / `package-lock.json` — dependência `@react-pdf/renderer` e script de teste.
- Create: `tests/pdf-filename.test.mjs` — teste do nome diário/período.
- Modify: `README.md` — registrar M6 parcial/geração de PDF por download.

## Task 1: Dependência e Teste de Nome

- [ ] **Step 1: Instalar `@react-pdf/renderer`**

Run: `npm install @react-pdf/renderer@4.5.1`

Expected: `package.json` e `package-lock.json` atualizados.

- [ ] **Step 2: Adicionar script de teste**

Em `package.json`, adicionar:

```json
"test": "node --test tests/**/*.test.mjs"
```

- [ ] **Step 3: Criar teste vermelho para nomes**

Criar `tests/pdf-filename.test.mjs` importando `buildBulletinPdfFilename` de
`../lib/pdf/filename.js` e cobrindo:

- BI diário: `BI_CFO_2026_N005_02-06-2026.pdf`
- BI por período: `BI_CFO_2026_N006_01-06-2026_a_03-06-2026.pdf`

- [ ] **Step 4: Rodar teste e confirmar falha**

Run: `npm test`

Expected: falha por módulo/função inexistente.

- [ ] **Step 5: Implementar `lib/pdf/filename.ts`**

Exportar `buildBulletinPdfFilename(input)` com padding de número (`N005`) e datas `DD-MM-YYYY`.

- [ ] **Step 6: Rodar teste e confirmar sucesso**

Run: `npm test`

Expected: 2 testes passando.

## Task 2: Loader e Invariante

- [ ] **Step 1: Criar tipos**

Criar `lib/pdf/types.ts` com `BulletinPdfData` e `BulletinPdfItem`.

- [ ] **Step 2: Criar loader**

Criar `lib/pdf/bulletin-data.ts` com `loadBulletinPdfData(supabase, id)`.

Regras:
- busca `bulletins`;
- se não existir, retorna erro `not_found`;
- se status não for `aprovado`, retorna erro `not_approved`;
- busca `bulletin_items` com `visible = true`;
- ordena por `part_number`, `display_order`, `reference_date`;
- não usa `.from("records")`.

- [ ] **Step 3: Verificar invariante por busca textual**

Run: `rg -n 'from\\("records"|from\\('records\\'' lib/pdf app/boletins/[id]/pdf`

Expected: sem resultados.

## Task 3: Template PDF e Rota

- [ ] **Step 1: Criar `bulletin-document.tsx`**

Implementar documento A4 com:
- cabeçalho centralizado;
- número/ano, tipo, período, publicação;
- cinco partes;
- "Sem alteração." em parte vazia;
- campo de aprovação;
- rodapé com versão, geração e página.

- [ ] **Step 2: Criar rota `GET /boletins/[id]/pdf`**

Implementar:
- sessão obrigatória;
- `loadBulletinPdfData`;
- renderização com `pdf(...).toBuffer()` ou API equivalente do pacote;
- headers `Content-Type: application/pdf` e `Content-Disposition`.

- [ ] **Step 3: Adicionar botões**

Em detalhe e prévia, mostrar link "Baixar PDF" quando `status === "aprovado"`.

## Task 4: Verificação e Documentação

- [ ] **Step 1: Rodar verificações**

Run:

```powershell
npm test
npm run lint
npm run build
```

Expected: todos com exit code 0.

- [ ] **Step 2: Teste manual com BI 3/2026**

Abrir `/boletins/<id>/pdf`; confirmar download PDF, item validado e partes vazias.

- [ ] **Step 3: Atualizar README**

Registrar que M6 gera download PDF sob demanda a partir de `bulletin_items`; Storage fica para M7/fatia futura.

- [ ] **Step 4: Commit**

Run:

```powershell
git add .
git commit -m "M6: geração de PDF do boletim aprovado"
```

