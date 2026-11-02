import { expect, test, type Page } from "@playwright/test";

// Fatia 3 — dieta: registrar o almoço, copiar para o dia seguinte e ajustar os gramas; alimento próprio.

function diasAtras(dias: number) {
  // Data de calendário em São Paulo, como o app grava.
  const data = new Date(Date.now() - dias * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(data);
}

const refeicao = (page: Page, nome: string) =>
  page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: nome }) });
const alimentosDe = (page: Page, nome: string) =>
  page.getByRole("list", { name: `Alimentos de ${nome}` }).getByRole("listitem");
const totalDoDia = (page: Page) => page.getByRole("navigation", { name: "Dia" });

async function registrar(page: Page, nomeDaRefeicao: string, busca: string, gramas: string) {
  const cartao = refeicao(page, nomeDaRefeicao);
  await cartao.getByRole("button", { name: "Alimento", exact: true }).click();
  await cartao.getByPlaceholder("Buscar alimento").fill(busca);
  await cartao.getByRole("list", { name: "Alimentos encontrados" }).getByRole("button").first().click();
  await cartao.getByLabel("Gramas").fill(gramas);
  await cartao.getByRole("button", { name: "Registrar" }).click();
}

test("registrar o almoço, copiar para o dia seguinte e ajustar os gramas", async ({ page }) => {
  // Ontem: almoço com arroz (128 kcal/100 g) e feijão (76 kcal/100 g), da TACO
  await page.goto(`/dieta?data=${diasAtras(1)}`);
  await expect(totalDoDia(page)).toContainText("Ontem");
  await registrar(page, "Almoço", "arroz tipo 1 cozido", "150");
  await expect(alimentosDe(page, "Almoço")).toHaveCount(1);
  await registrar(page, "Almoço", "feijao carioca cozido", "100");
  await expect(alimentosDe(page, "Almoço")).toHaveCount(2);
  await expect(alimentosDe(page, "Almoço").nth(0)).toContainText("150 g");
  await expect(alimentosDe(page, "Almoço").nth(0)).toContainText("192 kcal");
  await expect(alimentosDe(page, "Almoço").nth(1)).toContainText("76 kcal");
  await expect(totalDoDia(page)).toContainText("268 kcal");

  // Dia seguinte (hoje): "Copiar de…" sugere ontem
  await page.getByRole("link", { name: "Dia seguinte" }).click();
  await expect(totalDoDia(page)).toContainText("Hoje");
  const almoco = refeicao(page, "Almoço");
  await almoco.getByRole("button", { name: "Copiar de…" }).click();
  await expect(almoco.getByLabel("Copiar almoço de")).toHaveValue(diasAtras(1));
  await almoco.getByRole("button", { name: "Copiar", exact: true }).click();
  await expect(alimentosDe(page, "Almoço")).toHaveCount(2);
  await expect(totalDoDia(page)).toContainText("268 kcal");
  // Refeição com alimentos não oferece copiar de novo
  await expect(almoco.getByRole("button", { name: "Copiar de…" })).toHaveCount(0);

  // Ajustar os gramas do arroz: 100 g → 128 kcal
  await alimentosDe(page, "Almoço").nth(0).getByRole("button", { name: /^Editar/ }).click();
  await almoco.getByLabel("Gramas").fill("100");
  await expect(almoco.getByText("128 kcal")).toBeVisible();
  await almoco.getByRole("button", { name: "Salvar" }).click();
  await expect(alimentosDe(page, "Almoço").nth(0)).toContainText("100 g");
  await expect(totalDoDia(page)).toContainText("204 kcal");

  // Copiar de um dia sem nada avisa
  const jantar = refeicao(page, "Jantar");
  await jantar.getByRole("button", { name: "Copiar de…" }).click();
  await jantar.getByRole("button", { name: "Copiar", exact: true }).click();
  await expect(jantar.getByRole("alert")).toHaveText("Nada registrado nessa refeição no dia escolhido.");
  await jantar.getByRole("button", { name: "Cancelar" }).click();

  // A tela Hoje mostra as kcal do dia
  await page.goto("/hoje");
  await expect(page.getByRole("link", { name: /Dieta de hoje/ })).toContainText("204 kcal");

  // O dia anterior continua como estava
  await page.goto(`/dieta?data=${diasAtras(1)}`);
  await expect(totalDoDia(page)).toContainText("268 kcal");
});

