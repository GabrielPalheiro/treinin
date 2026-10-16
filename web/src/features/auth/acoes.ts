"use server";

import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { credenciaisSchema, type Credenciais } from "./credenciais";

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
    return { erro: "E-mail ou senha incorretos." };
  }

  redirect("/hoje");
}

export async function sair(): Promise<void> {
  const supabase = await criarClienteServidor();
  await supabase.auth.signOut();
  redirect("/entrar");
}
