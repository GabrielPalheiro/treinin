import { expect, test, type Page } from "@playwright/test";
import { clienteDoUsuarioE2E } from "./supabase-local";

// Fatia 2 — fluxo principal da sessão. Substituição e "Pulei" entram no E2E do PR 3.

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
