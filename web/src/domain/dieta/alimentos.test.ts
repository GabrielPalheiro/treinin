import { describe, expect, it } from "vitest";
import { buscarAlimentos } from "./alimentos";

describe("buscarAlimentos", () => {
  const alimentos = [
    { id: "arroz", name: "Arroz, tipo 1, cozido" },
    { id: "biscoito", name: "Biscoito, doce, maisena" },
    { id: "feijao", name: "Feijão, carioca, cozido" },
    { id: "pao", name: "Pão, trigo, francês" },
    { id: "macarrao", name: "Macarrão, trigo, cru" },
    { id: "farinha", name: "Farinha, de arroz" },
  ];
  const ids = (lista: { id: string }[]) => lista.map((a) => a.id);
  const semUso = new Map<string, number>();

  it("sem termo devolve todos em ordem alfabética", () => {
    expect(ids(buscarAlimentos(alimentos, "", semUso))).toEqual([
      "arroz",
      "biscoito",
      "farinha",
      "feijao",
      "macarrao",
      "pao",
    ]);
  });

  it.each([
    ["feijao", ["feijao"]],
    ["FEIJÃO", ["feijao"]],
    ["pao frances", ["pao"]],
    ["frances pao", ["pao"]],
    ["trigo", ["macarrao", "pao"]],
    ["cozido", ["arroz", "feijao"]],
    ["  cozido  ", ["arroz", "feijao"]],
    ["picanha", []],
  ])("%j acha %j", (termo, esperado) => {
    expect(ids(buscarAlimentos(alimentos, termo, semUso))).toEqual(esperado);
  });

  it("nome que começa com o termo vem antes do que só o contém", () => {
    const lista = [
      { id: "farinha", name: "Farinha, de mandioca" },
      { id: "biscoito", name: "Biscoito, de mandioca" },
      { id: "mandioca", name: "Mandioca, cozida" },
    ];
    expect(ids(buscarAlimentos(lista, "mandioca", semUso))).toEqual(["mandioca", "biscoito", "farinha"]);
  });

  it("mais usados primeiro, antes da ordem alfabética", () => {
    const usos = new Map([
      ["pao", 3],
      ["feijao", 7],
    ]);
    expect(ids(buscarAlimentos(alimentos, "", usos))).toEqual([
      "feijao",
      "pao",
      "arroz",
      "biscoito",
      "farinha",
      "macarrao",
    ]);
  });

  it("mais usado vence o nome que começa com o termo", () => {
    const usos = new Map([["farinha", 1]]);
    expect(ids(buscarAlimentos(alimentos, "arroz", usos))).toEqual(["farinha", "arroz"]);
  });

  it("preserva os outros campos do item", () => {
    const [achado] = buscarAlimentos([{ id: "x", name: "Ovo", kcal_per_100g: 146 }], "ovo", semUso);
    expect(achado).toEqual({ id: "x", name: "Ovo", kcal_per_100g: 146 });
  });
});
