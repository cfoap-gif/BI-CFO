# M6 — Geração de PDF do Boletim Interno — Design

**Marco:** M6
**Data:** 2026-05-30
**Status:** aprovado para implementação

## Contexto

O M5 já permite criar BI, montar `bulletin_items`, revisar a prévia HTML e aprovar
o documento. O M6 fecha o fluxo principal gerando um PDF formal e baixável a partir
dos itens congelados.

Invariante obrigatória: o PDF nunca consulta `records`, Livro de Dia ou tabelas de
origem. Ele lê apenas `bulletins` e `bulletin_items`.

## User Stories Cobertas

- **US-027** — Gerar PDF do BI aprovado.
- **US-028** — Gerar nome padronizado do arquivo.

`US-029` (nova versão real do PDF) fica fora desta fatia; o MVP já usa reabertura
controlada antes da geração.

## Decisão Técnica

Usar `@react-pdf/renderer` no servidor. A biblioteca permite montar o documento como
componentes React próprios para PDF, sem depender de navegador headless em produção.

Alternativas descartadas:

- HTML + Playwright/Chromium: replica CSS da prévia, mas adiciona peso operacional no
  deploy e dependência de browser.
- Biblioteca de desenho manual: controle alto, manutenção ruim e contrária ao PRD,
  que pede geração por template.

## Escopo

### Incluído

- Rota `GET /boletins/[id]/pdf`.
- Geração server-side do PDF.
- Download com nome padronizado:
  - diário: `BI_CFO_2026_N005_02-06-2026.pdf`
  - período: `BI_CFO_2026_N006_01-06-2026_a_03-06-2026.pdf`
- Botões de download para BI aprovado.
- Documento A4 com cabeçalho institucional, número/ano, data, período, cinco partes,
  "Sem alteração", campo de aprovação e rodapé.

### Fora do Escopo Desta Fatia

- Supabase Storage e persistência de `pdf_url`.
- Versionamento real de PDFs.
- QR Code, assinatura eletrônica ou código de validação criptográfico.
- Busca no repositório documental por conteúdo do PDF.

## Arquitetura

### `lib/pdf/bulletin-data.ts`

Carrega e valida os dados mínimos para o PDF:

- autenticação/permissão fica na rota;
- busca `bulletins`;
- exige `status = 'aprovado'`;
- busca `bulletin_items` visíveis;
- não importa nem consulta `records`.

### `lib/pdf/bulletin-document.tsx`

Define o template React-PDF. Recebe dados já carregados e agrupa itens por parte.
Partes vazias exibem "Sem alteração".

### `lib/pdf/filename.ts`

Gera o nome padronizado e seguro do arquivo.

### `app/boletins/[id]/pdf/route.ts`

Rota server-side que:

- exige sessão Supabase;
- chama o loader;
- renderiza PDF;
- retorna `application/pdf`;
- define `Content-Disposition: attachment`.

## Regras de Negócio

- PDF só pode ser gerado para BI aprovado.
- PDF usa somente `bulletin_items.visible = true`.
- PDF não lê `records`.
- Se uma parte não tiver itens visíveis, mostra "Sem alteração".
- O rodapé inclui data/hora de geração, versão e paginação.

## Erros

- Usuário sem sessão: redirecionar/retornar 401.
- BI inexistente: 404.
- BI não aprovado: 409 com mensagem clara.
- Falha de renderização: 500.

## Verificação

- `npm run lint`.
- `npm run build`.
- Teste manual com BI `3/2026` aprovado:
  - botão de PDF aparece;
  - download retorna arquivo `.pdf`;
  - PDF abre e contém o item validado;
  - partes vazias mostram "Sem alteração";
  - não há consultas a `records` em `lib/pdf` nem na rota.

