import { describe, expect, it } from "vitest";
import { faixaDeRepsValida, formatarPrescricao, moverItem, proximaPosicao } from "./ficha";

describe("moverItem", () => {
  const treinos = ["Lower A", "Upper A", "Lower B", "Upper B"];

  it.each([
    [1, 0, ["Upper A", "Lower A", "Lower B", "Upper B"]],
    [0, 1, ["Upper A", "Lower A", "Lower B", "Upper B"]],
    [3, 2, ["Lower A", "Upper A", "Upper B", "Lower B"]],
    [0, 3, ["Upper A", "Lower B", "Upper B", "Lower A"]],
    [2, 2, ["Lower A", "Upper A", "Lower B", "Upper B"]],
  ])("de %i para %i", (de, para, esperado) => {
    expect(moverItem(treinos, de, para)).toEqual(esperado);
  });

  it.each([
    [0, -1],
    [3, 4],
    [-1, 0],
    [9, 0],
  ])("fora da lista (de %i para %i) devolve a ordem igual", (de, para) => {
    expect(moverItem(treinos, de, para)).toEqual(treinos);
  });

  it("não altera a lista original", () => {
    const original = [...treinos];
    moverItem(treinos, 0, 1);
    expect(treinos).toEqual(original);
  });
});

describe("proximaPosicao", () => {
  it.each([
    [[], 1],
    [[1], 2],
    [[1, 2, 3], 4],
    [[1, 3], 4],
    [[3, 1, 2], 4],
  ])("%j → %i", (posicoes, esperado) => {
    expect(proximaPosicao(posicoes)).toBe(esperado);
  });
});

describe("formatarPrescricao", () => {
  it.each([
    [{ target_sets: 2, rep_min: 8, rep_max: 10 }, "2 × 8–10"],
    [{ target_sets: 3, rep_min: 10, rep_max: 10 }, "3 × 10"],
    [{ target_sets: 1, rep_min: 6, rep_max: 8 }, "1 × 6–8"],
  ])("%j → %s", (prescricao, esperado) => {
    expect(formatarPrescricao(prescricao)).toBe(esperado);
  });
});

describe("faixaDeRepsValida", () => {
  it.each([
    [8, 10, true],
    [10, 10, true],
    [1, 100, true],
    [12, 8, false],
    [0, 10, false],
    [8, 101, false],
    [8.5, 10, false],
  ])("%d–%d → %s", (min, max, esperado) => {
    expect(faixaDeRepsValida(min, max)).toBe(esperado);
  });
});
