import type { Data } from "../tempo/hoje";

export type LoadUnit = "Kg" | "Plates" | "Bodyweight";
export type ExerciseLogStatus = "Done" | "Skipped";

/** Uma série: `load` é nulo só em peso corporal. */
export type SerieRegistrada = { load: number | null; load_unit: LoadUnit; reps: number };

/** Um ExerciseLog passado, com a data da sessão e as séries em ordem. */
export type ExecucaoAnterior = {
  exercise_id: string;
  workout_session_id: string;
  status: ExerciseLogStatus;
  date: Data;
  created_at: string;
  series: SerieRegistrada[];
};

export type UltimaVez = { date: Data; series: SerieRegistrada[] };

/**
 * O treino seguinte ao da última sessão, na ordem da ficha; depois do último, o primeiro.
 * Sem sessões, ou se a última foi de um treino fora desta ficha, o primeiro.
 */
export function sugerirProximoTreino<T extends { id: string }>(
  treinosEmOrdem: readonly T[],
  ultimoTreinoId: string | null,
): T | null {
  if (treinosEmOrdem.length === 0) return null;
  const indice = treinosEmOrdem.findIndex((t) => t.id === ultimoTreinoId);
  if (indice === -1) return treinosEmOrdem[0] ?? null;
  return treinosEmOrdem[(indice + 1) % treinosEmOrdem.length] ?? null;
}

/**
 * Última execução feita (Done, com série) desse exercício em outra sessão.
 * Mais recente pela data da sessão; no mesmo dia, pelo registro mais novo.
 */
export function ultimaVez(
  historico: readonly ExecucaoAnterior[],
  exerciseId: string,
  sessaoAtualId: string,
): UltimaVez | null {
  const candidatas = historico.filter(
    (e) =>
      e.exercise_id === exerciseId &&
      e.status === "Done" &&
      e.series.length > 0 &&
      e.workout_session_id !== sessaoAtualId,
  );
  const maisRecente = candidatas.reduce<ExecucaoAnterior | null>((atual, e) => {
    if (!atual) return e;
    if (e.date !== atual.date) return e.date > atual.date ? e : atual;
    return e.created_at > atual.created_at ? e : atual;
  }, null);
  return maisRecente && { date: maisRecente.date, series: maisRecente.series };
}

/**
 * Valores da próxima série: a correspondente da última vez; se ela não existe,
 * a anterior de hoje; sem nenhuma das duas, nada.
 */
export function preencherSerie(
  ultimaVezSeries: readonly SerieRegistrada[] | null,
  seriesDeHoje: readonly SerieRegistrada[],
): SerieRegistrada | null {
  const correspondente = ultimaVezSeries?.[seriesDeHoje.length];
  const base = correspondente ?? seriesDeHoje.at(-1);
  return base ? { load: base.load, load_unit: base.load_unit, reps: base.reps } : null;
}

const numeroBr = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

/** "65 kg", "58,5 kg", "4 placas", "1 placa", "peso corporal". */
export function formatarCarga(load: number | null, unidade: LoadUnit): string {
  if (unidade === "Bodyweight" || load === null) return "peso corporal";
  const valor = numeroBr.format(load);
  if (unidade === "Plates") return `${valor} ${load === 1 ? "placa" : "placas"}`;
  return `${valor} kg`;
}

/** "75 kg × 9, 7": séries seguidas com a mesma carga e unidade ficam juntas. */
export function formatarSeries(series: readonly SerieRegistrada[]): string {
  const grupos: { carga: string; reps: number[] }[] = [];
  for (const serie of series) {
    const carga = formatarCarga(serie.load, serie.load_unit);
    const ultimoGrupo = grupos.at(-1);
    if (ultimoGrupo?.carga === carga) ultimoGrupo.reps.push(serie.reps);
    else grupos.push({ carga, reps: [serie.reps] });
  }
  return grupos.map((g) => `${g.carga} × ${g.reps.join(", ")}`).join(" · ");
}

/** Número digitado no celular: aceita vírgula ou ponto. Vazio ou inválido → null. */
export function lerDecimal(texto: string): number | null {
  const limpo = texto.trim().replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(limpo)) return null;
  return Number(limpo);
}

const MS_POR_DIA = 86_400_000;

// Datas de calendário viram dias inteiros em UTC: fuso e horário de verão não interferem.
function diaAbsoluto(data: Data): number {
  const [ano, mes, dia] = data.split("-").map(Number);
  return Date.UTC(ano ?? 0, (mes ?? 1) - 1, dia ?? 1) / MS_POR_DIA;
}

/** "hoje", "ontem", "há 4 dias". */
export function haQuantoTempo(data: Data, hoje: Data): string {
  const dias = diaAbsoluto(hoje) - diaAbsoluto(data);
  if (dias <= 0) return "hoje";
  if (dias === 1) return "ontem";
  return `há ${dias} dias`;
}
