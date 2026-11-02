import { describe, expect, it } from "vitest";
import { metaDoFormularioSchema } from "./meta-schema";

describe("metaDoFormularioSchema", () => {
  it.each([
    ["2100", 2100],
    ["2.100", 2100],
    [" 1800 ", 1800],
    ["500", 500],
    ["9999", 9999],
  ])("%j → %d kcal", (kcal, esperado) => {
    expect(metaDoFormularioSchema.parse({ kcal })).toEqual({ kcal: esperado });
  });

  it.each([
    ["", "Informe a meta em kcal"],
    ["abc", "Informe a meta em kcal"],
    ["2100,5", "Informe a meta em kcal"],
    ["499", "Use pelo menos 500 kcal"],
    ["10000", "Use até 9.999 kcal"],
  ])("%j acusa %j", (kcal, mensagem) => {
    expect(metaDoFormularioSchema.safeParse({ kcal }).error?.issues[0]?.message).toBe(mensagem);
  });
});
