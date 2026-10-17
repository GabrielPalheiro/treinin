import { z } from "zod";
import { lerDecimal } from "@/domain/treino/sessao";

export const UNIDADES = ["Kg", "Plates", "Bodyweight"] as const;

/** A série como vai para o banco. A Server Action valida com este schema. */
export const serieSchema = z
  .object({
    load: z.number().positive("A carga precisa ser maior que zero").max(9999, "Carga alta demais").nullable(),
    load_unit: z.enum(UNIDADES),
    reps: z
      .number({ error: "Informe as reps" })
      .int("Reps são um número inteiro")
      .min(1, "Pelo menos 1 rep")
      .max(1000, "Reps demais"),
  })
  .refine((s) => (s.load_unit === "Bodyweight") === (s.load === null), {
    message: "Informe a carga",
    path: ["load"],
  });

export type Serie = z.output<typeof serieSchema>;

/** O que o formulário tem: texto digitado no celular ("58,5"). Converte e passa pelo serieSchema. */
export const serieDoFormularioSchema = z
  .object({
    carga: z.string(),
    load_unit: z.enum(UNIDADES),
    reps: z.string(),
  })
  .transform(({ carga, load_unit, reps }, ctx) => {
    const load = load_unit === "Bodyweight" ? null : lerDecimal(carga);
    const resultado = serieSchema.safeParse({
      load,
      load_unit,
      reps: reps.trim() === "" ? Number.NaN : Number(reps.trim()),
    });
    if (resultado.success) return resultado.data;

    // Mesmas regras do serieSchema, com o erro apontando para o campo da tela.
    const campos = new Set<string>();
    for (const problema of resultado.error.issues) {
      const campo = problema.path[0] === "load" ? "carga" : String(problema.path[0] ?? "");
      if (campos.has(campo)) continue;
      campos.add(campo);
      ctx.addIssue({ code: "custom", message: problema.message, path: campo ? [campo] : [] });
    }
    // A regra da carga só roda com o resto válido; aqui ela vale junto, para acusar tudo de uma vez.
    if (load_unit !== "Bodyweight" && load === null && !campos.has("carga")) {
      ctx.addIssue({ code: "custom", message: "Informe a carga", path: ["carga"] });
    }
    return z.NEVER;
  });

export type SerieDoFormulario = z.input<typeof serieDoFormularioSchema>;

export const observacaoSchema = z.object({
  note: z
    .string()
    .trim()
    .max(1000, "Use até 1000 caracteres")
    .nullish()
    .transform((nota) => nota || null),
});

export type Observacao = z.input<typeof observacaoSchema>;


export const notaDoExercicioSchema = z.object({
  note: z
    .string()
    .trim()
    .max(500, "Use até 500 caracteres")
    .nullish()
    .transform((nota) => nota || null),
});

export type NotaDoExercicio = z.input<typeof notaDoExercicioSchema>;