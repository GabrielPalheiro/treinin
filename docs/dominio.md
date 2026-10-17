# Linguagem ubíqua — TreinIn

> **Um conceito tem um nome só.** O mesmo nome no código, na tabela, na rota, na tela e na
> conversa. Consulte este glossário **antes** de nomear qualquer coisa.
>
> Conceito novo só nasce depois de ser adicionado aqui.

## Convenção de idioma

| O quê | Idioma | Exemplo |
|---|---|---|
| Nome do conceito (tipo TypeScript) | Inglês, PascalCase | `WorkoutSession`, `SetLog`, `MealEntry` |
| Tabela e coluna no Postgres | Inglês, snake_case, tabela no plural | `workout_sessions`, `kcal_per_100g` |
| Comportamento e regra (função, variável) | Português | `sugerirProximoTreino()`, `ultimaVez` |
| Rota da aplicação | Português | `/treino`, `/dieta/alimentos` |
| Documentação, commit, nome de teste | Português | `feat(treino): pre-preencher serie com a ultima vez` |
| Texto visível ao usuário | Português (pt-BR) | "Adicionar série" |

---

## Ator

| Termo | Definição | **Não** chamar de |
|---|---|---|
| **Usuário** (`User`) | O dono dos dados. No v1 existe um só, criado manualmente no Supabase. Cadastro público desabilitado | Aluno, Atleta, Cliente, Conta |

> `user_id` é a coluna que liga cada linha ao usuário. Vem **sempre** de `auth.uid()`, nunca do formulário.

---

## Treino

### Exercise — Exercício
Item do catálogo de exercícios do usuário: "Mesa flexora", "Supino reto máquina".
O nome é único por usuário. O mesmo exercício pode aparecer em vários treinos da ficha.

> ❌ Não chame de `Movement`, `Lift` nem `Activity`.

### WorkoutPlan — Ficha
O conjunto de treinos vigente, normalmente passado por um treinador. **Só uma ficha fica ativa
por vez.** Quando a ficha muda, cria-se uma nova; a antiga é arquivada e o histórico continua
apontando para ela.

| Estado | Coluna | Significado |
|---|---|---|
| **Ativa** | `active = true` | A ficha em uso: dela vêm os treinos sugeridos. No máximo uma por usuário |
| **Inativa** | `active = false`, `archived_at` nulo | Cadastrada, ainda não em uso (ex.: a próxima ficha sendo montada) |
| **Arquivada** | `archived_at` preenchido | Ficha antiga. Só leitura; o histórico continua apontando para ela. Nunca ativa |

**Ativar** uma ficha desativa a anterior na mesma operação. **Arquivar** é definitivo no v1.

> ❌ Não chame de `Program`, `Routine` nem `Split`.

### WorkoutTemplate — Treino
Um treino dentro da ficha: "Lower A", "Upper A", "Lower B", "Upper B". Tem **ordem**
(`position`), que define a rotação. O nome é único dentro da ficha.

> ❌ Não chame de `Day` nem `Workout` sozinho. "Treino de hoje" é uma `WorkoutSession`.

### PlannedExercise — Exercício prescrito
Um exercício dentro de um treino, com a prescrição:

| Campo | Exemplo |
|---|---|
| `exercise_id` | Mesa flexora |
| `position` | 1 |
| `target_sets` | 2 |
| `rep_min` · `rep_max` | 8 · 10 |
| `technique` | "Segurar 2 s na fase alongada de cada rep." (opcional) |

Na tela, a prescrição aparece como **"2 × 8–10"** (séries × faixa de reps), ou **"3 × 10"** quando
`rep_min = rep_max`. Limites: 1 a 10 séries; 1 a 100 reps; `rep_min ≤ rep_max`.

### WorkoutSession — Sessão
Um treino **feito** numa data. Aponta para o `WorkoutTemplate` usado (opcional: pode ser uma
sessão avulsa) e tem uma observação livre ("15 min de cardio na esteira").

### ExerciseLog — Exercício executado
O que aconteceu com um exercício dentro de uma sessão.

| Campo | Significado |
|---|---|
| `exercise_id` | O exercício **efetivamente feito** |
| `planned_exercise_id` | O exercício prescrito que ele cumpre (opcional) |
| `status` | `Done` · `Skipped` |
| `note` | Observação livre: "dor no joelho", "pegada neutra" |

> **Substituição** não é um estado: é um `ExerciseLog` cujo `exercise_id` difere do exercício do
> `PlannedExercise`. Ex.: prescrito Legpress 45, feito Agachamento guiado.

### SetLog — Série
Uma série de trabalho registrada.

