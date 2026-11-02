"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { copiarRegistros } from "@/domain/dieta/copiar";
import { calcularKcal } from "@/domain/dieta/registro";
import { normalizarNome } from "@/domain/texto/nome";
import { mensagemDeErro, primeiroErro, type ResultadoComId, type ResultadoDaAcao } from "@/lib/resultado-da-acao";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import {
  alimentoSchema,
  editarAlimentoSchema,
  type AlimentoEditado,
  type NovoAlimento,
} from "./alimento-schema";
import { copiaSchema, gramasSchema, novoRegistroSchema, type Copia, type NovoRegistro } from "./registro-schema";

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

/** Copia a refeição de outro dia para o dia na tela, com o kcal recalculado pelo valor atual. */
export async function copiarRefeicao(dados: Copia): Promise<ResultadoDaAcao> {
  const copia = copiaSchema.safeParse(dados);
  if (!copia.success) return { erro: primeiroErro(copia.error) };
  const { origem, destino, meal } = copia.data;

  const supabase = await criarClienteServidor();
  const { data: daOrigem, error: erroDaOrigem } = await supabase
    .from("meal_entries")
    .select("food_id, grams, foods!inner(kcal_per_100g)")
    .eq("date", origem)
    .eq("meal", meal)
    .order("created_at");
  if (erroDaOrigem) return { erro: mensagemDeErro("dieta", erroDaOrigem) };
  if (daOrigem.length === 0) return { erro: "Nada registrado nessa refeição no dia escolhido." };

  const copiados = copiarRegistros(
    daOrigem.map((r) => ({ food_id: r.food_id, grams: r.grams, kcal_per_100g: r.foods.kcal_per_100g })),
    { date: destino, meal },
  );
  const { error } = await supabase.from("meal_entries").insert(copiados);
  if (error) return { erro: mensagemDeErro("dieta", error) };
  refresh();
}

const NOME_REPETIDO ={ "23505": "Você já tem um alimento com esse nome." };

/** Alimento próprio: `source` e `user_id` vêm dos defaults do banco. */
export async function criarAlimento(dados: NovoAlimento): Promise<ResultadoComId> {
  const alimento = alimentoSchema.safeParse(dados);
  if (!alimento.success) return { erro: primeiroErro(alimento.error) };

  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("foods")
    .insert({ name: normalizarNome(alimento.data.name), kcal_per_100g: alimento.data.kcal_per_100g })
    .select("id")
    .single();
  if (error) return { erro: mensagemDeErro("dieta", error, NOME_REPETIDO) };
  refresh();
  return { id: data.id };
}

/** Corrige nome e kcal. Os registros já feitos guardam o kcal da época (snapshot). */
export async function editarAlimento(dados: AlimentoEditado): Promise<ResultadoDaAcao> {
  const alimento = editarAlimentoSchema.safeParse(dados);
  if (!alimento.success) return { erro: primeiroErro(alimento.error) };

  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("foods")
    .update({ name: normalizarNome(alimento.data.name), kcal_per_100g: alimento.data.kcal_per_100g })
    .eq("id", alimento.data.id)
    .eq("source", "Custom")
    .select("id");
  if (error) return { erro: mensagemDeErro("dieta", error, NOME_REPETIDO) };
  if (data.length === 0) return { erro: "Alimento não encontrado." };
  refresh();
}

export async function removerRegistro(registroId: string): Promise<ResultadoDaAcao> {
  if (!id.safeParse(registroId).success) return { erro: "Registro inválido." };

  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("meal_entries").delete().eq("id", registroId);
  if (error) return { erro: mensagemDeErro("dieta", error) };
  refresh();
}
