"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { calcularKcal } from "@/domain/dieta/registro";
import { mensagemDeErro, primeiroErro, type ResultadoDaAcao } from "@/lib/resultado-da-acao";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { gramasSchema, novoRegistroSchema, type NovoRegistro } from "./registro-schema";

const id = z.uuid();

/** Registra o alimento na refeição, com o kcal calculado pelo valor atual do alimento (snapshot). */
export async function registrarAlimento(dados: NovoRegistro): Promise<ResultadoDaAcao> {
  const registro = novoRegistroSchema.safeParse(dados);
  if (!registro.success) return { erro: primeiroErro(registro.error) };

  const supabase = await criarClienteServidor();
  const { data: alimento, error: erroDoAlimento } = await supabase
    .from("foods")
    .select("kcal_per_100g")
    .eq("id", registro.data.food_id)
    .maybeSingle();
  if (erroDoAlimento) return { erro: mensagemDeErro("dieta", erroDoAlimento) };
  if (!alimento) return { erro: "Alimento não encontrado." };

  const { error } = await supabase
    .from("meal_entries")
    .insert({ ...registro.data, kcal: calcularKcal(alimento.kcal_per_100g, registro.data.grams) });
  if (error) return { erro: mensagemDeErro("dieta", error) };
  refresh();
}

/** Novos gramas: o kcal é recalculado com o valor atual do alimento. */
export async function editarGramas(registroId: string, gramas: number): Promise<ResultadoDaAcao> {
  const grams = gramasSchema.safeParse(gramas);
  if (!id.safeParse(registroId).success) return { erro: "Registro inválido." };
  if (!grams.success) return { erro: primeiroErro(grams.error) };

  const supabase = await criarClienteServidor();
  const { data: registro, error: erroDoRegistro } = await supabase
    .from("meal_entries")
    .select("id, foods!inner(kcal_per_100g)")
    .eq("id", registroId)
    .maybeSingle();
  if (erroDoRegistro) return { erro: mensagemDeErro("dieta", erroDoRegistro) };
  if (!registro) return { erro: "Registro não encontrado." };

  const { error } = await supabase
    .from("meal_entries")
    .update({ grams: grams.data, kcal: calcularKcal(registro.foods.kcal_per_100g, grams.data) })
    .eq("id", registro.id);
  if (error) return { erro: mensagemDeErro("dieta", error) };
  refresh();
}

export async function removerRegistro(registroId: string): Promise<ResultadoDaAcao> {
  if (!id.safeParse(registroId).success) return { erro: "Registro inválido." };

  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("meal_entries").delete().eq("id", registroId);
  if (error) return { erro: mensagemDeErro("dieta", error) };
  refresh();
}
