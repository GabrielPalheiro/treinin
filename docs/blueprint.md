# TreinIn — Blueprint do Produto

> **Projeto:** TreinIn
> **Organização:** GP.Tech
> **Autor:** Gabriel Palheiros
> **Documento:** Blueprint v1 — escopo, arquitetura e roadmap
> **Data:** 16/10/2026
> **Status:** Definido — pronto para execução

---

## 1. Propósito do projeto

TreinIn é um caderno de treino e dieta no celular: registrar o que foi feito na academia, série
por série, e o que foi comido, refeição por refeição, com as calorias do dia calculadas sozinhas.

**Objetivos, nesta ordem:**

1. **Uso pessoal real, rápido.** Substituir a planilha de treino e começar a controlar a dieta.
   O primeiro e único usuário do v1 é o autor.
2. **Simplicidade.** Menos peças possível: sem API separada, sem servidor para manter, custo zero.
3. **Crescer por features.** Novas funcionalidades entram aos poucos, sem reescrita.

**Consequência prática desta ordem:** este projeto **não** carrega a cerimônia do Renmember
(Clean Architecture em 4 projetos, release-please, contrato gerado). Ele carrega só o que protege
o dado e a regra: login, isolamento por usuário, migrations versionadas e testes nas regras.

### Nome

**TreinIn** — T e I maiúsculos. Nunca "Treinin", "TreinIN" ou "Trein-In".

| Uso | Forma |
|---|---|
| Nome do produto | TreinIn |
| Repositório | `treinin` (público) |
| Pasta local | `D:\TreinIn` |
| Pacote web | `treinin-web` |

### Não-objetivos do v1

- Não é multiusuário: um usuário, criado à mão no Supabase. Cadastro público desligado.
- Não importa a planilha antiga. **O histórico começa do zero.**
- Não calcula macronutrientes (proteína, carboidrato, gordura). Só kcal.
- Não tem metas, gráficos avançados, cronômetro de descanso nem app nativo.
- Não integra com relógio, balança ou apps de terceiros.

---

## 2. O problema

| Dor (da planilha e do dia a dia) | Como o TreinIn resolve |
|---|---|
| Comparar com a última vez exige rolar colunas | Cada exercício mostra **a última vez** ao lado, série por série |
| Colunas sem data: não se sabe quando cada sessão aconteceu | Toda `WorkoutSession` tem data |
| Digitar "65kg x 10,8" no celular, no meio da série | "Adicionar série" já vem **pré-preenchida** com a última vez; ajusta-se só o que mudou |
| Unidades misturadas ("4br", "no chão", "lado") | `LoadUnit`: kg, placas, peso corporal |
| Substituições e exercícios pulados viram texto solto | Ações "Troquei por…" e "Pulei" com nota |
| Calorias exigem consulta manual e conta de cabeça | Tabela TACO + cálculo automático + total por refeição e por dia |
| Comer parecido todo dia e digitar tudo de novo | "Copiar refeição" de outro dia |

---

## 3. Modelo de domínio

Os nomes oficiais estão em `docs/dominio.md`.

```
User
 ├── Exercises                       catálogo: Mesa flexora, Supino reto máquina…
 ├── WorkoutPlans                    a ficha (uma ativa por vez)
 │    └── WorkoutTemplates           Lower A, Upper A… (ordem = rotação)
 │         └── PlannedExercises      exercício · séries alvo · faixa de reps · técnica
 ├── WorkoutSessions                 data · treino usado · observação
 │    └── ExerciseLogs               exercício feito · prescrito que cumpre · Done/Skipped · nota
 │         └── SetLogs               ordem · carga · unidade · reps
 ├── Foods (Custom)                  alimentos próprios
 └── MealEntries                     data · refeição · alimento · gramas · kcal (snapshot)

Foods (Taco)                         compartilhados, só leitura, carregados por seed
```

### Decisões de modelagem

- **Prescrição separada da execução.** A ficha diz o que fazer; a sessão registra o que foi feito.
  Trocar a ficha não mexe no histórico.
- **Série é linha.** Cada `SetLog` tem carga e reps próprias, porque elas variam conforme o dia.
- **Substituição é dado, não estado.** Um `ExerciseLog` aponta para o exercício feito e,
  opcionalmente, para o prescrito que ele cumpre.
- **"Última vez" é consulta, não coluna.** Calculada por exercício a partir do histórico.
- **kcal é snapshot.** Gravada no registro; corrigir o alimento não reescreve o passado.

---

## 4. Arquitetura e stack

### Visão geral