test("alimento próprio: cadastrar pela busca e usar na refeição", async ({ page }) => {
  await page.goto("/dieta");
  const lanche = refeicao(page, "Lanche");
  await lanche.getByRole("button", { name: "Alimento", exact: true }).click();
  await lanche.getByPlaceholder("Buscar alimento").fill("Whey E2E");
  await expect(lanche.getByText("Nenhum alimento encontrado.")).toBeVisible();
  await lanche.getByRole("link", { name: "Cadastrar “Whey E2E” como alimento seu" }).click();

  await page.waitForURL(/\/dieta\/alimentos\?nome=/);
  await expect(page.getByLabel("Nome")).toHaveValue("Whey E2E");
  await page.getByLabel("kcal por 100 g").fill("400");
  await page.getByRole("button", { name: "Cadastrar" }).click();
  await expect(page.getByRole("button", { name: "Editar Whey E2E" })).toBeVisible();
  await expect(page.getByText("Fonte: TACO, 4ª ed., NEPA/UNICAMP, 2011.").filter({ visible: true })).toBeVisible();

  // De volta à Dieta, a busca continua aberta e já encontra o alimento novo
  await page.getByRole("main").getByRole("link", { name: "Dieta" }).click();
  await expect(lanche.getByRole("link", { name: /Cadastrar/ })).toHaveCount(0);
  await lanche.getByRole("button", { name: /^Whey E2E/ }).click();
  await lanche.getByLabel("Gramas").fill("30");
  await lanche.getByRole("button", { name: "Registrar" }).click();
  await expect(alimentosDe(page, "Lanche").nth(0)).toContainText("120 kcal");
});

test("meta diária: definir, ver quanto falta e o excedente, na Dieta e na tela Hoje", async ({ page }) => {
  // Roda depois dos dois testes acima: hoje tem 204 + 120 = 324 kcal.
  await page.goto("/hoje");
  const resumo = page.getByRole("link", { name: /Dieta de hoje/ });
  await expect(resumo).toContainText("Defina uma meta na Dieta");

  await page.goto("/dieta");
  await page.getByRole("button", { name: "Definir meta diária" }).click();
  const campo = page.getByLabel("Meta diária (kcal)");
  await campo.fill("499");
  await page.getByRole("button", { name: "Salvar meta" }).click();
  await expect(page.getByText("Use pelo menos 500 kcal")).toBeVisible();
  await campo.fill("2.000");
  await page.getByRole("button", { name: "Salvar meta" }).click();
  const meta = page.getByRole("button", { name: /^Ajustar meta diária/ });
  await expect(meta).toContainText("de 2.000 kcal · faltam 1.676");
  await expect(meta.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "16");

  // Ajustar abaixo do consumido: excedente em tom neutro, barra cheia
  await meta.click();
  await expect(campo).toHaveValue("2000");
  await campo.fill("500");
  await page.getByRole("button", { name: "Salvar meta" }).click();
  await expect(page.getByRole("button", { name: /^Ajustar meta diária/ })).toContainText("de 500 kcal · faltam 176");
  await registrar(page, "Jantar", "arroz tipo 1 cozido", "200"); // +256 kcal → 580
  await expect(page.getByRole("button", { name: /^Ajustar meta diária/ })).toContainText("de 500 kcal · 80 acima da meta");
  await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");

  await page.goto("/hoje");
  await expect(resumo).toContainText("580 kcal");
  await expect(resumo).toContainText("de 500 kcal · 80 acima da meta");
});
