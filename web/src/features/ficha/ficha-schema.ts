import { z } from "zod";
import { faixaDeRepsValida, LIMITES_DA_PRESCRICAO } from "@/domain/treino/ficha";

const { seriesMin, seriesMax, repsMin, repsMax, tecnicaMax } = LIMITES_DA_PRESCRICAO;

/** Mesmos schemas no formulário e na Server Action. */
export const nomeDaFichaSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da ficha").max(80, "Use até 80 caracteres"),
});

export const nomeDoTreinoSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do treino").max(40, "Use até 40 caracteres"),
});

export type Nome = z.infer<typeof nomeDaFichaSchema>;

const inteiro = (campo: string, min: number, max: number) =>
  z.coerce
    .number({ error: `Informe ${campo}` })
    .int(`Use um número inteiro em ${campo}`)
    .min(min, `${campo}: mínimo ${min}`)
    .max(max, `${campo}: máximo ${max}`);

export const prescricaoSchema = z
  .object({
    target_sets: inteiro("as séries", seriesMin, seriesMax),
    rep_min: inteiro("as reps mínimas", repsMin, repsMax),
    rep_max: inteiro("as reps máximas", repsMin, repsMax),
    technique: z
      .string()
      .trim()
      .max(tecnicaMax, `Técnica: até ${tecnicaMax} caracteres`)
      .nullish()
      .transform((tecnica) => tecnica || null),
  })
  .refine((p) => faixaDeRepsValida(p.rep_min, p.rep_max), {
    message: "O mínimo de reps precisa ser menor ou igual ao máximo",
    path: ["rep_max"],
  });

export type PrescricaoEntrada = z.input<typeof prescricaoSchema>;
export type Prescricao = z.output<typeof prescricaoSchema>;

export const id = z.uuid();
export const listaDeIds = z.array(z.uuid()).min(1);
