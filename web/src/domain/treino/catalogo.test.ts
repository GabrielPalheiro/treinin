import { describe, expect, it } from "vitest";
import { buscarExercicios } from "./catalogo";

describe("buscarExercicios", () => {
  const catalogo = [
    { name: "Supino reto máquina" },
    { name: "Cadeira extensora" },
    { name: "Agachamento guiado" },
    { name: "Mesa flexora" },
    { name: "Elevação lateral" },
  ];
  const nomes = (lista: { name: string }[]) => lista.map((e) => e.name);

  it("sem termo devolve todos em ordem alfabética", () => {
    expect(nomes(buscarExercicios(catalogo, ""))).toEqual([
      "Agachamento guiado",
      "Cadeira extensora",
      "Elevação lateral",
      "Mesa flexora",
      "Supino reto máquina",
    ]);
  });

  it("termo só com espaços conta como vazio", () => {
    expect(buscarExercicios(catalogo, "   ")).toHaveLength(5);
  });

  it.each([
    ["supino", ["Supino reto máquina"]],
    ["SUPINO", ["Supino reto máquina"]],
    ["maquina", ["Supino reto máquina"]],
    ["elevacao", ["Elevação lateral"]],
    ["ELEVAÇÃO", ["Elevação lateral"]],
    ["sup maq", ["Supino reto máquina"]],
    ["maq sup", ["Supino reto máquina"]],
    ["ora", ["Cadeira extensora", "Mesa flexora"]],
    ["terra", []],
  ])("%j acha %j", (termo, esperado) => {
    expect(nomes(buscarExercicios(catalogo, termo))).toEqual(esperado);
  });

  it("preserva os outros campos do item", () => {
    const [achado] = buscarExercicios([{ id: "x", name: "Remada" }], "rem");
    expect(achado).toEqual({ id: "x", name: "Remada" });
  });
});
