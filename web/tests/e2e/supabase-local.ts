import { execSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

export const USUARIO_E2E = { email: "e2e@treinin.local", senha: "senha-e2e-123" };

/** Cliente admin do Supabase LOCAL. A chave vem do `supabase status` na hora; nunca é gravada. */
export function adminLocal() {
  const saida = execSync("supabase status -o env", { cwd: "..", encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  const valor = (nome: string) => saida.match(new RegExp(`^${nome}="?([^"\\r\\n]+)"?`, "m"))?.[1];
  const url = valor("API_URL");
  const chave = valor("SECRET_KEY");
  if (!url || !chave) throw new Error("Supabase local não está rodando. Rode `supabase start`.");
  if (!/^http:\/\/(127\.0\.0\.1|localhost)/.test(url)) throw new Error(`E2E só roda no banco local, não em ${url}`);
  return createClient(url, chave, { auth: { persistSession: false } });
}

export async function apagarUsuarioE2E(admin: ReturnType<typeof adminLocal>) {
  const { data } = await admin.auth.admin.listUsers();
  const usuario = data.users.find((u) => u.email === USUARIO_E2E.email);
  if (!usuario) return;
  const { error } = await admin.auth.admin.deleteUser(usuario.id);
  if (error) throw error;
}
