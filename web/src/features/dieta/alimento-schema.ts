import { z } from "zod";
import { lerDecimal } from "@/domain/treino/sessao";

const nome = z.string().trim().min(1, "Informe o nome do alimento").max(120, "Use até 120 caracteres");

const kcalPor100g = z
  .number({ error: "Informe as kcal por 100 g" })
  .min(0, "Informe as kcal por 100 g")
  .max(900, "Use até 900 kcal por 100 g");

/** Alimento próprio (`Custom`) como vai para o banco. A Server Action valida com este schema. */
export const alimentoSchema = z.object({ name: nome, kcal_per_100g: kcalPor100g });

export type NovoAlimento = z.infer<typeof alimentoSchema>;

export const editarAlimentoSchema = alimentoSchema.extend({ id: z.uuid() });

export type AlimentoEditado = z.infer<typeof editarAlimentoSchema>;

/** O que o formulário tem: kcal digitada no celular ("265,5"). */
export const alimentoDoFormularioSchema = z
  .object({
    name: nome,
    kcal: z
      .string()
      .transform((texto) => lerDecimal(texto) ?? Number.NaN)
      .pipe(kcalPor100g),
  })
  .transform(({ name, kcal }) => ({ name, kcal_per_100g: kcal }));

export type AlimentoDoFormulario = z.input<typeof alimentoDoFormularioSchema>;
