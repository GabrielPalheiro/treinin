# Roadmap — TreinIn

## A regra que governa este roadmap

O ritmo de trabalho é **irregular**. Por isso o roadmap não tem datas: tem **fatias verticais**,
e cada uma termina com algo **publicado e usado**.

"Pronto" significa:

1. Mergeado na `main` por PR, com **CI verde**
2. Publicado na Vercel, com as migrations aplicadas no Supabase de produção
3. Usado de verdade pelo autor no celular

**Não se começa a Fatia N+1 antes da Fatia N cumprir os três itens.**

> **Exceção (29/10/2026):** a Fatia 3 começou com a Fatia 2 devendo só o item 3 (uso). Todo o
> código da Fatia 2 estava mergeado e publicado; faltava a semana de uso, que não depende de código.
> Condições: problema da academia tem prioridade sobre a Dieta, num PR `fix/` próprio; a Fatia 2
> só é marcada como concluída depois da semana de uso.

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

- [x] Migrations: `workout_sessions`, `exercise_logs`, `set_logs`, com RLS
- [x] `domain/treino` por TDD, com tabela de casos:
      `sugerirProximoTreino`, `ultimaVez` (por exercício, só `Done`), `preencherSerie`
- [x] Tela **Hoje**: sugestão do próximo treino e "Começar"
- [x] Tela da sessão: cartões na ordem da ficha, prescrição e última vez (com "há N dias")
- [x] "+ Série" pré-preenchida; editar e remover série no próprio cartão
- [x] `LoadUnit`: kg, placas, peso corporal
- [x] "Pulei" com nota; "Troquei por…" escolhendo outro exercício do catálogo
- [x] Adicionar exercício fora da ficha na sessão
- [x] Observação da sessão e "Finalizar"
- [x] Retomar uma sessão do dia que não foi finalizada
- [x] E2E: sessão completa com substituição e exercício pulado
- [ ] **Teste de campo:** usar numa sessão real e corrigir o que atrapalhou
      — em uso desde 29/10/2026, pelo autor e por outras pessoas com conta própria.
      Corrigido: escolha do treino do dia sempre à vista na tela Hoje (#12)

**Pronto quando:** você treina uma semana inteira registrando só no TreinIn.

---

## Fatia 3 — Dieta · ~3 sessões · em andamento, em paralelo com o uso da Fatia 2
**Entregável: as calorias do dia aparecem sozinhas**

- [x] Termos de uso da TACO conferidos: reprodução permitida citando a fonte (4ª ed., NEPA/UNICAMP, 2011)
- [ ] Fonte citada na tela de alimentos
- [x] Migration `foods` + TACO por migration (nome e kcal por 100 g; 593 de 597, 4 sem kcal na tabela); RLS de leitura para `Taco`
- [x] Migration `meal_entries`, com RLS
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

Macronutrientes · Meta diária de kcal · Treino livre (ver abaixo) · Peso corporal e medidas · Cronômetro de descanso ·
Offline na academia · Exportar CSV · Treino compartilhado pelo treinador · Múltiplos usuários ·
TBCA como base de alimentos (ver abaixo) · Código de barras para alimento próprio (ver abaixo)

### Treino livre
Para quem quer registrar o treino sem seguir uma ficha. Começa uma sessão vazia, adiciona os
exercícios que fizer (do catálogo ou criados na hora) e marca séries, carga e repetições. Tudo fica
guardado como as outras sessões, para consultar depois: histórico, "última vez" e evolução.

- **Base pronta:** o banco já aceita sessão sem treino da ficha (`workout_template_id` nulo) e
  registro sem exercício prescrito ("fora da ficha"), então não precisa de migration
- **Falta:** "Treino livre" na tela Hoje, a tela da sessão sem cartões da ficha e o nome mostrado
  no lugar do nome do treino

### TBCA como base de alimentos
A TBCA (USP/FoRC) é a sucessora da TACO: brasileira, atualizada (versão 7.x) e com mais alimentos,
incluindo preparações. Discutido em 30/10/2026, quando se decidiu manter a TACO no v1.

- **Antes de tudo:** conferir os termos de reuso e se há arquivo para download (tbca.net.br)
- **Como entraria:** nova migration de dados, com um novo valor em `food_source`; sem mudar a
  arquitetura. Decidir se substitui a TACO ou convive com ela

### Código de barras para alimento próprio
Ler o código de barras do produto e preencher nome e kcal por 100 g do alimento `Custom` pelo
Open Food Facts (gratuito, sem chave, ODbL: exige citar a fonte). Só preenche o cadastro: o
alimento continua guardado no banco, e a busca do dia a dia não depende da API.

- **Atenção:** integração externa, fora do escopo do v1 (`CLAUDE.md`); dados colaborativos,
  conferir com o rótulo

**Regra:** ideia nova entra aqui, nunca na fatia em andamento.
