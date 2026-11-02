import { z } from "zod";

/** Mesmo schema no formulário e na Server Action. 8 é o mínimo do Supabase; 72, o limite do bcrypt. */
export const novaSenhaSchema = z
  .object({
    senha: z
      .string()
      .min(1, "Informe a nova senha")
      .min(8, "Use pelo menos 8 caracteres")
      .max(72, "Use no máximo 72 caracteres"),
    confirmacao: z.string(),
  })
  .refine((dados) => dados.senha === dados.confirmacao, {
    message: "As senhas não conferem",
    path: ["confirmacao"],
  });

export type NovaSenha = z.infer<typeof novaSenhaSchema>;
