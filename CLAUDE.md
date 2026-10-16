# CLAUDE.md — Regras do projeto TreinIn

Lido automaticamente pelo Claude Code em toda sessão neste repositório.
É a **fonte da verdade** sobre como se trabalha aqui. Em conflito com qualquer outra orientação,
este arquivo vence.

---

## 1. O que é este projeto

**TreinIn** — T e I maiúsculos. Caderno de treino e dieta no celular: registrar o treino série
por série, com a última vez ao lado, e as refeições do dia com as calorias calculadas sozinhas.

Produto da **GP.Tech**. Autor: Gabriel Palheiros.

### Objetivos, nesta ordem

1. **Uso pessoal real, rápido** — um usuário só, o autor.
2. **Simplicidade** — o mínimo de peças. Sem API separada, custo zero.
3. **Crescer por features** — sem reescrita.

Quando houver dúvida entre "mais elegante" e "mais simples e no ar", escolha o segundo.

### Fora de escopo no v1 — não sugerir, não implementar

- API separada (.NET ou qualquer outra)
- Cadastro público, multiusuário na interface
- Importação da planilha antiga
- Macronutrientes, metas, gráficos avançados, cronômetro
- App nativo (o v1 é PWA por manifest)
- Integração com APIs externas de nutrição ou dispositivos

---

## 2. Stack

| Camada | Tecnologia | Observação |
|---|---|---|
| Framework | Next.js (App Router) + React + TypeScript `strict` | Server Components + Server Actions |
| Banco | PostgreSQL no Supabase | Local via `supabase start` |
| Auth | Supabase Auth com `@supabase/ssr` | E-mail e senha; cadastro público desligado |
| Autorização | Row Level Security | Em **todas** as tabelas |
| Migrations | Supabase CLI | `supabase/migrations/*.sql` |
| Tipos do banco | `supabase gen types typescript` | Nunca escritos à mão |
| Estilo | Tailwind CSS + shadcn/ui | Só tokens |
| Formulários | React Hook Form + Zod | Mesmo schema no form e na action |
| Testes | Vitest · Playwright | |
| Hospedagem | Vercel | |

**Não troque nenhum item sem registrar a decisão em `docs/blueprint.md` (seção 7).**
Biblioteca nova: pergunte antes de instalar.

---

## 3. Princípios

### 3.1 Regra no domínio, testada primeiro
Toda regra de negócio (`ultimaVez`, `sugerirProximoTreino`, `preencherSerie`, `calcularKcal`,
`totalDoDia`…) mora em `src/domain/`, como função pura, e nasce de um teste que falha.
**Red → Green → Refactor.** Componentes e actions só chamam o domínio.

### 3.2 `domain/` não conhece ninguém
Não importa React, Next, Supabase, `features/`, `app/` nem `lib/`. Garantido por lint.

### 3.3 Segurança no banco
- Toda tabela do usuário: `user_id uuid not null default auth.uid()` + RLS por `auth.uid()`
- `user_id` **nunca** vem de formulário, parâmetro ou rota
- Migration nova de tabela sem RLS é reprovada na revisão
- `service_role` nunca no front nem na Vercel

### 3.4 Linguagem ubíqua
O nome no código é o de `docs/dominio.md`. `WorkoutSession`, não `Workout`. `SetLog`, não `Set`.
`load`, não `weight`. `MealEntry`, não `FoodLog`.

### 3.5 Mobile-first de verdade
Projetar em 360 px primeiro. Alvos de toque ≥ 48 px. `inputmode="decimal"` em carga, reps e
gramas, aceitando vírgula. Registrar uma série não abre modal.

### 3.6 Design system
Nenhuma cor, espaçamento, raio, sombra ou fonte literal em componente. Só tokens, claro e escuro.

### 3.7 Tempo
- Datas de sessão e refeição são `date`, sem hora
- "Hoje" vem de uma função de relógio injetável, no fuso `America/Sao_Paulo`
- Nunca `new Date()` direto em regra de negócio

---

## 4. Como trabalhar aqui

1. **Entender** — leia `docs/dominio.md` antes de nomear qualquer coisa
2. **Planejar** — para algo não trivial, apresente o plano e aguarde aprovação
3. **Testar** — o teste da regra primeiro
4. **Implementar** — o mínimo para passar
5. **Verificar** — `pnpm lint`, `pnpm typecheck`, `pnpm test`
6. **Documentar** — atualize o documento que ficou obsoleto, no mesmo PR

