"use server";

import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { credenciaisSchema, type Credenciais } from "./credenciais";
import { mensagemDeErroDoLogin } from "./mensagem-de-erro";

export type ResultadoEntrar = { erro: string } | undefined;

export async function entrar(dados: Credenciais): Promise<ResultadoEntrar> {
  const credenciais = credenciaisSchema.safeParse(dados);
  if (!credenciais.success) {
    return { erro: "Confira o e-mail e a senha." };
  }

  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({
    email: credenciais.data.email,
    password: credenciais.data.senha,
  });
  if (error) {
    // Vai para os logs da Vercel; sem e-mail nem senha.
    console.error("[auth] login recusado", { code: error.code, status: error.status });
    return { erro: mensagemDeErroDoLogin(error.code) };
  }

  redirect("/hoje");
}

export async function sair(): Promise<void> {
  const supabase = await criarClienteServidor();
  await supabase.auth.signOut();
  redirect("/entrar");
}
