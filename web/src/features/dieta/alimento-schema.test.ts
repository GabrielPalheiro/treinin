import { describe, expect, it } from "vitest";
import { alimentoDoFormularioSchema } from "./alimento-schema";

describe("alimentoDoFormularioSchema", () => {
  it.each([
    [{ name: "Whey da marca X", kcal: "400" }, { name: "Whey da marca X", kcal_per_100g: 400 }],
    [{ name: "  Pão da padaria  ", kcal: "265,5" }, { name: "Pão da padaria", kcal_per_100g: 265.5 }],
    [{ name: "Café sem açúcar", kcal: "0" }, { name: "Café sem açúcar", kcal_per_100g: 0 }],
    [{ name: "Óleo", kcal: "900" }, { name: "Óleo", kcal_per_100g: 900 }],
  ])("%j → %j", (entrada, esperado) => {
    expect(alimentoDoFormularioSchema.parse(entrada)).toEqual(esperado);
  });

  it.each([
    [{ name: "", kcal: "100" }, "name", "Informe o nome do alimento"],
    [{ name: "   ", kcal: "100" }, "name", "Informe o nome do alimento"],
    [{ name: "x".repeat(121), kcal: "100" }, "name", "Use até 120 caracteres"],
    [{ name: "Whey", kcal: "" }, "kcal", "Informe as kcal por 100 g"],
    [{ name: "Whey", kcal: "abc" }, "kcal", "Informe as kcal por 100 g"],
    [{ name: "Whey", kcal: "900,1" }, "kcal", "Use até 900 kcal por 100 g"],
  ])("%j acusa erro em %s", (entrada, campo, mensagem) => {
    const resultado = alimentoDoFormularioSchema.safeParse(entrada);
    expect(resultado.error?.issues).toEqual([expect.objectContaining({ path: [campo], message: mensagem })]);
  });
});
