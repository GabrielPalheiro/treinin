"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { normalizarNome } from "@/domain/treino/catalogo";
import { proximaPosicao } from "@/domain/treino/ficha";
import { relogioDoSistema } from "@/lib/relogio";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import {
  id as idSchema,
  listaDeIds,
  nomeDaFichaSchema,
  nomeDoTreinoSchema,
  prescricaoSchema,
  type Nome,
  type Prescricao,
} from "./ficha-schema";
import { mensagemDeErro, primeiroErro, type ResultadoDaAcao } from "./resultado";

const NOME_DE_TREINO_REPETIDO = { "23505": "Já existe um treino com esse nome nesta ficha." };

// ── Ficha ─────────────────────────────────────────────────────────────────

export async function criarFicha(dados: Nome): Promise<ResultadoDaAcao> {
  const entrada = nomeDaFichaSchema.safeParse(dados);
  if (!entrada.success) return { erro: primeiroErro(entrada.error) };

  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("workout_plans")
    .insert({ name: normalizarNome(entrada.data.name) })
    .select("id")
    .single();
  if (error) return { erro: mensagemDeErro("ficha", error) };

  redirect(`/ficha/${data.id}`);
}

export async function renomearFicha(fichaId: string, dados: Nome): Promise<ResultadoDaAcao> {
  const entrada = nomeDaFichaSchema.safeParse(dados);
  if (!entrada.success || !idSchema.safeParse(fichaId).success) return { erro: "Dados inválidos." };

  const supabase = await criarClienteServidor();
  const { error } = await supabase
    .from("workout_plans")
    .update({ name: normalizarNome(entrada.data.name) })
    .eq("id", fichaId)
    .is("archived_at", null);
  if (error) return { erro: mensagemDeErro("ficha", error) };
  refresh();
}

export async function ativarFicha(fichaId: string): Promise<ResultadoDaAcao> {
  if (!idSchema.safeParse(fichaId).success) return { erro: "Ficha inválida." };

  const supabase = await criarClienteServidor();
  const { error } = await supabase.rpc("activate_workout_plan", { plan_id: fichaId });
  if (error) return { erro: mensagemDeErro("ficha", error, { P0002: "Ficha não encontrada ou arquivada." }) };
  refresh();
}

export async function arquivarFicha(fichaId: string): Promise<ResultadoDaAcao> {
  if (!idSchema.safeParse(fichaId).success) return { erro: "Ficha inválida." };

  const supabase = await criarClienteServidor();
  const { error } = await supabase
    .from("workout_plans")
    .update({ archived_at: relogioDoSistema.agora().toISOString(), active: false })
    .eq("id", fichaId)
    .is("archived_at", null);
  if (error) return { erro: mensagemDeErro("ficha", error) };
  refresh();
}

// ── Treino ────────────────────────────────────────────────────────────────

export async function criarTreino(fichaId: string, dados: Nome): Promise<ResultadoDaAcao> {
  const entrada = nomeDoTreinoSchema.safeParse(dados);
  if (!entrada.success) return { erro: primeiroErro(entrada.error) };
  if (!idSchema.safeParse(fichaId).success) return { erro: "Ficha inválida." };

  const supabase = await criarClienteServidor();
  const { data: existentes, error: erroDeLeitura } = await supabase
    .from("workout_templates")
    .select("position")
    .eq("workout_plan_id", fichaId);
  if (erroDeLeitura) return { erro: mensagemDeErro("treino", erroDeLeitura) };

  const { error } = await supabase.from("workout_templates").insert({
    workout_plan_id: fichaId,
    name: normalizarNome(entrada.data.name),
    position: proximaPosicao(existentes.map((t) => t.position)),
  });
  if (error) return { erro: mensagemDeErro("treino", error, NOME_DE_TREINO_REPETIDO) };
  refresh();
}

