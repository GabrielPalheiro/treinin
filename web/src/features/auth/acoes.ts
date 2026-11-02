"use server";

import { redirect } from "next/navigation";
import { primeiroErro, type ResultadoDaAcao } from "@/lib/resultado-da-acao";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { credenciaisSchema, type Credenciais } from "./credenciais";
import { mensagemDeErroDaSenha, mensagemDeErroDoLogin } from "./mensagem-de-erro";
import { novaSenhaSchema, type NovaSenha } from "./nova-senha";

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

/** Troca a senha do usuário logado. A sessão atual continua valendo. */
export async function alterarSenha(dados: NovaSenha): Promise<ResultadoDaAcao> {
  const entrada = novaSenhaSchema.safeParse(dados);
  if (!entrada.success) return { erro: primeiroErro(entrada.error) };

  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.updateUser({ password: entrada.data.senha });
  if (error) {
    // Vai para os logs da Vercel; sem a senha.
    console.error("[auth] troca de senha recusada", { code: error.code, status: error.status });
    return { erro: mensagemDeErroDaSenha(error.code) };
  }
}