```
┌──────────────────────────────────────────┐
│  Next.js (App Router) · TypeScript       │   Vercel (Hobby) · gratuito
│  Server Components + Server Actions      │
│  PWA mobile-first                        │
└───────────────────┬──────────────────────┘
                    │ supabase-js (sessão em cookie)
┌───────────────────▼──────────────────────┐
│  Supabase (plano gratuito)               │
│  Auth (e-mail + senha)                   │
│  PostgreSQL + Row Level Security         │
└──────────────────────────────────────────┘
```

Não existe API própria. O Next.js lê no servidor (Server Components) e grava por Server Actions.
A segurança dos dados não depende do código da aplicação: **está no banco, via RLS**.

### Stack

| Item | Escolha | Por quê |
|---|---|---|
| Framework | Next.js (App Router) | Front e back no mesmo projeto; mesma base dos outros projetos da GP.Tech |
| Linguagem | TypeScript `strict` | Não negociável |
| Banco | PostgreSQL no Supabase | Relacional, gratuito, com auth integrada |
| Auth | Supabase Auth, e-mail e senha, via `@supabase/ssr` | Login pronto, sessão em cookie `httpOnly` |
| Autorização | Row Level Security em todas as tabelas | O isolamento vale mesmo se o código errar |
| Migrations | Supabase CLI (`supabase/migrations/*.sql`) | SQL versionado no repositório |
| Tipos do banco | `supabase gen types typescript` | Tipos gerados, nunca escritos à mão |
| Estilo | Tailwind CSS + shadcn/ui | Velocidade, só tokens |
| Formulários | React Hook Form + Zod | Mesmo schema no form e na Server Action |
| Estado | Server Components + Server Actions + `revalidatePath` | Sem biblioteca de cache no v1 |
| Testes | Vitest (regras) · Playwright (fluxos) | Regras puras com tabela de casos; E2E dos fluxos de academia e dieta |
| Hospedagem | Vercel | Deploy a cada merge na `main`, preview a cada PR |
| Instalável | Web App Manifest | Ícone na tela inicial do celular, abre em tela cheia |

**Por que sem API .NET:** o objetivo aqui é "rápido e prático". Uma API separada seria mais uma
peça para hospedar, com cold start, sem ganho para um usuário só. O dado está em Postgres comum:
se um dia fizer sentido uma API .NET (app nativo, integração), ela lê o mesmo banco sem migração.

**Por que sem Google Sheets:** não tem login para a aplicação, relacionar alimentos com registros
vira fórmula entre abas, e consultas por data e por exercício ficam lentas e frágeis.

### Organização do código

```
web/
  src/
    app/
      (auth)/entrar/              login
      (app)/hoje/                 tela inicial: treino sugerido + kcal do dia
      (app)/treino/               sessão em andamento e histórico
      (app)/ficha/                cadastro da ficha e do catálogo de exercícios
      (app)/dieta/                registros do dia, alimentos
    domain/                       regras puras, sem Supabase nem React
      treino/                     ultimaVez, sugerirProximoTreino, preencherSerie, sugerirProgressao
      dieta/                      calcularKcal, totalDoDia, copiarRefeicao
      tempo/                      relógio injetável, "hoje" em America/Sao_Paulo
    features/                     componentes + server actions + schemas Zod, por feature
      treino/
      ficha/
      dieta/
    lib/supabase/                 clientes server/browser, tipos gerados
  tests/e2e/                      Playwright
supabase/
  migrations/                     SQL versionado
  seed.sql                        TACO + dados de desenvolvimento
```

**A única regra de dependência:** `domain/` não importa nada de `app/`, `features/`, `lib/`,
React ou Supabase. É código puro, testado por unidade. Verificado por regra de lint
(`no-restricted-imports`).

### Segurança

- Cadastro público **desligado** no Supabase. O usuário é criado pelo painel.
- Toda tabela do usuário tem `user_id uuid not null default auth.uid()` e RLS
  `using (user_id = auth.uid())` para leitura e escrita.
- `foods` com `source = 'Taco'`: leitura para qualquer usuário autenticado, escrita negada.
- A chave `service_role` **nunca** vai para o front nem para a Vercel no v1.
- Teste de RLS: com dois usuários de teste no banco local, um não lê nem altera o dado do outro.

### Ambientes

| Ambiente | Banco | Como |
|---|---|---|
| Local | Supabase local (`supabase start`, roda em Docker) | Migrations e seed aplicados no `supabase db reset` |
| Preview (PR) | Supabase de produção, **somente leitura de quem já está logado** | Deploy de preview da Vercel |
| Produção | Supabase (plano gratuito) | `supabase db push` no merge, depois deploy da Vercel |

> No plano gratuito do Supabase, projetos ociosos por um período são pausados. Com uso diário
> isso não acontece. Conferir as regras vigentes ao criar a conta.

---

## 5. Experiência de uso

**Mobile-first de verdade.** O registro acontece entre séries, com uma mão, suado.

