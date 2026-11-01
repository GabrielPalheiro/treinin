"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calcularKcal } from "@/domain/dieta/registro";
import { lerDecimal } from "@/domain/treino/sessao";
import type { ResultadoDaAcao } from "@/lib/resultado-da-acao";
import type { Alimento } from "./consultas";
import { gramasDoFormularioSchema, type Gramas, type GramasDoFormulario } from "./registro-schema";

type Props = {
  alimento: Alimento;
  gramas: number | null;
  textoDoBotao: string;
  acao: (gramas: number) => Promise<ResultadoDaAcao>;
  aoTerminar: () => void;
  aoRemover?: () => Promise<ResultadoDaAcao>;
};

// 87.5 → "87,5", como se digita no celular.
const paraTexto = (n: number | null) => (n === null ? "" : String(n).replace(".", ","));

/** Gramas de um alimento, com o kcal calculado na hora. Sem modal. */
export function EditorDeGramas({ alimento, gramas, textoDoBotao, acao, aoTerminar, aoRemover }: Props) {
  const prefixo = useId();
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<GramasDoFormulario, unknown, Gramas>({
    resolver: zodResolver(gramasDoFormularioSchema),
    defaultValues: { gramas: paraTexto(gramas) },
  });
  const digitado = lerDecimal(useWatch({ control, name: "gramas" }));
  const kcal = digitado === null ? null : calcularKcal(alimento.kcal_per_100g, digitado);

  const salvar = handleSubmit(async (dados) => {
    const resultado = await acao(dados.gramas);
    if (resultado) setError("root", { message: resultado.erro });
    else aoTerminar();
  });

  const remover = async () => {
    const resultado = await aoRemover?.();
    if (resultado) setError("root", { message: resultado.erro });
    else aoTerminar();
  };

  return (
    <form onSubmit={salvar} noValidate className="flex flex-col gap-3 rounded-md bg-muted p-3">
      <p className="font-medium leading-tight">{alimento.name}</p>
      <div className="grid grid-cols-2 items-end gap-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor={`${prefixo}-gramas`}>Gramas</Label>
          <Input
            id={`${prefixo}-gramas`}
            inputMode="decimal"
            autoComplete="off"
            autoFocus
            placeholder="0"
            className="bg-background"
            aria-invalid={Boolean(errors.gramas)}
            aria-describedby={errors.gramas ? `${prefixo}-gramas-erro` : undefined}
            {...register("gramas")}
          />
        </div>
        <p className="flex h-toque items-center text-lg font-semibold tabular-nums" aria-live="polite">
          {kcal === null ? "— kcal" : `${kcal} kcal`}
        </p>
      </div>
      {errors.gramas && (
        <p id={`${prefixo}-gramas-erro`} className="text-sm text-destructive">
          {errors.gramas.message}
        </p>
      )}

      {errors.root && (
        <p role="alert" className="text-sm text-destructive">
          {errors.root.message}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        {aoRemover ? (
          <Button type="button" variant="outline" disabled={isSubmitting} onClick={remover} className="text-destructive">
            Remover
          </Button>
        ) : (
          <Button type="button" variant="outline" onClick={aoTerminar}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando…" : textoDoBotao}
        </Button>
      </div>
      {aoRemover && (
        <Button type="button" variant="ghost" onClick={aoTerminar}>
          Cancelar
        </Button>
      )}
    </form>
  );
}
