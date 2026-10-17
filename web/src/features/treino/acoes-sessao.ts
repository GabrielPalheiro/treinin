"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { hoje } from "@/domain/tempo/hoje";
import { proximaPosicao } from "@/domain/treino/ficha";
import { podePular } from "@/domain/treino/sessao";
import { relogioDoSistema } from "@/lib/relogio";
import { mensagemDeErro, primeiroErro, type ResultadoDaAcao } from "@/lib/resultado-da-acao";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import {
  notaDoExercicioSchema,
  observacaoSchema,
  serieSchema,
  type NotaDoExercicio,
  type Observacao,
  type Serie,
} from "./serie-schema";

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
  const supabase = await criarClienteServidor();
  const registro = await garantirRegistro(supabase, entradaAlvo.data);
  if ("erro" in registro) return registro;
  const logId = registro.id;

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

// ── Ajustes no cartão ─────────────────────────────────────────────────────

type Cliente = Awaited<ReturnType<typeof criarClienteServidor>>;

/**
 * O ExerciseLog do alvo: o existente, ou um novo (Done, sem série). Dois toques rápidos
 * podem criar ao mesmo tempo; o índice único devolve 23505 e aí vale o que já nasceu.
 */
async function garantirRegistro(supabase: Cliente, alvo: AlvoDaSerie): Promise<{ id: string } | { erro: string }> {
  if (alvo.registroId) return { id: alvo.registroId };

  const { data, error } = await supabase
    .from("exercise_logs")
    .insert({
      workout_session_id: alvo.sessaoId,
      exercise_id: alvo.exerciseId,
      planned_exercise_id: alvo.plannedExerciseId,
    })
    .select("id")
    .single();
  if (!error) return { id: data.id };

  if (error.code === VIOLACAO_DE_UNICIDADE && alvo.plannedExerciseId) {
    const { data: existente } = await supabase
      .from("exercise_logs")
      .select("id")
      .eq("workout_session_id", alvo.sessaoId)
      .eq("planned_exercise_id", alvo.plannedExerciseId)
      .single();
    if (existente) return existente;
  }
  return { erro: mensagemDeErro("sessao", error) };
}

function validarAlvo(alvo: AlvoDaSerie): AlvoDaSerie | null {
  const entrada = alvoSchema.safeParse(alvo);
  return entrada.success ? entrada.data : null;
}

export async function pularExercicio(alvo: AlvoDaSerie, dados: NotaDoExercicio): Promise<ResultadoDaAcao> {
  const alvoValido = validarAlvo(alvo);
  const nota = notaDoExercicioSchema.safeParse(dados);
  if (!alvoValido) return { erro: "Exercício inválido." };
  if (!nota.success) return { erro: primeiroErro(nota.error) };

  const supabase = await criarClienteServidor();
  const registro = await garantirRegistro(supabase, alvoValido);
  if ("erro" in registro) return registro;

  const { data: atual, error: erroDeLeitura } = await supabase
    .from("exercise_logs")
    .select("status, set_logs(id)")
    .eq("id", registro.id)
    .single();
  if (erroDeLeitura) return { erro: mensagemDeErro("sessao", erroDeLeitura) };
  if (!podePular({ status: atual.status, series: atual.set_logs })) {
    return { erro: "Remova as séries antes de marcar como pulado." };
  }

  const { error } = await supabase
    .from("exercise_logs")
    .update({ status: "Skipped", note: nota.data.note })
    .eq("id", registro.id);
  if (error) return { erro: mensagemDeErro("sessao", error) };
  refresh();
}

/** Desfaz o "Pulei": o registro some e o exercício volta a pendente. */
export async function desfazerPulo(registroId: string): Promise<ResultadoDaAcao> {
  if (!id.safeParse(registroId).success) return { erro: "Exercício inválido." };

  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("exercise_logs").delete().eq("id", registroId).eq("status", "Skipped");
  if (error) return { erro: mensagemDeErro("sessao", error) };
  refresh();
}

/** "Troquei por…": o registro passa a ser do exercício escolhido; o prescrito continua no cartão. */
export async function trocarExercicio(alvo: AlvoDaSerie, novoExerciseId: string): Promise<ResultadoDaAcao> {
  const alvoValido = validarAlvo(alvo);
  if (!alvoValido || !alvoValido.plannedExerciseId || !id.safeParse(novoExerciseId).success) {
    return { erro: "Exercício inválido." };
  }

  const supabase = await criarClienteServidor();
  const registro = await garantirRegistro(supabase, { ...alvoValido, exerciseId: novoExerciseId });
  if ("erro" in registro) return registro;

  const { error } = await supabase.from("exercise_logs").update({ exercise_id: novoExerciseId }).eq("id", registro.id);
  if (error) return { erro: mensagemDeErro("sessao", error) };
  refresh();
}

export async function voltarAoPrescrito(registroId: string, exercicioPrescritoId: string): Promise<ResultadoDaAcao> {
  if (!id.safeParse(registroId).success || !id.safeParse(exercicioPrescritoId).success) {
    return { erro: "Exercício inválido." };
  }

  const supabase = await criarClienteServidor();
  const { error } = await supabase
    .from("exercise_logs")
    .update({ exercise_id: exercicioPrescritoId })
    .eq("id", registroId)
    .not("planned_exercise_id", "is", null);
  if (error) return { erro: mensagemDeErro("sessao", error) };
  refresh();
}

export async function salvarNotaDoExercicio(alvo: AlvoDaSerie, dados: NotaDoExercicio): Promise<ResultadoDaAcao> {
  const alvoValido = validarAlvo(alvo);
  const nota = notaDoExercicioSchema.safeParse(dados);
  if (!alvoValido) return { erro: "Exercício inválido." };
  if (!nota.success) return { erro: primeiroErro(nota.error) };

  const supabase = await criarClienteServidor();
  const registro = await garantirRegistro(supabase, alvoValido);
  if ("erro" in registro) return registro;

  const { error } = await supabase.from("exercise_logs").update({ note: nota.data.note }).eq("id", registro.id);
  if (error) return { erro: mensagemDeErro("sessao", error) };
  refresh();
}

export async function adicionarForaDaFicha(sessaoId: string, exerciseId: string): Promise<ResultadoDaAcao> {
  if (!id.safeParse(sessaoId).success || !id.safeParse(exerciseId).success) return { erro: "Exercício inválido." };

  const supabase = await criarClienteServidor();
  const { error } = await supabase
    .from("exercise_logs")
    .insert({ workout_session_id: sessaoId, exercise_id: exerciseId, planned_exercise_id: null });
  if (error) return { erro: mensagemDeErro("sessao", error) };
  refresh();
}

/** Só exercício fora da ficha sai da sessão; as séries dele vão junto. */
export async function removerDaSessao(registroId: string): Promise<ResultadoDaAcao> {
  if (!id.safeParse(registroId).success) return { erro: "Exercício inválido." };

  const supabase = await criarClienteServidor();
  const { error } = await supabase
    .from("exercise_logs")
    .delete()
    .eq("id", registroId)
    .is("planned_exercise_id", null);
  if (error) return { erro: mensagemDeErro("sessao", error) };
  refresh();
}