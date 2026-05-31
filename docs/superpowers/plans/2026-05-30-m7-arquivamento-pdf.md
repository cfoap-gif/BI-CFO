# M7 — Arquivamento Simples de PDF Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persistir o PDF gerado do BI aprovado em Supabase Storage e permitir baixar o arquivo arquivado.

**Architecture:** Reusar o gerador do M6, adicionar campos de arquivamento em `bulletins`, criar helper de caminho Storage, Server Action para upload e rota autenticada para download arquivado.

**Tech Stack:** Next.js App Router, Server Actions, Supabase Storage, PostgreSQL, TypeScript.

---

## File Structure

- Create: `supabase/migrations/0017_bulletin_pdf_archive.sql`
- Create: `lib/pdf/archive-path.ts`
- Create: `tests/pdf-archive-path.test.ts`
- Create: `lib/pdf/archive.ts`
- Create: `app/boletins/[id]/arquivo/route.ts`
- Modify: `app/boletins/[id]/actions.ts`
- Modify: `app/boletins/[id]/page.tsx`
- Modify: `README.md`

## Tasks

1. Criar migration com bucket privado e campos `pdf_*`.
2. Criar teste e helper de caminho de arquivo.
3. Criar serviço de geração/upload para Storage.
4. Criar action `archiveBulletinPdf`.
5. Criar rota de download arquivado.
6. Adicionar botões na tela de BI.
7. Rodar `npm test`, `npm run lint`, `npm run build` e teste manual.

