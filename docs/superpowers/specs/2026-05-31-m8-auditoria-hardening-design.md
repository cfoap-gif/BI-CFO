# M8 — Auditoria + Hardening — Design

**Marco:** M8
**Data:** 2026-05-31
**Status:** aprovado para planejamento

## Objetivo

Fechar lacunas de rastreabilidade e segurança do fluxo documental sem expandir o MVP para um console administrativo amplo. O M8 transforma os históricos existentes em auditoria operacional legível, registra a decisão técnica do repositório documental e adiciona checks automatizados para invariantes críticas.

## Escopo

Inclui:
- Exibir autor legível nos históricos de validação (`record_events`) e boletins (`bulletin_events`).
- Preservar a RLS restrita de `public.users`; a UI não deve precisar liberar leitura ampla da tabela de usuários.
- Registrar a DT-008 com a estratégia M7/M8 para Storage, metadados `pdf_*`, retenção simples e ausência de versionamento real no MVP.
- Adicionar testes/checks automatizados para invariantes de PDF, arquivo, eventos append-only e uso indevido de service role.
- Revisar mensagens e guards de rotas/Server Actions críticas para falha segura.

Não inclui:
- Console global de auditoria com busca em todos os eventos.
- Versionamento real de PDFs arquivados.
- Gestão administrativa de usuários ou reset de senha.
- Políticas por pelotão ou regras refinadas para Coordenador de Pelotão.

## Decisão de Design

O M8 segue uma abordagem de auditoria operacional enxuta. Em vez de criar novas tabelas de auditoria paralelas, ele usa os eventos já existentes (`record_events` e `bulletin_events`) e melhora a apresentação e os checks ao redor deles.

Para mostrar autores, será criada uma função SQL `SECURITY DEFINER` com `search_path = public`, sem liberar SELECT amplo em `public.users`. Ela expõe somente o necessário para auditoria: `id`, `login`, `full_name`, `war_name`, `profile_name` e `active`. Isso mantém a decisão DT-002 válida: `public.users` continua protegida, mas telas autorizadas conseguem resolver nomes de autores de eventos.

O M8 também formaliza a decisão que ficou pendente após o M7: o Storage privado `bulletins` guarda o PDF oficial vigente do boletim, e `bulletins.pdf_path/pdf_generated_at/pdf_generated_by` apontam para esse arquivo. No MVP, sobrescrever o PDF arquivado de um BI aprovado é permitido apenas para Administrador/Coordenação e não cria versões históricas.

## Componentes

### Banco de Dados

Nova migration `0018_audit_actor_display.sql`:
- cria helper seguro para resolver autores;
- mantém `public.users` sem policy de leitura global;
- adiciona grants mínimos para `authenticated`;
- cria comentários SQL explícitos citando DT-002 e M8.

A função será `public.audit_actor_display_by_ids(uuid[])`, retornando somente colunas não sensíveis para os IDs solicitados. Ela não retorna usuários fora da lista recebida e não aceita filtros textuais amplos.

### Biblioteca de Auditoria

Novo módulo TypeScript em `lib/audit/actors.ts`:
- recebe um cliente Supabase server-side e uma lista de UUIDs;
- chama o helper SQL;
- retorna um mapa `user_id -> display_name`;
- formata fallback estável para autores ausentes, inativos ou removidos.

Formato de display recomendado:
- `war_name` quando existir;
- senão `full_name`;
- senão `login`;
- senão `Usuário não identificado`.

### Telas

Atualizar:
- `app/validacao/[id]/page.tsx`;
- `app/boletins/[id]/page.tsx`.

Ambas passam a selecionar `created_by` nos eventos, resolver autores via `lib/audit/actors.ts` e exibir autor + data no histórico.

Não haverá página nova de auditoria neste marco.

### Documentação

Atualizar `Apoio/_decisoes.md` com DT-008:
- bucket privado `bulletins`;
- metadados `pdf_path`, `pdf_generated_at`, `pdf_generated_by`;
- download arquivado sempre por rota autenticada;
- M7/M8 não implementam versionamento real nem retenção avançada;
- sobrescrita controlada do PDF vigente é aceitável no MVP.

Atualizar README para marcar M8 como “em curso” ou “implementado” somente no fim da implementação.

## Fluxo de Dados

1. A página de detalhe carrega o registro ou boletim.
2. A página carrega seus eventos, incluindo `created_by`.
3. A página extrai os UUIDs únicos de autores.
4. `lib/audit/actors.ts` chama o helper SQL de auditoria.
5. A UI monta cada evento com tipo, nota, data/hora e autor legível.

O fluxo não altera como eventos são gravados. Eventos continuam append-only e continuam referenciando `auth.users(id)`.

## Segurança e Erros

Falha ao resolver nomes de autores não deve impedir a visualização do histórico. A tela deve exibir `Usuário não identificado` e continuar renderizando os eventos.

O helper SQL não pode expor e-mail, IDs de perfil internos, dados de autenticação ou qualquer campo fora da lista mínima de auditoria. A RLS de `public.users` permanece como está para consultas diretas.

Checks automatizados devem proteger contra:
- uso de `.from("records")` dentro de `lib/pdf` e rotas de PDF/arquivo;
- uso de `SUPABASE_SERVICE_ROLE_KEY` em arquivos client ou rotas que não precisem dele;
- policies de evento com UPDATE/DELETE;
- rota de arquivo/PDF sem guard Admin/Coordenação.

## Testes e Verificação

Automatizados:
- testes unitários para formatação de autores em `lib/audit/actors.ts`;
- teste/check textual para garantir que `lib/pdf` e rotas de PDF/arquivo não consultam `records`;
- teste/check textual para garantir que `record_events` e `bulletin_events` continuam sem policies de UPDATE/DELETE;
- teste/check textual para impedir service role fora de locais explicitamente permitidos.

Manuais:
- histórico de validação mostra autor legível;
- histórico de boletim mostra autor legível;
- usuário sem perfil Admin/Coordenação continua sem acesso a `/validacao`, `/boletins`, `/boletins/[id]/pdf` e `/boletins/[id]/arquivo`;
- PDF arquivado continua baixando após M8.

## Critérios de Aceite

- Históricos de registros e boletins exibem autor legível, data/hora e nota.
- `public.users` não ganha leitura global ampla.
- DT-008 está registrada.
- `npm test`, `npm run lint` e `npm run build` passam.
- Checks automatizados cobrem as invariantes críticas citadas.
- Nenhuma rota ou helper de PDF passa a depender de `records`.

## Riscos

- Uma view mal configurada pode expor dados demais de `public.users`; por isso a preferência é helper SQL com retorno explícito.
- Eventos antigos podem apontar para usuários removidos ou inconsistentes; fallback de display é obrigatório.
- Checks textuais são simples e úteis, mas não substituem revisão de RLS no Supabase Dashboard após aplicar migrations.