| Campo | Significado |
|---|---|
| `position` | 1ª, 2ª, 3ª série |
| `load` | Carga. Nulo quando `load_unit = Bodyweight` |
| `load_unit` | `LoadUnit` |
| `reps` | Repetições feitas |

Cada série tem **sua própria** carga e repetições — a carga pode mudar dentro do mesmo exercício.

### LoadUnit — Unidade de carga

| Valor | Rótulo na tela | Exemplo |
|---|---|---|
| `Kg` | kg | 65 kg |
| `Plates` | placas | 4 placas (marcação da máquina) |
| `Bodyweight` | peso corporal | abdominal no chão |

> Cargas só são comparadas **na mesma unidade**. 4 placas e 40 kg não se comparam.

---

## Regras do treino

**Última vez.** Para cada exercício, o app mostra o último `ExerciseLog` com `status = Done`
daquele `Exercise`, de qualquer sessão anterior, com todas as séries. A busca é **por exercício,
não por treino**: a Cadeira extensora do Lower B mostra a do Lower A, se ela foi a mais recente.

**Próximo treino sugerido.** O `WorkoutTemplate` seguinte ao da sessão mais recente, na ordem da
ficha ativa. Depois do último, volta ao primeiro. Sem sessões, sugere o primeiro. É sugestão:
o usuário pode escolher outro.

**Série pré-preenchida.** "Adicionar série" já traz a carga, a unidade e as repetições da série
correspondente da última vez. Sem última vez, vem vazio.

**Sugestão de progressão** *(Fatia 4)*. Se, na última vez, **todas** as séries atingiram o
`rep_max` com a mesma carga e unidade, o app sugere aumentar a carga.

---

## Dieta

### Food — Alimento
Item com nome e `kcal_per_100g`.

| `source` | Significado | Editável? |
|---|---|---|
| `Taco` | Vem da Tabela Brasileira de Composição de Alimentos (TACO/UNICAMP), carregada por seed | Não |
| `Custom` | Cadastrado pelo usuário (whey da marca X, pão da padaria) | Sim |

> ❌ Não chame de `Ingredient`, `Product` nem `Item`.

### Meal — Refeição

| Valor | Rótulo na tela |
|---|---|
| `Breakfast` | Café da manhã |
| `Lunch` | Almoço |
| `Snack` | Lanche |
| `Dinner` | Jantar |
| `Supper` | Ceia |

### MealEntry — Registro de refeição
Um alimento comido numa data e refeição: `date`, `meal`, `food_id`, `grams`, `kcal`.

> ❌ Não chame de `FoodLog`, `Consumption` nem `Diet`.

---

## Regras da dieta

**Cálculo.** `kcal = kcal_per_100g × grams ÷ 100`, arredondado para o inteiro mais próximo.

**Snapshot.** O `kcal` é **gravado** no `MealEntry` no momento do registro. Corrigir um alimento
depois não altera o histórico. Editar a quantidade de um registro recalcula com o valor atual
do alimento.

**Total do dia.** Não é entidade: é a soma dos `kcal` dos `MealEntry` daquela data, também
mostrada por refeição.

**Copiar refeição.** Copia os `MealEntry` de uma refeição de outro dia para a data atual, já
recalculados, para o usuário só ajustar as gramas.

---

## Vocabulário de tempo e quantidades

| Termo | Definição |
|---|---|
| **Data** | Data de calendário, sem hora. Coluna `date`. Sessões e refeições pertencem a uma data, não a um instante |
| **Hoje** | Calculado no fuso `America/Sao_Paulo`, por uma função de relógio injetável. Nunca `new Date()` direto na regra |
| **Carga** | Número decimal (ex.: 58,5). Separador decimal na tela é vírgula |
| **Gramas** | Número decimal maior que zero |
| **kcal** | Inteiro |

---

## Termos proibidos

| Proibido | Use |
|---|---|
| `Workout` sozinho, `Day` | `WorkoutTemplate` (o da ficha) ou `WorkoutSession` (o feito) |
| `Program`, `Routine`, `Split` | `WorkoutPlan` |
| `Movement`, `Lift` | `Exercise` |
| `Set` sozinho | `SetLog` (colide com `Set` do JavaScript) |
| `Weight` para carga | `load` (peso pode ser o corporal) |
| `FoodLog`, `Consumption` | `MealEntry` |
| `Ingredient`, `Product` | `Food` |
| `Calories` como entidade | `kcal` é um campo; o total do dia é uma soma |
| `Manager`, `Helper`, `Utils`, `Service` genérico | O nome do conceito que falta |
| **Treinin**, **TreinIN**, **Trein-In** | **TreinIn** — T e I maiúsculos |
