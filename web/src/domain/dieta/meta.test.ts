import { describe, expect, it } from "vitest";
import { progressoDaMeta } from "./meta";

describe("progressoDaMeta", () => {
  it.each([
    // [consumido, meta, falta, excedente, fração da barra]
    ["nada consumido", 0, 2000, 2000, 0, 0],
    ["metade", 1000, 2000, 1000, 0, 0.5],
    ["quase lá", 1750, 2100, 350, 0, 1750 / 2100],
    ["exatamente na meta", 2000, 2000, 0, 0, 1],
    ["acima da meta", 2250, 2000, 0, 250, 1],
  ])("%s", (_caso, consumido, meta, falta, excedente, fracao) => {
    expect(progressoDaMeta(consumido, meta)).toEqual({ falta, excedente, fracao });
  });
});