export async function renomearTreino(treinoId: string, dados: Nome): Promise<ResultadoDaAcao> {
  const entrada = nomeDoTreinoSchema.safeParse(dados);
  if (!entrada.success) return { erro: primeiroErro(entrada.error) };
  if (!idSchema.safeParse(treinoId).success) return { erro: "Treino inválido." };

  const supabase = await criarClienteServidor();
  const { error } = await supabase
    .from("workout_templates")
    .update({ name: normalizarNome(entrada.data.name) })
    .eq("id", treinoId);
  if (error) return { erro: mensagemDeErro("treino", error, NOME_DE_TREINO_REPETIDO) };
  refresh();
}

export async function removerTreino(fichaId: string, treinoId: string): Promise<ResultadoDaAcao> {
  if (!idSchema.safeParse(fichaId).success || !idSchema.safeParse(treinoId).success) {
    return { erro: "Treino inválido." };
  }

  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("workout_templates").delete().eq("id", treinoId);
  if (error) return { erro: mensagemDeErro("treino", error) };
  redirect(`/ficha/${fichaId}`);
}

export async function reordenarTreinos(fichaId: string, treinoIds: string[]): Promise<ResultadoDaAcao> {
  if (!idSchema.safeParse(fichaId).success || !listaDeIds.safeParse(treinoIds).success) {
    return { erro: "Ordem inválida." };
  }

  const supabase = await criarClienteServidor();
  const { error } = await supabase.rpc("reorder_workout_templates", {
    plan_id: fichaId,
    template_ids: treinoIds,
  });
  if (error) return { erro: mensagemDeErro("treino", error, { "22023": "A lista mudou. Recarregue a página." }) };
  refresh();
}

// ── Exercício prescrito ───────────────────────────────────────────────────

export async function adicionarExercicioPrescrito(
  treinoId: string,
  exerciseId: string,
  dados: Prescricao,
): Promise<ResultadoDaAcao> {
  const entrada = prescricaoSchema.safeParse(dados);
  if (!entrada.success) return { erro: primeiroErro(entrada.error) };
  if (!idSchema.safeParse(treinoId).success || !idSchema.safeParse(exerciseId).success) {
    return { erro: "Exercício inválido." };
  }

  const supabase = await criarClienteServidor();
  const { data: existentes, error: erroDeLeitura } = await supabase
    .from("planned_exercises")
    .select("position")
    .eq("workout_template_id", treinoId);
  if (erroDeLeitura) return { erro: mensagemDeErro("prescricao", erroDeLeitura) };

  const { error } = await supabase.from("planned_exercises").insert({
    workout_template_id: treinoId,
    exercise_id: exerciseId,
    position: proximaPosicao(existentes.map((p) => p.position)),
    ...entrada.data,
  });
  if (error) return { erro: mensagemDeErro("prescricao", error) };
  refresh();
}

export async function editarPrescricao(prescritoId: string, dados: Prescricao): Promise<ResultadoDaAcao> {
  const entrada = prescricaoSchema.safeParse(dados);
  if (!entrada.success) return { erro: primeiroErro(entrada.error) };
  if (!idSchema.safeParse(prescritoId).success) return { erro: "Exercício inválido." };

  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("planned_exercises").update(entrada.data).eq("id", prescritoId);
  if (error) return { erro: mensagemDeErro("prescricao", error) };
  refresh();
}

export async function removerExercicioPrescrito(prescritoId: string): Promise<ResultadoDaAcao> {
  if (!idSchema.safeParse(prescritoId).success) return { erro: "Exercício inválido." };

  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("planned_exercises").delete().eq("id", prescritoId);
  if (error) return { erro: mensagemDeErro("prescricao", error) };
  refresh();
}

export async function reordenarExerciciosPrescritos(
  treinoId: string,
  prescritoIds: string[],
): Promise<ResultadoDaAcao> {
  if (!idSchema.safeParse(treinoId).success || !listaDeIds.safeParse(prescritoIds).success) {
    return { erro: "Ordem inválida." };
  }

  const supabase = await criarClienteServidor();
  const { error } = await supabase.rpc("reorder_planned_exercises", {
    template_id: treinoId,
    planned_exercise_ids: prescritoIds,
  });
  if (error) return { erro: mensagemDeErro("prescricao", error, { "22023": "A lista mudou. Recarregue a página." }) };
  refresh();
}
