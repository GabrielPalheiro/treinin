import { describe, expect, it } from "vitest";
import { calcularKcal, refeicoesEmOrdem, totalDoDia, totalPorRefeicao } from "./registro";

describe("calcularKcal", () => {
  it.each([
    // [kcal por 100 g, gramas, kcal]
    [128, 100, 128],
    [128, 150, 192],
    [128, 0.5, 1],
    [360, 30, 108],
    [33.3, 15, 5],
    [884, 10.4, 92],
    [0, 250, 0],
    // 34,5 exato: o ponto flutuante daria 34,4999…
    [18.4, 187.5, 35],
    [5, 10, 1],
    [4.9, 10, 0],
  ])("%d kcal/100 g × %d g → %d kcal", (kcalPor100g, gramas, esperado) => {
    expect(calcularKcal(kcalPor100g, gramas)).toBe(esperado);
  });
});

describe("totalDoDia", () => {
  it("sem registros é zero", () => {
    expect(totalDoDia([])).toBe(0);
  });

  it("soma o kcal gravado de cada registro", () => {
    expect(totalDoDia([{ kcal: 192 }, { kcal: 108 }, { kcal: 0 }])).toBe(300);
  });
});

describe("totalPorRefeicao", () => {
  it("toda refeição aparece, com zero quando não tem registro", () => {
    expect(totalPorRefeicao([])).toEqual({ Breakfast: 0, Lunch: 0, Snack: 0, Dinner: 0, Supper: 0 });
  });

  it("soma o kcal de cada refeição separadamente", () => {
    const registros = [
      { meal: "Lunch", kcal: 192 },
      { meal: "Breakfast", kcal: 108 },
      { meal: "Lunch", kcal: 70 },
      { meal: "Supper", kcal: 5 },
    ] as const;
    expect(totalPorRefeicao(registros)).toEqual({ Breakfast: 108, Lunch: 262, Snack: 0, Dinner: 0, Supper: 5 });
  });
});

describe("refeicoesEmOrdem", () => {
  it("segue a ordem do dia", () => {
    expect(refeicoesEmOrdem).toEqual(["Breakfast", "Lunch", "Snack", "Dinner", "Supper"]);
  });
});
