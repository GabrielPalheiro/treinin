import { expect, test, type Page } from "@playwright/test";

// Fatia 1 — "E2E: montar um treino com três exercícios" (docs/roadmap.md).

async function adicionarExercicio(
  page: Page,
  nome: string,
  prescricao?: { series: string; min: string; max: string; tecnica?: string },
) {
  const secao = page.getByRole("region", { name: "Adicionar exercício" });
  await secao.getByRole("searchbox").fill(nome);
  await secao.getByRole("button", { name: `Criar “${nome}” no catálogo` }).click();
  await expect(secao.getByText(nome, { exact: true })).toBeVisible();
  if (prescricao) {
    await secao.getByLabel("Séries").fill(prescricao.series);
    await secao.getByLabel("Reps mín.").fill(prescricao.min);
    await secao.getByLabel("Reps máx.").fill(prescricao.max);
    if (prescricao.tecnica) await secao.getByLabel("Técnica (opcional)").fill(prescricao.tecnica);
  }
  await secao.getByRole("button", { name: "Adicionar ao treino" }).click();
  await expect(secao.getByRole("searchbox")).toHaveValue("");
}

// Só os visíveis: com cacheComponents, rotas já visitadas ficam escondidas na página (<Activity>).
const cartoes = (page: Page) => page.locator("main ol > li").filter({ visible: true });

test("montar um treino com três exercícios", async ({ page }) => {
  // Ficha nova
  await page.goto("/ficha");
  await page.getByLabel("Nova ficha").fill("Ficha E2E");
  await page.getByRole("button", { name: "Criar ficha" }).click();
  await page.waitForURL(/\/ficha\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { level: 1, name: "Ficha E2E" })).toBeVisible();
  await expect(page.getByText("Inativa")).toBeVisible();

  // Treino
  await page.getByLabel("Novo treino").fill("Lower A");
  await page.getByRole("button", { name: "Adicionar treino" }).click();
  await page.getByRole("link", { name: /Lower A/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Lower A" })).toBeVisible();

  // Três exercícios, criados no catálogo pelo próprio fluxo
  await adicionarExercicio(page, "Mesa flexora", { series: "2", min: "8", max: "10", tecnica: "Segurar 2 s na fase alongada" });
  await adicionarExercicio(page, "Cadeira extensora", { series: "3", min: "10", max: "10" });
  await adicionarExercicio(page, "Agachamento guiado");

  await expect(cartoes(page)).toHaveCount(3);
  await expect(cartoes(page).nth(0)).toContainText("Mesa flexora");
  await expect(cartoes(page).nth(0)).toContainText("2 × 8–10");
  await expect(cartoes(page).nth(0)).toContainText("Segurar 2 s na fase alongada");
  await expect(cartoes(page).nth(1)).toContainText("3 × 10");
  await expect(cartoes(page).nth(2)).toContainText("3 × 8–12"); // prescrição padrão

  // Reordenar: o terceiro sobe para segundo
  await page.getByRole("button", { name: "Subir Agachamento guiado" }).click();
  await expect(cartoes(page).nth(1)).toContainText("Agachamento guiado");
  await expect(cartoes(page).nth(2)).toContainText("Cadeira extensora");

  // Validação no cartão: mínimo maior que o máximo
  await page.getByRole("button", { name: "Editar Mesa flexora" }).click();
  const primeiro = cartoes(page).nth(0);
  await primeiro.getByLabel("Reps mín.").fill("12");
  await primeiro.getByLabel("Reps máx.").fill("6");
  await primeiro.getByRole("button", { name: "Salvar" }).click();
  await expect(primeiro.getByText("O mínimo de reps precisa ser menor ou igual ao máximo")).toBeVisible();

  // Editar de verdade
  await primeiro.getByLabel("Séries").fill("3");
  await primeiro.getByLabel("Reps mín.").fill("6");
  await primeiro.getByLabel("Reps máx.").fill("8");
  await primeiro.getByRole("button", { name: "Salvar" }).click();
  await expect(primeiro).toContainText("3 × 6–8");

  // A ordem sobrevive a recarregar a página
  await page.reload();
  await expect(cartoes(page).nth(0)).toContainText("Mesa flexora");
  await expect(cartoes(page).nth(1)).toContainText("Agachamento guiado");
  await expect(cartoes(page).nth(2)).toContainText("Cadeira extensora");

  // Remover (dois toques)
  await page.getByRole("button", { name: "Remover Cadeira extensora" }).click();
  await cartoes(page).nth(2).getByRole("button", { name: "Remover" }).click();
  await expect(cartoes(page)).toHaveCount(2);

  // Ativar a ficha e ver em /treino
  await page.getByRole("link", { name: "Ficha E2E" }).click();
  await page.getByRole("button", { name: "Ativar esta ficha" }).click();
  await expect(page.getByText("Ativa", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "Treino" }).last().click();
  await expect(page).toHaveURL(/\/treino$/);
  await expect(page.getByRole("heading", { name: "Ficha E2E" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Lower A.*2 exercícios/ })).toBeVisible();

  // Os exercícios criados no fluxo estão no catálogo
  await page.goto("/ficha/exercicios");
  await expect(page.getByText("3 exercícios")).toBeVisible();
});

test("nome de treino repetido na mesma ficha mostra erro", async ({ page }) => {
  await page.goto("/ficha");
  await page.getByLabel("Nova ficha").fill("Ficha repetida");
  await page.getByRole("button", { name: "Criar ficha" }).click();
  await page.waitForURL(/\/ficha\/[0-9a-f-]{36}$/);

  await page.getByLabel("Novo treino").fill("Upper A");
  await page.getByRole("button", { name: "Adicionar treino" }).click();
  await expect(page.getByRole("link", { name: /Upper A/ })).toBeVisible();
  await expect(page.getByLabel("Novo treino")).toHaveValue("");

  await page.getByLabel("Novo treino").fill("upper a");
  await page.getByRole("button", { name: "Adicionar treino" }).click();
  await expect(page.getByText("Já existe um treino com esse nome nesta ficha.")).toBeVisible();
});
