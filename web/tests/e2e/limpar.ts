import { adminLocal, apagarUsuarioE2E } from "./supabase-local";

/** Apaga o usuário de teste; os dados dele vão junto, em cascata. */
export default async function limpar() {
  await apagarUsuarioE2E(adminLocal());
}
