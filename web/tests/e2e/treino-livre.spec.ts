import { expect, test, type Page } from "@playwright/test";
import { clienteDoUsuarioE2E } from "./supabase-local";

// Treino livre: sessão sem ficha, com um exercício do catálogo e outro criado na hora.
// Roda depois de sessao.spec.ts: usa a ficha dele (Upper X → Lower X) e o histórico do Supino E2E.

test.beforeAll(async () => {
  // O último teste de sessão deixa um Upper X aberto: fecha, para a rotação sugerir o Lower X.
  const sb = await clienteDoUsuarioE2E();
  await sb
    .from("workout_sessions")
    .update({ finished_at: new Date().toISOString() })
    .is("finished_at", null)
    .throwOnError();
});

const cartao = (page: Page, nome: string) =>
  page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: nome }) });
const series = (page: Page, nome: string) => page.getByRole("list", { name: `Séries de ${nome}` }).getByRole("listitem");

test("treino livre: dois exercícios, um criado na hora, sem mexer na rotação", async ({ page }) => {
  await page.goto("/hoje");
  await expect(page.getByRole("heading", { name: "Lower X" })).toBeVisible();
  await page.getByRole("group", { name: "Ou escolha outro treino" }).getByRole("button", { name: "Treino livre" }).click();
  await page.waitForURL(/\/treino\/sessao\/[0-9a-f-]{36}$/);

  await expect(page.getByRole("heading", { level: 1, name: "Treino livre" })).toBeVisible();
  await expect(page.getByText("Adicione o primeiro exercício abaixo.")).toBeVisible();
  const adicionar = page.getByRole("region", { name: "Adicionar exercício" });

  // Do catálogo, com a última vez das sessões da ficha
  await adicionar.getByRole("searchbox").fill("Supino E2E");
  await adicionar.getByRole("button", { name: "Supino E2E" }).click();
  const supino = cartao(page, "Supino E2E");
  await expect(supino).toContainText("Última vez · hoje");
  await expect(supino).not.toContainText("Fora da ficha");
  await supino.getByRole("button", { name: "Série", exact: true }).click();
  await expect(series(page, "Supino E2E")).toHaveCount(1);

  // Criado na hora
  await adicionar.getByRole("searchbox").fill("Barra fixa E2E");
  await adicionar.getByRole("button", { name: "Criar “Barra fixa E2E” no catálogo" }).click();
  const barra = cartao(page, "Barra fixa E2E");
  await expect(barra).toContainText("Primeira vez");
  await barra.getByRole("button", { name: "Série", exact: true }).click();
  await barra.getByRole("radio", { name: "corporal" }).click();
  await barra.getByLabel("Reps", { exact: true }).fill("8");
  await barra.getByRole("button", { name: "Registrar" }).click();
  await expect(series(page, "Barra fixa E2E").nth(0)).toContainText("8");

  await page.getByRole("button", { name: "Finalizar treino" }).click();
  await page.waitForURL(/\/hoje$/);
  await expect(page.getByRole("link", { name: /Treino livre concluído hoje/ })).toBeVisible();
  // A rotação ignora o treino livre: continua sugerindo o Lower X
  await expect(page.getByRole("heading", { name: "Lower X" })).toBeVisible();

  // Na próxima sessão, a última vez vem do treino livre
  await page.getByRole("button", { name: "Começar Lower X" }).click();
  await page.waitForURL(/\/treino\/sessao\/[0-9a-f-]{36}$/);
  const foraDaFicha = page.getByRole("region", { name: "Exercício fora da ficha" });
  await foraDaFicha.getByRole("searchbox").fill("Barra fixa E2E");
  await foraDaFicha.getByRole("button", { name: "Barra fixa E2E" }).click();
  await expect(cartao(page, "Barra fixa E2E")).toContainText("Última vez · hoje");
  await page.getByRole("button", { name: "Finalizar treino" }).click();
  await page.waitForURL(/\/hoje$/);
});
