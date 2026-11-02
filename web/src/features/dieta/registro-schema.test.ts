import { describe, expect, it } from "vitest";
import { copiaSchema, gramasDoFormularioSchema } from "./registro-schema";

describe("copiaSchema", () => {
  it("aceita copiar de outro dia", () => {
    const copia = { origem: "2026-11-01", destino: "2026-11-02", meal: "Lunch" };
    expect(copiaSchema.parse(copia)).toEqual(copia);
  });

  it.each([
    [{ origem: "2026-11-02", destino: "2026-11-02", meal: "Lunch" }, "Escolha outro dia"],
    [{ origem: "", destino: "2026-11-02", meal: "Lunch" }, "Escolha o dia"],
    [{ origem: "2026-02-30", destino: "2026-11-02", meal: "Lunch" }, "Escolha o dia"],
  ])("%j acusa %j", (copia, mensagem) => {
    const resultado = copiaSchema.safeParse(copia);
    expect(resultado.error?.issues).toEqual([expect.objectContaining({ path: ["origem"], message: mensagem })]);
  });
});

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
