# Roadmap — TreinIn

## A regra que governa este roadmap

O ritmo de trabalho é **irregular**. Por isso o roadmap não tem datas: tem **fatias verticais**,
e cada uma termina com algo **publicado e usado**.

"Pronto" significa:

1. Mergeado na `main` por PR, com **CI verde**
2. Publicado na Vercel, com as migrations aplicadas no Supabase de produção
3. Usado de verdade pelo autor no celular

**Não se começa a Fatia N+1 antes da Fatia N cumprir os três itens.**

Unidade de estimativa: **sessão** ≈ 3 horas de trabalho concentrado.

---

## Fatia 0 — Fundação · ~2 sessões
**Entregável: abrir o link no celular, entrar com usuário e senha, ver a tela inicial**

- [x] Repositório `treinin` criado; `web/` com Next.js, TypeScript `strict`, Tailwind e shadcn/ui
- [x] Tokens do design system definidos (claro e escuro) antes do primeiro componente
- [x] Supabase local (`supabase start`) e projeto de produção criados (`sa-east-1`)
- [x] Primeira migration: nada além do necessário para o login funcionar
      — o login usa só o schema `auth`; nenhuma migration na Fatia 0, a primeira vem na Fatia 1
- [x] Cadastro público desligado; usuário do autor criado pelo painel
- [x] Tela `/entrar` e proxy (`src/proxy.ts`, o antigo middleware) protegendo as rotas do app
- [x] Shell do app: navegação inferior com **Hoje**, **Treino**, **Dieta**
- [x] Relógio injetável e função "hoje" em `America/Sao_Paulo`, com teste
- [x] Lint com `no-restricted-imports` impedindo `domain/` de importar o resto
- [x] Web App Manifest e ícones: instalável na tela inicial
- [x] CI no PR: lint, typecheck, Vitest, build
- [x] Deploy na Vercel conectado à `main`; preview por PR

**Pronto quando:** o app está instalado no seu celular e pede login. ✅ Concluída em 16/10/2026.

---

## Fatia 1 — Ficha · ~2 sessões
**Entregável: a ficha atual do treinador está dentro do app**

- [x] Migrations: `exercises`, `workout_plans`, `workout_templates`, `planned_exercises`, com RLS
- [x] Teste de RLS com dois usuários no banco local
- [x] Tipos gerados com `supabase gen types`
- [x] Catálogo de exercícios: criar, renomear, buscar (nome único por usuário)
- [x] Ficha: criar, nomear, ativar (só uma ativa) e arquivar
- [x] Treinos da ficha: criar, ordenar (rotação), prescrever exercícios com séries, faixa de reps e técnica
- [x] Reordenar exercícios dentro do treino
- [x] E2E: montar um treino com três exercícios (`pnpm test:e2e`, só local)

**Pronto quando:** sua ficha atual (Lower A, Upper A, Lower B, Upper B) está cadastrada. ✅ Concluída em 16/10/2026.

---

## Fatia 2 — Sessão de treino · ~4 sessões
**Entregável: a planilha é aposentada**

- [ ] Migrations: `workout_sessions`, `exercise_logs`, `set_logs`, com RLS
- [ ] `domain/treino` por TDD, com tabela de casos:
      `sugerirProximoTreino`, `ultimaVez` (por exercício, só `Done`), `preencherSerie`
- [ ] Tela **Hoje**: sugestão do próximo treino e "Começar"
- [ ] Tela da sessão: cartões na ordem da ficha, prescrição e última vez (com "há N dias")
- [ ] "+ Série" pré-preenchida; editar e remover série no próprio cartão
- [ ] `LoadUnit`: kg, placas, peso corporal
- [ ] "Pulei" com nota; "Troquei por…" escolhendo outro exercício do catálogo
- [ ] Adicionar exercício fora da ficha na sessão
- [ ] Observação da sessão e "Finalizar"
- [ ] Retomar uma sessão do dia que não foi finalizada
- [ ] E2E: sessão completa com substituição e exercício pulado
- [ ] **Teste de campo:** usar numa sessão real e corrigir o que atrapalhou

**Pronto quando:** você treina uma semana inteira registrando só no TreinIn.

---

## Fatia 3 — Dieta · ~3 sessões
**Entregável: as calorias do dia aparecem sozinhas**

- [ ] Termos de uso da TACO conferidos; fonte citada na tela de alimentos
- [ ] Migration `foods` + seed com a TACO (nome e kcal por 100 g); RLS de leitura para `Taco`
- [ ] Migration `meal_entries`, com RLS
- [ ] `domain/dieta` por TDD: `calcularKcal` (arredondamento), `totalDoDia`, total por refeição
- [ ] Tela **Dieta**: dia atual agrupado por refeição, totais, navegação entre dias
- [ ] "+ Alimento": busca sem acento e sem diferenciar maiúsculas; mais usados primeiro
- [ ] Gramas com teclado decimal; kcal calculada na hora
- [ ] Alimento `Custom`: criar e editar
- [ ] "Copiar de…" outro dia para a refeição atual
- [ ] kcal do dia na tela **Hoje**
- [ ] E2E: registrar almoço, copiar para o dia seguinte e ajustar gramas

**Pronto quando:** você registra todas as refeições de uma semana.

---

## Fatia 4 — Histórico · ~3 sessões
**Entregável: enxergar a evolução**

- [ ] Lista de sessões passadas por data, com detalhe
- [ ] Página do exercício: todas as vezes que foi feito, série por série
- [ ] Evolução de carga por exercício (melhor série por sessão, separada por unidade)
- [ ] Sugestão de progressão no cartão da sessão (`sugerirProgressao`, por TDD)
- [ ] Dieta: média de kcal dos últimos 7 e 30 dias
- [ ] README com screenshots, stack e como rodar

**Pronto quando:** você responde "quanto eu pegava há um mês?" sem abrir nada além do app.

---

## Backlog — não priorizado

Macronutrientes · Meta diária de kcal · Peso corporal e medidas · Cronômetro de descanso ·
Offline na academia · Exportar CSV · Treino compartilhado pelo treinador · Múltiplos usuários

**Regra:** ideia nova entra aqui, nunca na fatia em andamento.
