import { chromium, type FullConfig } from "@playwright/test";
import { adminLocal, apagarUsuarioE2E, USUARIO_E2E } from "./supabase-local";

/** Cria o usuário de teste do zero e entra pela tela /entrar, guardando a sessão. */
export default async function preparar(config: FullConfig) {
  const admin = adminLocal();
  await apagarUsuarioE2E(admin);
  const { error } = await admin.auth.admin.createUser({
    email: USUARIO_E2E.email,
    password: USUARIO_E2E.senha,
    email_confirm: true,
  });
  if (error) throw error;

  const { baseURL, storageState } = config.projects[0]!.use;
  const navegador = await chromium.launch();
  const pagina = await navegador.newPage({ baseURL });
  await pagina.goto("/entrar");
  await pagina.getByLabel("E-mail").fill(USUARIO_E2E.email);
  await pagina.getByLabel("Senha").fill(USUARIO_E2E.senha);
  await pagina.getByRole("button", { name: "Entrar" }).click();
  await pagina.waitForURL("**/hoje");
  await pagina.context().storageState({ path: storageState as string });
  await navegador.close();
}