### Fatias
O trabalho segue `docs/roadmap.md`. **Nunca comece a Fatia N+1 antes da Fatia N estar pronta**:
mergeada com CI verde, publicada e em uso.

### Branches, commits e PRs
- Branch curta por atividade: `feat/`, `fix/`, `refactor/`, `test/`, `docs/`, `chore/`
- Conventional Commits em português. Escopos: `treino`, `ficha`, `dieta`, `auth`, `db`, `ui`, `ci`, `docs`
- Squash merge; nenhum push direto na `main`

```
feat(treino): pre-preencher serie com a ultima vez
fix(dieta): arredondar kcal para o inteiro mais proximo
test(treino): cobrir rotacao quando o ultimo treino e o ultimo da ficha
chore(db): adicionar migration de set_logs com rls
```

### Migrations
- Uma migration por mudança, no mesmo PR da feature
- Migration mesclada na `main` **nunca é editada** — corrige-se com uma nova
- Depois de mudar o esquema, regenere os tipos: `pnpm db:types`

---

## 5. O que nunca fazer

- ❌ Regra de negócio dentro de componente ou Server Action
- ❌ Tabela sem RLS
- ❌ `user_id` vindo da requisição
- ❌ Tipos do banco escritos à mão
- ❌ `new Date()` em regra de negócio
- ❌ Cor, espaçamento ou fonte literal
- ❌ `any` ou `@ts-ignore`
- ❌ Classe ou arquivo `Manager`, `Helper`, `Utils` ou `Service` genérico
- ❌ Editar migration já mesclada
- ❌ Commitar `.env.local`, chave do Supabase ou senha
- ❌ Adicionar dependência sem perguntar
- ❌ Sugerir API separada, multiusuário ou importação da planilha no v1

---

## 6. Ambiente

| Item | Valor |
|---|---|
| Sistema | Windows 11 nativo |
| Terminal | PowerShell 7 no Windows Terminal |
| Editor | VS Code |
| Raiz do repositório | `D:\TreinIn` |
| Docker | Docker Desktop (necessário para o Supabase local) |

- Comandos em **PowerShell**: `$env:NOME`, caminhos com `\`
- Sem `export`, `chmod`, `sudo`, `rm -rf`, `cat`, `ls`
- Fim de linha **LF**, forçado pelo `.gitattributes`

## 7. Comandos

> Funcionam a partir da Fatia 0.

```powershell
# Banco local (Docker Desktop aberto)
supabase start
supabase db reset          # reaplica migrations e seed (apaga os usuários locais)
supabase test db           # testes pgTAP de RLS em supabase/tests
supabase migration new nome_da_mudanca
supabase stop

# App
Set-Location web
pnpm dev
pnpm test                  # Vitest
pnpm test:e2e              # Playwright
pnpm lint
pnpm typecheck
pnpm db:types              # regenera os tipos a partir do banco local
Set-Location ..
```

---

## 8. Mapa dos documentos

| Preciso de… | Leia |
|---|---|
| Visão geral, arquitetura, decisões | `docs/blueprint.md` |
| O que fazer agora | `docs/roadmap.md` |
| Como nomear as coisas | `docs/dominio.md` |
| Setup do zero: ferramentas, Supabase, Vercel, GitHub | `docs/primeiros-passos.md` |
| Erros que já aconteceram e como foram corrigidos | `docs/incidentes/` |

## 9. Estado atual

**Fatia atual: 1 — Ficha.** A Fatia 0 está concluída: publicada na Vercel, Supabase de produção
`TreinIn` em `sa-east-1` (ligado via `supabase link`), app instalado no celular.

Notas do que já existe:
- Next.js 16: `cacheComponents` ligado. Ler cookies, sessão ou relógio só dentro de `<Suspense>`
  (com `await connection()` quando não há outra leitura de requisição). Antes de usar uma API do
  Next, consulte `web/node_modules/next/dist/docs/` — ver `web/AGENTS.md`.
- O antigo `middleware` agora é `web/src/proxy.ts`
- Supabase: `@/lib/supabase/servidor` (Server Components e Actions) e `sessao-no-proxy`
- Relógio: `hoje(relogio)` em `@/domain/tempo/hoje`; `relogioDoSistema` em `@/lib/relogio`
- Tokens: `web/src/app/globals.css`; espelho em hex para manifest e ícones em `cores-do-tema.ts`.
  Alvo de toque: `h-toque` / `size-toque`
- `cn` vem do pacote `cn` (oficial do shadcn), não de um arquivo `utils`
