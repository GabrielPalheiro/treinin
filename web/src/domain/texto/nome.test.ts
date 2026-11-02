import { describe, expect, it } from "vitest";
import { encontrarPorNome, normalizarNome } from "./nome";

describe("normalizarNome", () => {
  it.each([
    ["Supino reto", "Supino reto"],
    ["  Supino reto  ", "Supino reto"],
    ["Supino   reto\tmáquina", "Supino reto máquina"],
    ["", ""],
  ])("%j → %j", (entrada, esperado) => {
    expect(normalizarNome(entrada)).toBe(esperado);
  });
});

describe("encontrarPorNome", () => {
  // Mesmo critério dos índices únicos do banco: lower(btrim(name)).
  const lista = [{ id: "1", name: "Supino reto" }, { id: "2", name: "Elevação lateral" }];

  it.each([
    ["Supino reto", "1"],
    ["supino RETO", "1"],
    ["  Supino   reto ", "1"],
    ["Elevação lateral", "2"],
    ["Elevacao lateral", undefined],
    ["Supino", undefined],
    ["", undefined],
  ])("%j → %j", (nome, idEsperado) => {
    expect(encontrarPorNome(lista, nome)?.id).toBe(idEsperado);
  });
});
