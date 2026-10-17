import { expect, test, type Page } from "@playwright/test";
import { clienteDoUsuarioE2E } from "./supabase-local";

// Fatia 2 — sessão de treino: fluxo principal, e a sessão completa com substituição e exercício pulado.

function diasAtras(dias: number) {
  // Data de calendário em São Paulo, como o app grava.
  const data = new Date(Date.now() - dias * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(data);
}

test.beforeAll(async () => {
  const sb = await clienteDoUsuarioE2E();
  const { data: ex } = await sb
    .from("exercises")
    .insert([{ name: "Supino E2E" }, { name: "Remada E2E" }])
    .select("id, name")
    .throwOnError();
  const supino = ex.find((e) => e.name === "Supino E2E")!;
  const remada = ex.find((e) => e.name === "Remada E2E")!;

  const { data: ficha } = await sb.from("workout_plans").insert({ name: "Ficha sessão" }).select("id").single().throwOnError();
  const { data: treinos } = await sb
    .from("workout_templates")
    .insert([
      { workout_plan_id: ficha.id, name: "Upper X", position: 1 },
      { workout_plan_id: ficha.id, name: "Lower X", position: 2 },
    ])
    .select("id, name")
    .throwOnError();
  const upper = treinos.find((t) => t.name === "Upper X")!;
  const lower = treinos.find((t) => t.name === "Lower X")!;
  await sb
    .from("planned_exercises")
    .insert([
      { workout_template_id: upper.id, exercise_id: supino.id, position: 1, target_sets: 2, rep_min: 8, rep_max: 10 },
      { workout_template_id: upper.id, exercise_id: remada.id, position: 2, target_sets: 3, rep_min: 10, rep_max: 12 },
    ])
    .throwOnError();
  const { data: deLower } = await sb
    .from("exercises")
    .insert([{ name: "Legpress E2E" }, { name: "Cadeira E2E" }])
    .select("id, name")
    .throwOnError();
  await sb
    .from("planned_exercises")
    .insert([
      { workout_template_id: lower.id, exercise_id: deLower.find((e) => e.name === "Legpress E2E")!.id, position: 1, target_sets: 3, rep_min: 10, rep_max: 12 },
      { workout_template_id: lower.id, exercise_id: deLower.find((e) => e.name === "Cadeira E2E")!.id, position: 2, target_sets: 2, rep_min: 12, rep_max: 15 },
    ])
    .throwOnError();
  await sb.rpc("activate_workout_plan", { plan_id: ficha.id }).throwOnError();

  // Sessão de 3 dias atrás, do Lower X, com supino: dá a "última vez" e faz a rotação sugerir o Upper X.
  const { data: passada } = await sb
    .from("workout_sessions")
    .insert({ date: diasAtras(3), workout_template_id: lower.id, finished_at: new Date().toISOString() })
    .select("id")
    .single()
    .throwOnError();
  const { data: log } = await sb
    .from("exercise_logs")
    .insert({ workout_session_id: passada.id, exercise_id: supino.id })
    .select("id")
    .single()
    .throwOnError();
  await sb
    .from("set_logs")
    .insert([
      { exercise_log_id: log.id, position: 1, load: 60, load_unit: "Kg", reps: 10 },
      { exercise_log_id: log.id, position: 2, load: 60, load_unit: "Kg", reps: 8 },
    ])
    .throwOnError();
});

const cartao = (page: Page, nome: string) =>
  page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: nome }) });
const series = (page: Page, nome: string) => page.getByRole("list", { name: `Séries de ${nome}` }).getByRole("listitem");

