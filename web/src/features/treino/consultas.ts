import { hoje, type Data } from "@/domain/tempo/hoje";
import {
  sugerirProximoTreino,
  ultimaVez,
  type ExecucaoAnterior,
  type ExerciseLogStatus,
  type SerieRegistrada,
  type UltimaVez,
} from "@/domain/treino/sessao";
import { buscarFichaAtiva, type FichaComTreinos } from "@/features/ficha/consultas";
import { id as idSchema } from "@/features/ficha/ficha-schema";
import { relogioDoSistema } from "@/lib/relogio";
import { criarClienteParaLeitura } from "@/lib/supabase/servidor";

// O RLS garante que toda consulta só enxerga dados do usuário logado.

type SessaoResumo = { id: string; date: Data; nomeDoTreino: string | null };

export type SituacaoDeHoje = {
  hoje: Data;
  aberta: SessaoResumo | null;
  concluidasHoje: SessaoResumo[];
  ficha: FichaComTreinos | null;
  sugestao: FichaComTreinos["treinos"][number] | null;
};

export async function buscarSituacaoDeHoje(): Promise<SituacaoDeHoje> {
  const supabase = await criarClienteParaLeitura();
  const dataDeHoje = hoje(relogioDoSistema);

  const [aberta, ultima, concluidas, ficha] = await Promise.all([
    supabase
      .from("workout_sessions")
      .select("id, date, workout_templates(name)")
      .is("finished_at", null)
      .maybeSingle(),
    supabase
      .from("workout_sessions")
      .select("workout_template_id")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("workout_sessions")
      .select("id, date, workout_templates(name)")
      .eq("date", dataDeHoje)
      .not("finished_at", "is", null)
      .order("finished_at"),
    buscarFichaAtiva(),
  ]);
  for (const { error } of [aberta, ultima, concluidas]) if (error) throw error;

  const resumo = (s: { id: string; date: string; workout_templates: { name: string } | null }) => ({
    id: s.id,
    date: s.date,
    nomeDoTreino: s.workout_templates?.name ?? null,
  });

  return {
    hoje: dataDeHoje,
    aberta: aberta.data && resumo(aberta.data),
    concluidasHoje: (concluidas.data ?? []).map(resumo),
    ficha,
    sugestao: ficha && sugerirProximoTreino(ficha.treinos, ultima.data?.workout_template_id ?? null),
  };
}

export async function buscarSessaoAberta(): Promise<SessaoResumo | null> {
  const supabase = await criarClienteParaLeitura();
  const { data, error } = await supabase
    .from("workout_sessions")
    .select("id, date, workout_templates(name)")
    .is("finished_at", null)
    .maybeSingle();
  if (error) throw error;
  return data && { id: data.id, date: data.date, nomeDoTreino: data.workout_templates?.name ?? null };
}

// ── Sessão ────────────────────────────────────────────────────────────────

export type SerieDaSessao = SerieRegistrada & { id: string };

export type CartaoDaSessao = {
  chave: string;
  exercise: { id: string; name: string };
  prescrito: {
    id: string;
    target_sets: number;
    rep_min: number;
    rep_max: number;
    technique: string | null;
  } | null;
  registro: { id: string; status: ExerciseLogStatus; note: string | null; series: SerieDaSessao[] } | null;
  ultimaVez: UltimaVez | null;
};

export type SessaoDeTreino = {
  id: string;
  date: Data;
  note: string | null;
  finalizada: boolean;
  nomeDoTreino: string | null;
  hoje: Data;
  cartoes: CartaoDaSessao[];
};

const LIMITE_DO_HISTORICO = 300;

