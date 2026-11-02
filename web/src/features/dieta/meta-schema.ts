import { z } from "zod";

/** A meta como vai para o banco (`diet_goals.daily_kcal`). A Server Action valida com este schema. */
export const metaSchema = z
  .number({ error: "Informe a meta em kcal" })
  .int("Informe a meta em kcal")
  .min(500, "Use pelo menos 500 kcal")
  .max(9999, "Use até 9.999 kcal");

/** O que o formulário tem: texto digitado, com ou sem ponto de milhar ("2.100"). */
export const metaDoFormularioSchema = z.object({
  kcal: z
    .string()
    .transform((texto) => {
      const digitos = texto.trim().replaceAll(".", "");
      return /^\d+$/.test(digitos) ? Number(digitos) : Number.NaN;
    })
    .pipe(metaSchema),
});

export type MetaDoFormulario = z.input<typeof metaDoFormularioSchema>;
export type Meta = z.output<typeof metaDoFormularioSchema>;