test("registrar uma sessão: começar, séries pré-preenchidas, editar e finalizar", async ({ page }) => {
  // Hoje sugere o próximo da rotação
  await page.goto("/hoje");
  await expect(page.getByRole("heading", { name: "Upper X" })).toBeVisible();
  await page.getByRole("button", { name: "Começar Upper X" }).click();
  await page.waitForURL(/\/treino\/sessao\/[0-9a-f-]{36}$/);

  // Cartões na ordem da ficha, com a última vez
  const supino = cartao(page, "Supino E2E");
  await expect(supino).toContainText("2 × 8–10");
  await expect(supino).toContainText("Última vez · há 3 dias");
  await expect(supino).toContainText("60 kg × 10, 8");
  await expect(cartao(page, "Remada E2E")).toContainText("Primeira vez");

  // "+ Série": um toque, pré-preenchida com a correspondente da última vez
  await supino.getByRole("button", { name: "Série", exact: true }).click();
  await expect(series(page, "Supino E2E")).toHaveCount(1);
  await expect(series(page, "Supino E2E").nth(0)).toContainText("60 kg × 10");
  await supino.getByRole("button", { name: "Série", exact: true }).click();
  await expect(series(page, "Supino E2E")).toHaveCount(2);
  await expect(series(page, "Supino E2E").nth(1)).toContainText("60 kg × 8");
  await expect(supino).toContainText("2 de 2 séries");

  // Ajustar no próprio cartão, com vírgula
  await series(page, "Supino E2E").nth(1).getByRole("button").click();
  await supino.getByLabel("Carga", { exact: true }).fill("62,5");
  await supino.getByLabel("Reps", { exact: true }).fill("9");
  await supino.getByRole("button", { name: "Salvar" }).click();
  await expect(series(page, "Supino E2E").nth(1)).toContainText("62,5 kg × 9");

  // Sem última vez: abre os campos vazios
  const remada = cartao(page, "Remada E2E");
  await remada.getByRole("button", { name: "Série", exact: true }).click();
  await remada.getByRole("button", { name: "Registrar" }).click();
  await expect(remada.getByText("Informe a carga")).toBeVisible();
  await expect(remada.getByText("Informe as reps")).toBeVisible();
  await remada.getByLabel("Carga", { exact: true }).fill("4");
  await remada.getByRole("radio", { name: "placas" }).click();
  await remada.getByLabel("Reps", { exact: true }).fill("12");
  await remada.getByRole("button", { name: "Registrar" }).click();
  await expect(series(page, "Remada E2E").nth(0)).toContainText("4 placas × 12");

  // A próxima repete a anterior de hoje
  await remada.getByRole("button", { name: "Série", exact: true }).click();
  await expect(series(page, "Remada E2E")).toHaveCount(2);
  await expect(series(page, "Remada E2E").nth(1)).toContainText("4 placas × 12");

  // Remover uma série
  await series(page, "Remada E2E").nth(1).getByRole("button").click();
  await remada.getByRole("button", { name: "Remover" }).click();
  await expect(series(page, "Remada E2E")).toHaveCount(1);

  // Sobrevive a recarregar; Hoje oferece continuar
  await page.reload();
  await expect(series(page, "Supino E2E")).toHaveCount(2);
  const urlDaSessao = page.url();
  await page.goto("/hoje");
  await expect(page.getByText("Treino em andamento")).toBeVisible();
  await page.getByRole("link", { name: "Continuar" }).click();
  await expect(page).toHaveURL(urlDaSessao);

  // Finalizar com observação
  await page.getByLabel("Observação da sessão (opcional)").fill("15 min de esteira");
  await page.getByRole("button", { name: "Finalizar treino" }).click();
  await page.waitForURL(/\/hoje$/);
  await expect(page.getByText("concluído hoje")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Lower X" })).toBeVisible(); // rotação andou

  await page.getByRole("link", { name: /Upper X concluído hoje/ }).click();
  await expect(page.getByText("15 min de esteira")).toBeVisible();
  await expect(page.getByRole("button", { name: "Finalizar treino" })).toHaveCount(0);
});


test("sessão completa com substituição, exercício pulado, fora da ficha e nota", async ({ page }) => {
  // Roda depois do primeiro teste: o Upper X foi finalizado, a rotação sugere o Lower X.
  await page.goto("/hoje");
  await page.getByRole("button", { name: "Começar Lower X" }).click();
  await page.waitForURL(/\/treino\/sessao\/[0-9a-f-]{36}$/);

  // Troquei por… (criando o exercício na hora)
  await page.getByRole("button", { name: "Mais opções de Legpress E2E" }).click();
  await page.getByRole("button", { name: "Troquei por…" }).click();
  await page.getByRole("searchbox").first().fill("Agachamento E2E");
  await page.getByRole("button", { name: "Criar “Agachamento E2E” no catálogo" }).click();
  const agachamento = cartao(page, "Agachamento E2E");
  await expect(agachamento).toContainText("No lugar de Legpress E2E");
  await expect(agachamento).toContainText("3 × 10–12"); // a prescrição continua
  await expect(agachamento).toContainText("Primeira vez");
  await agachamento.getByRole("button", { name: "Série", exact: true }).click();
  await agachamento.getByLabel("Carga", { exact: true }).fill("80");
  await agachamento.getByLabel("Reps", { exact: true }).fill("10");
  await agachamento.getByRole("button", { name: "Registrar" }).click();
  await expect(series(page, "Agachamento E2E").nth(0)).toContainText("80 kg × 10");

  // Pulei, com nota; desfazer e pular de novo
  const cadeira = cartao(page, "Cadeira E2E");
  await cadeira.getByRole("button", { name: "Mais opções de Cadeira E2E" }).click();
  await cadeira.getByRole("button", { name: "Pulei" }).click();
  await cadeira.getByLabel("Por que pulou? (opcional)").fill("aparelho ocupado");
  await cadeira.getByRole("button", { name: "Marcar como pulado" }).click();
  await expect(cadeira).toContainText("Pulado · aparelho ocupado");
  await expect(cadeira.getByRole("button", { name: "Série", exact: true })).toHaveCount(0);
  await cadeira.getByRole("button", { name: "Desfazer" }).click();
  await expect(cadeira.getByRole("button", { name: "Série", exact: true })).toBeVisible();
  await cadeira.getByRole("button", { name: "Mais opções de Cadeira E2E" }).click();
  await cadeira.getByRole("button", { name: "Pulei" }).click();
  await cadeira.getByRole("button", { name: "Marcar como pulado" }).click();
  await expect(cadeira).toContainText("Pulado");

  // Fora da ficha, com a última vez de hoje cedo
  const foraDaFicha = page.getByRole("region", { name: "Exercício fora da ficha" });
  await foraDaFicha.getByRole("searchbox").fill("Supino E2E");
  await foraDaFicha.getByRole("button", { name: "Supino E2E" }).click();
  const supino = cartao(page, "Supino E2E");
  await expect(supino).toContainText("Fora da ficha");
  await expect(supino).toContainText("Última vez · hoje");
  await supino.getByRole("button", { name: "Série", exact: true }).click();
  await expect(series(page, "Supino E2E").nth(0)).toContainText("60 kg × 10");

  // Nota no exercício
  await supino.getByRole("button", { name: "Mais opções de Supino E2E" }).click();
  await supino.getByRole("button", { name: "Nota" }).click();
  await supino.getByLabel("Nota sobre Supino E2E").fill("pegada aberta");
  await supino.getByRole("button", { name: "Salvar nota" }).click();
  await expect(supino).toContainText("Nota: pegada aberta");

  // Fora da ficha também sai da sessão
  await foraDaFicha.getByRole("searchbox").fill("Remada E2E");
  await foraDaFicha.getByRole("button", { name: "Remada E2E" }).click();
  const remada = cartao(page, "Remada E2E");
  await remada.getByRole("button", { name: "Mais opções de Remada E2E" }).click();
  await remada.getByRole("button", { name: "Remover da sessão" }).click();
  await remada.getByRole("button", { name: "Remover", exact: true }).click();
  await expect(cartao(page, "Remada E2E")).toHaveCount(0);

  // Tudo sobrevive a recarregar
  await page.reload();
  await expect(cartao(page, "Agachamento E2E")).toContainText("No lugar de Legpress E2E");
  await expect(cartao(page, "Cadeira E2E")).toContainText("Pulado");
  await expect(cartao(page, "Supino E2E")).toContainText("Nota: pegada aberta");

  await page.getByRole("button", { name: "Finalizar treino" }).click();
  await page.waitForURL(/\/hoje$/);

  // Na próxima sessão, a última vez segue o exercício feito, e o pulado não conta
  await page.getByRole("button", { name: "Começar Upper X" }).click();
  await page.waitForURL(/\/treino\/sessao\/[0-9a-f-]{36}$/);
  const proxima = page.getByRole("region", { name: "Exercício fora da ficha" });
  await proxima.getByRole("searchbox").fill("Agachamento E2E");
  await proxima.getByRole("button", { name: "Agachamento E2E" }).click();
  await expect(cartao(page, "Agachamento E2E")).toContainText("80 kg × 10");
  await proxima.getByRole("searchbox").fill("Cadeira E2E");
  await proxima.getByRole("button", { name: "Cadeira E2E" }).click();
  await expect(cartao(page, "Cadeira E2E")).toContainText("Primeira vez");
});