- Botões de pelo menos 48 px, ações principais embaixo, ao alcance do polegar
- Teclado numérico (`inputmode="decimal"`) para carga, reps e gramas, aceitando vírgula
- Uma tela por sessão de treino, exercícios em cartões na ordem da ficha
- Nada de modal para registrar uma série: edição direta no cartão
- Funciona bem em 360 px de largura e em modo escuro (academia, tela no brilho mínimo)

### Fluxo do treino

1. Tela **Hoje** sugere o próximo treino da rotação → "Começar Upper A"
2. Cada cartão: nome, prescrição (2 × 8–10, técnica) e **última vez** (75 kg × 9, 7 · há 4 dias)
3. "+ Série" já preenchida → confirma ou ajusta
4. Menu do cartão: "Troquei por…" · "Pulei" · nota
5. "Finalizar" com observação da sessão (cardio, sensação)

### Fluxo da dieta

1. Tela **Dieta** de hoje, agrupada por refeição, com total por refeição e total do dia
2. "+ Alimento" na refeição → busca com sugestões dos mais usados → gramas → kcal aparece na hora
3. "Copiar de…" para repetir uma refeição de outro dia
4. Navegação entre dias por setas e calendário

---

## 6. Roadmap

Detalhado em `docs/roadmap.md`.

| Fatia | Entrega | Sessões |
|---|---|---|
| 0 | Fundação: projeto, Supabase, login, deploy, CI | ~2 |
| 1 | Ficha: catálogo de exercícios e treinos prescritos | ~2 |
| 2 | Sessão de treino: séries, última vez, pular, trocar | ~4 |
| 3 | Dieta: TACO, registros, total do dia, copiar refeição | ~3 |
| 4 | Histórico: sessões passadas, evolução de carga, média de kcal | ~3 |

**Meta:** registrando treino de verdade ao fim da Fatia 2, e dieta ao fim da Fatia 3.

---

## 7. Decisões arquiteturais registradas

| # | Decisão | Alternativa descartada | Justificativa |
|---|---|---|---|
| 001 | Next.js full-stack sem API separada | Next.js + API .NET | Uma peça a menos; sem cold start; um usuário |
| 002 | Supabase (Postgres + Auth) | Google Sheets; Neon + Auth.js | Login pronto e RLS no banco; Sheets não tem auth nem relação |
| 003 | Row Level Security como fronteira de segurança | Filtrar `user_id` só no código | Isolamento garantido pelo banco, mesmo com bug na aplicação |
| 004 | Série como linha (`SetLog`) | "séries × reps × peso" num registro | Carga e reps variam por série conforme o dia |
| 005 | Prescrição (ficha) separada de execução (sessão) | Só registrar o que foi feito | Mostra a meta, permite rotação e troca de ficha sem perder histórico |
| 006 | kcal gravada no registro (snapshot) | Calcular sempre pelo alimento | Corrigir um alimento não reescreve o passado |
| 007 | Tabela TACO como base de alimentos | API externa de nutrição | Pública, brasileira, offline no próprio banco, sem chave nem custo |
| 008 | Regras em `domain/` puro | Regras dentro de componentes e actions | Testáveis por unidade, sem banco e sem React |
| 009 | Sem importação da planilha | Parser do histórico antigo | Texto livre inconsistente; começar do zero é mais rápido e confiável |
| 010 | PWA por manifest | App nativo | Instalável no celular com o mesmo código |

---

## 8. Riscos

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Registrar na academia ser lento e o app ser abandonado | Alta | Pré-preenchimento pela última vez; meta de no máximo 2 toques por série; testar de verdade na academia ao fim da Fatia 2 |
| Scope creep (macros, gráficos, metas) | Alta | Backlog explícito; ideia nova entra lá |
| Vazamento de dados por erro de RLS | Baixa/Crítica | RLS em toda tabela desde a primeira migration + teste com dois usuários |
| Projeto pausado no plano gratuito | Baixa | Uso diário; se acontecer, reativar no painel |
| TACO sem um alimento usado com frequência | Alta | Alimento `Custom` desde a Fatia 3 |
| Fuso errado fazer o registro da noite cair no dia seguinte | Média | "Hoje" sempre em `America/Sao_Paulo` por relógio injetável, com teste |

---

## 9. Backlog pós-v1

Macronutrientes (TACO já traz os dados) · Meta diária de kcal · Treino livre, sem ficha (detalhe
em `docs/roadmap.md`) · Peso corporal e medidas ·
Cronômetro de descanso entre séries · Gráficos por exercício · Funcionamento offline na academia
com sincronização · Exportar CSV · Treino compartilhado pelo treinador · Múltiplos usuários

**Regra:** ideia nova entra aqui, nunca na fatia em andamento.
