# BI-CFO — Sistema de Boletim Interno do CFO

Sistema web institucional para o **Curso de Formação de Oficiais (CFO)** da Academia Bombeiro Militar — CBMAP.

Centraliza o registro da rotina acadêmico-militar, aplica validação da Coordenação e gera o **Boletim Interno** oficial em PDF a partir de itens validados e congelados.

> **Estado atual:** Marco **M4 — Validação da Coordenação**. Já implementados: fundação técnica + auth (M0), cadastros institucionais (M1), escalas (M2), Livro de Dia + tabela central `records` (M3) e o fluxo de validação da Coordenação — fila com filtros, validar/devolver/classificar, edição do texto de publicação e histórico imutável em `record_events` (M4). Veja `Apoio/_decisoes.md` (DT-003) para a invariante do fluxo documental. A geração do Boletim Interno em PDF (`bulletins`/`bulletin_items`) entra a partir do M5.

---

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript** strict
- **Tailwind CSS v4**
- **Supabase** (PostgreSQL + Auth + Storage + RLS)
- **Vercel** (deploy)

---

## Pré-requisitos

- Node.js 20+
- npm 10+
- Conta no [Supabase](https://supabase.com) com projeto criado
- Git

---

## Setup local

1. **Clone o repositório.**
   ```powershell
   git clone <URL_DO_REMOTO> bi-cfo
   cd bi-cfo
   ```

2. **Instale as dependências.**
   ```powershell
   npm install
   ```

3. **Configure variáveis de ambiente.**
   Copie `.env.example` para `.env.local` e preencha com as chaves do seu projeto Supabase (Project Settings → API):

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```

   `.env.local` é ignorado pelo Git e **nunca** deve ser commitado.

4. **Aplique as migrações Supabase.**
   Pelo Dashboard → SQL Editor, execute em ordem:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_seed_profiles.sql`

5. **Crie o administrador inicial** (procedimento manual, ver cabeçalho de `supabase/migrations/0003_seed_admin.sql`):
   - Dashboard → Authentication → Users → **Add user**:
     - Email: `admin@abm.br`
     - Password: senha forte aleatória (anote em gerenciador de senhas)
     - Auto confirm user: **sim**
   - Confirme que `Authentication → Providers → Email`:
     - `Confirm email`: **desligado**
     - `Magic link`: **desligado**
   - Execute `supabase/migrations/0003_seed_admin.sql` no SQL Editor.

6. **Rode o servidor de desenvolvimento.**
   ```powershell
   npm run dev
   ```
   Acesse http://localhost:3000.

7. **Login.** Use `admin` + a senha que você definiu no passo 5.

---

## Scripts

| Comando         | O que faz                                  |
|-----------------|--------------------------------------------|
| `npm run dev`   | Servidor de desenvolvimento (Turbopack)    |
| `npm run build` | Build de produção                          |
| `npm run start` | Servidor de produção (após build)          |
| `npm run lint`  | ESLint                                     |

---

## Estrutura

```
.
├── app/                 # Rotas Next.js (App Router)
│   ├── layout.tsx       # Cabeçalho institucional
│   ├── page.tsx         # Redireciona para /login ou /dashboard
│   ├── login/           # Tela de login institucional
│   └── dashboard/       # Rota protegida (M0: vazia, só identidade do usuário)
├── lib/
│   ├── auth/            # Constantes de auth (domínio @abm.br)
│   └── supabase/        # Clientes browser e server
├── proxy.ts             # Proteção de rotas + refresh de sessão Supabase (Next 16: antigo middleware.ts)
├── supabase/
│   └── migrations/      # SQL versionado (profiles, users, RLS, seed)
└── Apoio/               # Documentos de especificação e decisões técnicas
    ├── *.docx           # PRD, Domain Map, User Stories, Modelo Conceitual
    └── _decisoes.md     # Decisões técnicas formais (DT-001, DT-002, ...)
```

---

## Roadmap de marcos

| Marco | Entrega                                                        | Estado |
|-------|----------------------------------------------------------------|--------|
| M0    | Fundação técnica + autenticação                                | em curso |
| M1    | Cadastros institucionais (alunos, pelotões, instrutores, etc.) | pendente |
| M2    | Escalas                                                        | pendente |
| M3    | Livro de Dia + Registros                                       | pendente |
| M4    | Validação da Coordenação                                       | pendente |
| M5    | Boletim Interno + prévia                                       | pendente |
| M6    | Geração de PDF (a partir de `bulletin_items`)                  | pendente |
| M7    | Repositório documental                                         | pendente |
| M8    | Auditoria + hardening                                          | pendente |

---

## Princípio arquitetural inegociável

> **O PDF do Boletim Interno NUNCA é gerado a partir do Livro de Dia.**

O fluxo é, e permanecerá:

```
Livro de Dia  →  Registros  →  Validação da Coordenação
              →  Boletim Interno  →  PDF  →  Arquivo
```

Detalhes em `Apoio/_decisoes.md` (DT-003).

---

## Documentação

- `Apoio/PRD - ...docx` — Product Requirements Document
- `Apoio/Domain Map - ...docx` — Mapa de domínios e bounded contexts
- `Apoio/User Stories e Critérios de Aceite - ...docx` — 35 US do MVP
- `Apoio/Modelo Conceitual de Dados - ...docx` — Modelo de dados
- `Apoio/_decisoes.md` — Decisões técnicas formais

---

## Segurança

- Nunca commitar `.env.local` ou qualquer arquivo com `SUPABASE_SERVICE_ROLE_KEY`.
- RLS está habilitada por padrão em todas as tabelas.
- Dados sensíveis (saúde, disciplinar em apuração) **nunca** entram no PDF — ver DT-003.

---

## Licença

Privado / institucional CBMAP.
