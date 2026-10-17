"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { hoje } from "@/domain/tempo/hoje";
import { proximaPosicao } from "@/domain/treino/ficha";
import { relogioDoSistema } from "@/lib/relogio";
import { mensagemDeErro, primeiroErro, type ResultadoDaAcao } from "@/lib/resultado-da-acao";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { observacaoSchema, serieSchema, type Observacao, type Serie } from "./serie-schema";

const id = z.uuid();
const VIOLACAO_DE_UNICIDADE = "23505";

/** Abre a sessão de hoje com o treino escolhido. Se já houver uma aberta, vai para ela. */
export async function comecarSessao(treinoId: string): Promise<ResultadoDaAcao> {
  if (!id.safeParse(treinoId).success) return { erro: "Treino inválido." };

  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("workout_sessions")
    .insert({ date: hoje(relogioDoSistema), workout_template_id: treinoId })
    .select("id")
    .single();

  if (error?.code === VIOLACAO_DE_UNICIDADE) {
    const { data: aberta } = await supabase.from("workout_sessions").select("id").is("finished_at", null).single();
    if (aberta) redirect(`/treino/sessao/${aberta.id}`);
  }
  if (error) return { erro: mensagemDeErro("sessao", error) };
  redirect(`/treino/sessao/${data.id}`);
}

const alvoSchema = z.object({
  sessaoId: z.uuid(),
  exerciseId: z.uuid(),
  plannedExerciseId: z.uuid().nullable(),
  registroId: z.uuid().nullable(),
});

export type AlvoDaSerie = z.infer<typeof alvoSchema>;

/**
 * Registra uma série. O ExerciseLog nasce aqui, na primeira série (docs/dominio.md):
 * se ainda não existe para esse exercício prescrito, é criado.
 */
export async function registrarSerie(alvo: AlvoDaSerie, serie: Serie): Promise<ResultadoDaAcao> {
  const entradaAlvo = alvoSchema.safeParse(alvo);
  const entradaSerie = serieSchema.safeParse(serie);
  if (!entradaAlvo.success) return { erro: "Exercício inválido." };
  if (!entradaSerie.success) return { erro: primeiroErro(entradaSerie.error) };
  const { sessaoId, exerciseId, plannedExerciseId, registroId } = entradaAlvo.data;

  const supabase = await criarClienteServidor();
  let logId = registroId;

  if (!logId) {
    const { data, error } = await supabase
      .from("exercise_logs")
      .insert({ workout_session_id: sessaoId, exercise_id: exerciseId, planned_exercise_id: plannedExerciseId })
      .select("id")
      .single();
    if (error?.code === VIOLACAO_DE_UNICIDADE && plannedExerciseId) {
      // Dois toques rápidos: o registro já nasceu na outra chamada.
      const { data: existente } = await supabase
        .from("exercise_logs")
        .select("id")
        .eq("workout_session_id", sessaoId)
        .eq("planned_exercise_id", plannedExerciseId)
        .single();
      logId = existente?.id ?? null;
    } else if (error) {
      return { erro: mensagemDeErro("serie", error) };
    } else {
      logId = data.id;
    }
  }
  if (!logId) return { erro: "Não foi possível registrar. Tente de novo." };

  const { data: series, error: erroDeLeitura } = await supabase
    .from("set_logs")
    .select("position")
    .eq("exercise_log_id", logId);
  if (erroDeLeitura) return { erro: mensagemDeErro("serie", erroDeLeitura) };

  const { error } = await supabase.from("set_logs").insert({
    exercise_log_id: logId,
    position: proximaPosicao(series.map((s) => s.position)),
    ...entradaSerie.data,
  });
  if (error) return { erro: mensagemDeErro("serie", error) };
  refresh();
}

export async function editarSerie(serieId: string, serie: Serie): Promise<ResultadoDaAcao> {
  const entrada = serieSchema.safeParse(serie);
  if (!entrada.success) return { erro: primeiroErro(entrada.error) };
  if (!id.safeParse(serieId).success) return { erro: "Série inválida." };

  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("set_logs").update(entrada.data).eq("id", serieId);
  if (error) return { erro: mensagemDeErro("serie", error) };
  refresh();
}

export async function removerSerie(serieId: string): Promise<ResultadoDaAcao> {
  if (!id.safeParse(serieId).success) return { erro: "Série inválida." };

  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("set_logs").delete().eq("id", serieId);
  if (error) return { erro: mensagemDeErro("serie", error) };
  refresh();
}

export async function finalizarSessao(sessaoId: string, dados: Observacao): Promise<ResultadoDaAcao> {
  const entrada = observacaoSchema.safeParse(dados);
  if (!entrada.success) return { erro: primeiroErro(entrada.error) };
  if (!id.safeParse(sessaoId).success) return { erro: "Sessão inválida." };

  const supabase = await criarClienteServidor();
  const { error } = await supabase
    .from("workout_sessions")
    .update({ finished_at: relogioDoSistema.agora().toISOString(), note: entrada.data.note })
    .eq("id", sessaoId)
    .is("finished_at", null);
  if (error) return { erro: mensagemDeErro("sessao", error) };
  redirect("/hoje");
}
