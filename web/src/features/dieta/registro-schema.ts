import { z } from "zod";
import { refeicoesEmOrdem } from "@/domain/dieta/registro";
import { lerDecimal } from "@/domain/treino/sessao";

/** Gramas como vão para o banco. A Server Action valida com este schema. */
export const gramasSchema = z
  .number({ error: "Informe os gramas" })
  .positive("Os gramas precisam ser maiores que zero")
  .max(10000, "Use até 10.000 g");

/** O que o formulário tem: texto digitado no celular ("87,5"). */
export const gramasDoFormularioSchema = z.object({
  gramas: z
    .string()
    .transform((texto) => lerDecimal(texto) ?? Number.NaN)
    .pipe(gramasSchema),
});

export type GramasDoFormulario = z.input<typeof gramasDoFormularioSchema>;
export type Gramas = z.output<typeof gramasDoFormularioSchema>;

/** Um alimento novo numa refeição. O kcal não vem da tela: a action calcula. */
export const novoRegistroSchema = z.object({
  date: z.iso.date(),
  meal: z.enum(refeicoesEmOrdem),
  food_id: z.uuid(),
  grams: gramasSchema,
});

export type NovoRegistro = z.infer<typeof novoRegistroSchema>;

/** "Copiar de…": a mesma refeição de outro dia (`origem`) para o dia na tela (`destino`). */
export const copiaSchema = z
  .object({
    origem: z.iso.date({ error: "Escolha o dia" }),
    destino: z.iso.date(),
    meal: z.enum(refeicoesEmOrdem),
  })
  .refine((c) => c.origem !== c.destino, { message: "Escolha outro dia", path: ["origem"] });

export type Copia = z.infer<typeof copiaSchema>;
