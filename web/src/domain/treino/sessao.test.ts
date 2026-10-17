import { describe, expect, it } from "vitest";
import {
  formatarCarga,
  formatarSeries,
  foiSubstituido,
  haQuantoTempo,
  lerDecimal,
  podePular,
  preencherSerie,
  situacaoDoExercicio,
  sugerirProximoTreino,
  ultimaVez,
  type ExecucaoAnterior,
  type SerieRegistrada,
} from "./sessao";

const kg = (load: number, reps: number): SerieRegistrada => ({ load, load_unit: "Kg", reps });
const placas = (load: number, reps: number): SerieRegistrada => ({ load, load_unit: "Plates", reps });
const corporal = (reps: number): SerieRegistrada => ({ load: null, load_unit: "Bodyweight", reps });

describe("sugerirProximoTreino", () => {
  const ficha = [{ id: "lowerA" }, { id: "upperA" }, { id: "lowerB" }, { id: "upperB" }];

  it.each([
    ["sem sessões, o primeiro", null, "lowerA"],
    ["depois do Lower A, o Upper A", "lowerA", "upperA"],
    ["depois do Lower B, o Upper B", "lowerB", "upperB"],
    ["depois do último, volta ao primeiro", "upperB", "lowerA"],
    ["última sessão de outra ficha, o primeiro", "treinoDaFichaAntiga", "lowerA"],
  ])("%s", (_caso, ultimoTreinoId, esperado) => {
    expect(sugerirProximoTreino(ficha, ultimoTreinoId)?.id).toBe(esperado);
  });

  it("ficha sem treinos não sugere nada", () => {
    expect(sugerirProximoTreino([], "lowerA")).toBeNull();
  });

  it("ficha de um treino só sugere sempre ele", () => {
    expect(sugerirProximoTreino([{ id: "full" }], "full")?.id).toBe("full");
  });
});

describe("ultimaVez", () => {
  const execucao = (e: Partial<ExecucaoAnterior>): ExecucaoAnterior => ({
    exercise_id: "mesa",
    workout_session_id: "s1",
    status: "Done",
    date: "2026-10-10",
    created_at: "2026-10-10T10:00:00Z",
    series: [kg(75, 9)],
    ...e,
  });

  it("sem histórico, nada", () => {
    expect(ultimaVez([], "mesa", "atual")).toBeNull();
  });

  it("pega a sessão de data mais recente, com todas as séries", () => {
    const historico = [
      execucao({ workout_session_id: "s1", date: "2026-10-08", series: [kg(70, 10)] }),
      execucao({ workout_session_id: "s2", date: "2026-10-12", series: [kg(75, 9), kg(75, 7)] }),
      execucao({ workout_session_id: "s3", date: "2026-10-10", series: [kg(72, 8)] }),
    ];
    expect(ultimaVez(historico, "mesa", "atual")).toEqual({ date: "2026-10-12", series: [kg(75, 9), kg(75, 7)] });
  });

  it("no mesmo dia, o registro mais recente", () => {
    const historico = [
      execucao({ workout_session_id: "s1", created_at: "2026-10-12T08:00:00Z", series: [kg(70, 10)] }),
      execucao({ workout_session_id: "s2", created_at: "2026-10-12T19:00:00Z", series: [kg(80, 6)] }),
    ].map((e) => ({ ...e, date: "2026-10-12" }));
    expect(ultimaVez(historico, "mesa", "atual")?.series).toEqual([kg(80, 6)]);
  });

  it("é por exercício, não por treino", () => {
    const historico = [execucao({ exercise_id: "cadeira", date: "2026-10-15" }), execucao({ date: "2026-10-01" })];
    expect(ultimaVez(historico, "mesa", "atual")?.date).toBe("2026-10-01");
  });

  it("ignora Skipped e registros sem série", () => {
    const historico = [
      execucao({ date: "2026-10-15", status: "Skipped", series: [] }),
      execucao({ date: "2026-10-14", series: [] }),
      execucao({ date: "2026-10-02" }),
    ];
    expect(ultimaVez(historico, "mesa", "atual")?.date).toBe("2026-10-02");
  });

  it("ignora a sessão atual", () => {
    const historico = [execucao({ workout_session_id: "atual", date: "2026-10-16" }), execucao({ date: "2026-10-09" })];
    expect(ultimaVez(historico, "mesa", "atual")?.date).toBe("2026-10-09");
  });
});

