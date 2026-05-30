# M7 — Arquivamento Simples de PDF — Design

**Marco:** M7 parcial
**Data:** 2026-05-30
**Status:** aprovado para implementação

## Contexto

O M6 gera download de PDF sob demanda para BI aprovado, mas o arquivo ainda não é
persistido. Esta fatia cria o primeiro repositório documental: salvar o PDF gerado
em Supabase Storage e registrar o caminho no boletim.

## Escopo

### Incluído

- Bucket privado `bulletins` no Supabase Storage.
- Campos em `public.bulletins`:
  - `pdf_path`
  - `pdf_generated_at`
  - `pdf_generated_by`
- Action "Arquivar PDF" para BI aprovado.
- Download do PDF arquivado quando existir.
- Botões na tela de gestão do BI.

### Fora do Escopo

- Tela completa de repositório com filtros.
- Versionamento real de PDFs.
- Substituição/retificação formal.
- QR Code ou assinatura eletrônica.

## Arquitetura

O gerador do M6 continua sendo a fonte única para o PDF. O M7 adiciona uma camada de
armazenamento:

1. carregar BI aprovado e itens visíveis;
2. renderizar PDF com o template do M6;
3. gerar caminho padronizado no bucket;
4. fazer upload no Storage privado;
5. gravar metadados em `bulletins`;
6. baixar o arquivo arquivado por rota autenticada.

## Regras

- Só Admin/Coordenação pode arquivar PDF.
- Só BI `aprovado` pode ser arquivado.
- O PDF arquivado não consulta `records`.
- Se o PDF já estiver arquivado, a action pode sobrescrever o mesmo caminho para a
  mesma versão atual do MVP.
- Download do arquivo arquivado exige sessão e perfil Admin/Coordenação nesta fatia.

## Verificação

- `npm test`
- `npm run lint`
- `npm run build`
- Teste manual com BI `3/2026`:
  - arquivar PDF;
  - confirmar `pdf_path` preenchido;
  - baixar PDF arquivado;
  - confirmar arquivo abre como PDF.

