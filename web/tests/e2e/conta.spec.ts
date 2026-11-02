import { expect, test } from "@playwright/test";
import { adminLocal, USUARIO_E2E } from "./supabase-local";

// Conta: trocar a senha dentro do app, com a nova digitada duas vezes.

const NOVA_SENHA = "nova-senha-e2e-456";

test.afterAll(async () => {
  // Os outros specs entram com a senha original do usuário de teste.
  const admin = adminLocal();
  const { data } = await admin.auth.admin.listUsers();
  const usuario = data.users.find((u) => u.email === USUARIO_E2E.email);
  if (!usuario) throw new Error("Usuário de teste não encontrado.");
  const { error } = await admin.auth.admin.updateUserById(usuario.id, { password: USUARIO_E2E.senha });
  if (error) throw error;
});

test("alterar a senha pela tela Conta e entrar com a nova", async ({ page, browser }) => {
  await page.goto("/hoje");
  await page.getByRole("link", { name: "Conta" }).click();
  await page.waitForURL(/\/conta$/);
  await expect(page.getByText(USUARIO_E2E.email)).toBeVisible();
  await expect(page.getByRole("button", { name: "Sair" })).toBeVisible();

  const novaSenha = page.getByLabel("Nova senha", { exact: true });
  const confirmacao = page.getByLabel("Repita a nova senha");
  const salvar = page.getByRole("button", { name: "Salvar nova senha" });

  // Validação no formulário
  await novaSenha.fill("curta");
  await confirmacao.fill("curta");
  await salvar.click();
  await expect(page.getByText("Use pelo menos 8 caracteres")).toBeVisible();

  await novaSenha.fill(NOVA_SENHA);
  await confirmacao.fill("outra-senha-e2e");
  await salvar.click();
  await expect(page.getByText("As senhas não conferem")).toBeVisible();

  // Erro do Supabase, traduzido
  await novaSenha.fill(USUARIO_E2E.senha);
  await confirmacao.fill(USUARIO_E2E.senha);
  await salvar.click();
  await expect(page.getByText("A nova senha precisa ser diferente da atual.")).toBeVisible();

  // Troca de verdade; a sessão continua
  await novaSenha.fill(NOVA_SENHA);
  await confirmacao.fill(NOVA_SENHA);
  await salvar.click();
  await expect(page.getByText("Senha alterada.")).toBeVisible();
  await expect(novaSenha).toHaveValue("");
  await page.goto("/hoje");
  await expect(page.getByRole("heading", { level: 1, name: "Hoje" })).toBeVisible();

  // Num aparelho novo, entra com a nova senha
  const contexto = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const outro = await contexto.newPage();
  await outro.goto("/entrar");
  await outro.getByLabel("E-mail").fill(USUARIO_E2E.email);
  await outro.getByLabel("Senha").fill(NOVA_SENHA);
  await outro.getByRole("button", { name: "Entrar" }).click();
  await outro.waitForURL("**/hoje");
  await contexto.close();
});
