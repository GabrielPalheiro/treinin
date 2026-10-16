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

export type ResultadoDaAcao = { erro: string } | undefined;

const VIOLACAO_DE_UNICIDADE = "23505";
const NOME_REPETIDO = "Já existe um exercício com esse nome.";
const FALHA = "Não foi possível salvar. Tente de novo.";

export async function criarExercicio(dados: NomeDoExercicio): Promise<ResultadoDaAcao> {
  const entrada = nomeDoExercicioSchema.safeParse(dados);
  if (!entrada.success) return { erro: entrada.error.issues[0]?.message ?? FALHA };

  const supabase = await criarClienteServidor();
  const { error } = await supabase
    .from("exercises")
    .insert({ name: normalizarNome(entrada.data.name) });

  if (error) return traduzirErro(error);
  refresh();
}

export async function renomearExercicio(dados: RenomearExercicio): Promise<ResultadoDaAcao> {
  const entrada = renomearExercicioSchema.safeParse(dados);
  if (!entrada.success) return { erro: entrada.error.issues[0]?.message ?? FALHA };

  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("exercises")
    .update({ name: normalizarNome(entrada.data.name) })
    .eq("id", entrada.data.id)
    .select("id");

  if (error) return traduzirErro(error);
  if (data.length === 0) return { erro: "Exercício não encontrado." };
  refresh();
}

function traduzirErro(error: { code: string; message: string }): ResultadoDaAcao {
  if (error.code === VIOLACAO_DE_UNICIDADE) return { erro: NOME_REPETIDO };
  console.error("[exercicios] falha ao salvar", { code: error.code });
  return { erro: FALHA };
}
