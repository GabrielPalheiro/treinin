import { z } from "zod";

/** Mesmo schema no formulário e na Server Action. */
export const nomeDoExercicioSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do exercício").max(80, "Use até 80 caracteres"),
});

export type NomeDoExercicio = z.infer<typeof nomeDoExercicioSchema>;

export const renomearExercicioSchema = nomeDoExercicioSchema.extend({
  id: z.uuid(),
});

export type RenomearExercicio = z.infer<typeof renomearExercicioSchema>;
