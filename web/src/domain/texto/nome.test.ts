import { describe, expect, it } from "vitest";
import { normalizarNome } from "./nome";

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
