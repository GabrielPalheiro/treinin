import { describe, expect, it } from "vitest";
import { gramasDoFormularioSchema } from "./registro-schema";

describe("gramasDoFormularioSchema", () => {
  it.each([
    ["150", 150],
    ["87,5", 87.5],
    ["87.5", 87.5],
    [" 30 ", 30],
    ["10000", 10000],
  ])("%j → %d g", (gramas, esperado) => {
    expect(gramasDoFormularioSchema.parse({ gramas })).toEqual({ gramas: esperado });
  });

  it.each([
    ["", "Informe os gramas"],
    ["abc", "Informe os gramas"],
    ["-5", "Informe os gramas"],
    ["0", "Os gramas precisam ser maiores que zero"],
    ["10000,5", "Use até 10.000 g"],
  ])("%j acusa %j", (gramas, mensagem) => {
    const resultado = gramasDoFormularioSchema.safeParse({ gramas });
    expect(resultado.error?.issues).toEqual([expect.objectContaining({ path: ["gramas"], message: mensagem })]);
  });
});