export async function carregarSessao(sessaoId: string): Promise<SessaoDeTreino | null> {
  if (!idSchema.safeParse(sessaoId).success) return null;
  const supabase = await criarClienteParaLeitura();

  const [sessao, registros] = await Promise.all([
    supabase
      .from("workout_sessions")
      .select(
        `id, date, note, finished_at,
         workout_templates(name,
           planned_exercises(id, position, target_sets, rep_min, rep_max, technique, exercises!inner(id, name)))`,
      )
      .eq("id", sessaoId)
      .order("position", { referencedTable: "workout_templates.planned_exercises" })
      .maybeSingle(),
    supabase
      .from("exercise_logs")
      .select("id, exercise_id, planned_exercise_id, status, note, created_at, exercises!inner(id, name), set_logs(id, position, load, load_unit, reps)")
      .eq("workout_session_id", sessaoId)
      .order("created_at")
      .order("position", { referencedTable: "set_logs" }),
  ]);
  if (sessao.error) throw sessao.error;
  if (registros.error) throw registros.error;
  if (!sessao.data) return null;

  const prescritos = sessao.data.workout_templates?.planned_exercises ?? [];
  const exerciseIds = [
    ...new Set([...prescritos.map((p) => p.exercises.id), ...registros.data.map((r) => r.exercise_id)]),
  ];
  const historico = await buscarHistorico(exerciseIds, sessaoId);

  const serie = (s: { id: string; load: number | null; load_unit: SerieRegistrada["load_unit"]; reps: number }) => ({
    id: s.id,
    load: s.load,
    load_unit: s.load_unit,
    reps: s.reps,
  });
  const paraRegistro = (r: (typeof registros.data)[number]) => ({
    id: r.id,
    status: r.status,
    note: r.note,
    series: r.set_logs.map(serie),
  });

  const idsPrescritos = new Set(prescritos.map((p) => p.id));
  const cartoesDaFicha: CartaoDaSessao[] = prescritos.map((p) => {
    const registro = registros.data.find((r) => r.planned_exercise_id === p.id);
    return {
      chave: p.id,
      exercise: registro?.exercises ?? p.exercises,
      prescrito: {
        id: p.id,
        target_sets: p.target_sets,
        rep_min: p.rep_min,
        rep_max: p.rep_max,
        technique: p.technique,
      },
      registro: registro ? paraRegistro(registro) : null,
      ultimaVez: ultimaVez(historico, registro?.exercise_id ?? p.exercises.id, sessaoId),
    };
  });
  // Registros sem prescrito nesta ficha (fora da ficha, ou prescrito apagado): depois, na ordem em que nasceram.
  const cartoesExtras: CartaoDaSessao[] = registros.data
    .filter((r) => !r.planned_exercise_id || !idsPrescritos.has(r.planned_exercise_id))
    .map((r) => ({
      chave: r.id,
      exercise: r.exercises,
      prescrito: null,
      registro: paraRegistro(r),
      ultimaVez: ultimaVez(historico, r.exercise_id, sessaoId),
    }));

  return {
    id: sessao.data.id,
    date: sessao.data.date,
    note: sessao.data.note,
    finalizada: sessao.data.finished_at !== null,
    nomeDoTreino: sessao.data.workout_templates?.name ?? null,
    hoje: hoje(relogioDoSistema),
    cartoes: [...cartoesDaFicha, ...cartoesExtras],
  };
}

async function buscarHistorico(exerciseIds: string[], sessaoAtualId: string): Promise<ExecucaoAnterior[]> {
  if (exerciseIds.length === 0) return [];
  const supabase = await criarClienteParaLeitura();
  const { data, error } = await supabase
    .from("exercise_logs")
    .select("exercise_id, workout_session_id, status, created_at, workout_sessions!inner(date), set_logs(load, load_unit, reps, position)")
    .in("exercise_id", exerciseIds)
    .eq("status", "Done")
    .neq("workout_session_id", sessaoAtualId)
    .order("created_at", { ascending: false })
    .order("position", { referencedTable: "set_logs" })
    .limit(LIMITE_DO_HISTORICO);
  if (error) throw error;

  return data.map((r) => ({
    exercise_id: r.exercise_id,
    workout_session_id: r.workout_session_id,
    status: r.status,
    created_at: r.created_at,
    date: r.workout_sessions.date,
    series: r.set_logs.map(({ load, load_unit, reps }) => ({ load, load_unit, reps })),
  }));
}
