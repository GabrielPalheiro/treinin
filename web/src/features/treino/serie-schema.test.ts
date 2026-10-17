import { describe, expect, it } from "vitest";
import { serieDoFormularioSchema } from "./serie-schema";

describe("serieDoFormularioSchema", () => {
  it.each([
    [{ carga: "58,5", load_unit: "Kg", reps: "10" }, { load: 58.5, load_unit: "Kg", reps: 10 }],
    [{ carga: "4", load_unit: "Plates", reps: "12" }, { load: 4, load_unit: "Plates", reps: 12 }],
    [{ carga: "", load_unit: "Bodyweight", reps: "15" }, { load: null, load_unit: "Bodyweight", reps: 15 }],
    [{ carga: "20", load_unit: "Bodyweight", reps: "15" }, { load: null, load_unit: "Bodyweight", reps: 15 }],
  ] as const)("%j → %j", (entrada, esperado) => {
    expect(serieDoFormularioSchema.parse(entrada)).toEqual(esperado);
  });

  it.each([
    [{ carga: "", load_unit: "Kg", reps: "10" }, "carga"],
    [{ carga: "abc", load_unit: "Kg", reps: "10" }, "carga"],
    [{ carga: "0", load_unit: "Kg", reps: "10" }, "carga"],
    [{ carga: "50", load_unit: "Kg", reps: "" }, "reps"],
    [{ carga: "50", load_unit: "Kg", reps: "0" }, "reps"],
    [{ carga: "50", load_unit: "Kg", reps: "8,5" }, "reps"],
  ] as const)("%j acusa erro em %s", (entrada, campo) => {
    const resultado = serieDoFormularioSchema.safeParse(entrada);
    expect(resultado.success).toBe(false);
    expect(resultado.error?.issues.map((i) => i.path[0])).toContain(campo);
  });

  it("carga e reps vazias acusam os dois campos de uma vez", () => {
    const resultado = serieDoFormularioSchema.safeParse({ carga: "", load_unit: "Kg", reps: "" });
    expect(resultado.error?.issues.map((i) => [i.path[0], i.message])).toEqual([
      ["reps", "Informe as reps"],
      ["carga", "Informe a carga"],
    ]);
  });
});