describe("preencherSerie", () => {
  const ultima = [kg(75, 9), kg(75, 7)];

  it.each([
    ["1ª série copia a 1ª da última vez", ultima, [], kg(75, 9)],
    ["2ª série copia a 2ª da última vez", ultima, [kg(80, 8)], kg(75, 7)],
    ["além da última vez, repete a anterior de hoje", ultima, [kg(75, 9), kg(77.5, 7)], kg(77.5, 7)],
    ["sem última vez, repete a anterior de hoje", null, [placas(4, 12)], placas(4, 12)],
    ["sem última vez e sem série hoje, vazio", null, [], null],
    ["peso corporal é copiado sem carga", [corporal(15)], [], corporal(15)],
  ])("%s", (_caso, ultimaVezSeries, deHoje, esperado) => {
    expect(preencherSerie(ultimaVezSeries, deHoje)).toEqual(esperado);
  });
});

describe("situacaoDoExercicio", () => {
  it.each([
    ["sem registro", null, "Pendente"],
    ["registro sem série (só troca ou nota)", { status: "Done", series: [] }, "Pendente"],
    ["com série", { status: "Done", series: [kg(60, 10)] }, "Feito"],
    ["pulado", { status: "Skipped", series: [] }, "Pulado"],
  ] as const)("%s → %s", (_caso, registro, esperado) => {
    expect(situacaoDoExercicio(registro)).toBe(esperado);
  });
});

describe("podePular", () => {
  it.each([
    ["sem registro", null, true],
    ["registro sem série", { status: "Done", series: [] }, true],
    ["já tem série", { status: "Done", series: [kg(60, 10)] }, false],
    ["já pulado", { status: "Skipped", series: [] }, false],
  ] as const)("%s → %s", (_caso, registro, esperado) => {
    expect(podePular(registro)).toBe(esperado);
  });
});

describe("foiSubstituido", () => {
  it.each([
    ["feito o prescrito", "legpress", "legpress", false],
    ["feito outro no lugar", "legpress", "agachamento", true],
    ["fora da ficha não é troca", null, "agachamento", false],
  ])("%s → %s", (_caso, prescrito, feito, esperado) => {
    expect(foiSubstituido(prescrito, feito)).toBe(esperado);
  });
});

describe("formatarCarga", () => {
  it.each([
    [65, "Kg", "65 kg"],
    [58.5, "Kg", "58,5 kg"],
    [22.25, "Kg", "22,25 kg"],
    [4, "Plates", "4 placas"],
    [1, "Plates", "1 placa"],
    [null, "Bodyweight", "peso corporal"],
  ] as const)("%s %s → %s", (load, unidade, esperado) => {
    expect(formatarCarga(load, unidade)).toBe(esperado);
  });
});

describe("formatarSeries", () => {
  it.each([
    [[kg(75, 9), kg(75, 7)], "75 kg × 9, 7"],
    [[kg(75, 9)], "75 kg × 9"],
    [[kg(70, 10), kg(75, 8), kg(75, 6)], "70 kg × 10 · 75 kg × 8, 6"],
    [[placas(4, 12), placas(4, 10)], "4 placas × 12, 10"],
    [[corporal(20), corporal(15)], "peso corporal × 20, 15"],
    [[kg(75, 9), kg(70, 8), kg(75, 7)], "75 kg × 9 · 70 kg × 8 · 75 kg × 7"],
    [[], ""],
  ])("%j → %s", (series, esperado) => {
    expect(formatarSeries(series)).toBe(esperado);
  });
});

describe("lerDecimal", () => {
  it.each([
    ["58,5", 58.5],
    ["58.5", 58.5],
    [" 60 ", 60],
    ["0,25", 0.25],
    ["", null],
    ["   ", null],
    ["abc", null],
    ["5,5,5", null],
  ])("%j → %s", (texto, esperado) => {
    expect(lerDecimal(texto)).toBe(esperado);
  });
});

describe("haQuantoTempo", () => {
  it.each([
    ["2026-10-16", "hoje"],
    ["2026-10-15", "ontem"],
    ["2026-10-12", "há 4 dias"],
    ["2026-09-30", "há 16 dias"],
    ["2025-10-16", "há 365 dias"],
  ])("%s → %s", (data, esperado) => {
    expect(haQuantoTempo(data, "2026-10-16")).toBe(esperado);
  });

  it("atravessa o horário de verão e a virada do ano sem errar o dia", () => {
    expect(haQuantoTempo("2026-12-31", "2027-01-02")).toBe("há 2 dias");
  });
});
