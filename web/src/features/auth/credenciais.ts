import { z } from "zod";

/** Mesmo schema no formulário e na Server Action. */
export const credenciaisSchema = z.object({
  email: z.email("Informe um e-mail válido"),
  senha: z.string().min(1, "Informe a senha"),
});

export type Credenciais = z.infer<typeof credenciaisSchema>;
