"use server";

import { refresh } from "next/cache";
import { normalizarNome } from "@/domain/treino/catalogo";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import {
  nomeDoExercicioSchema,
  renomearExercicioSchema,
  type NomeDoExercicio,
  type RenomearExercicio,
} from "./exercicio-schema";
import { mensagemDeErro, primeiroErro, type ResultadoComId, type ResultadoDaAcao } from "./resultado";

const NOME_REPETIDO = { "23505": "Já existe um exercício com esse nome." };

export async function criarExercicio(dados: NomeDoExercicio): Promise<ResultadoComId> {
  const entrada = nomeDoExercicioSchema.safeParse(dados);
  if (!entrada.success) return { erro: primeiroErro(entrada.error) };

  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("exercises")
    .insert({ name: normalizarNome(entrada.data.name) })
    .select("id")
    .single();

  if (error) return { erro: mensagemDeErro("exercicios", error, NOME_REPETIDO) };
  refresh();
  return { id: data.id };
}

export async function renomearExercicio(dados: RenomearExercicio): Promise<ResultadoDaAcao> {
  const entrada = renomearExercicioSchema.safeParse(dados);
  if (!entrada.success) return { erro: primeiroErro(entrada.error) };

  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("exercises")
    .update({ name: normalizarNome(entrada.data.name) })
    .eq("id", entrada.data.id)
    .select("id");

  if (error) return { erro: mensagemDeErro("exercicios", error, NOME_REPETIDO) };
  if (data.length === 0) return { erro: "Exercício não encontrado." };
  refresh();
}
