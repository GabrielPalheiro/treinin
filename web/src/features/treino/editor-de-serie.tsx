"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "cn";
import { useId } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ResultadoDaAcao } from "@/lib/resultado-da-acao";
import { serieDoFormularioSchema, UNIDADES, type Serie, type SerieDoFormulario } from "./serie-schema";

const ROTULO_DA_UNIDADE = { Kg: "kg", Plates: "placas", Bodyweight: "corporal" } as const;

type Props = {
  valores: Serie | null;
  unidadePadrao?: Serie["load_unit"];
  textoDoBotao: string;
  acao: (serie: Serie) => Promise<ResultadoDaAcao>;
  aoTerminar: () => void;
  aoRemover?: () => Promise<ResultadoDaAcao>;
};

// 58.5 → "58,5", como se digita no celular.
const paraTexto = (n: number | null) => (n === null ? "" : String(n).replace(".", ","));

/** Carga, unidade e reps de uma série, editados no próprio cartão. Sem modal. */
export function EditorDeSerie({ valores, unidadePadrao = "Kg", textoDoBotao, acao, aoTerminar, aoRemover }: Props) {
  const prefixo = useId();
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SerieDoFormulario, unknown, Serie>({
    resolver: zodResolver(serieDoFormularioSchema),
    defaultValues: {
      carga: paraTexto(valores?.load ?? null),
      load_unit: valores?.load_unit ?? unidadePadrao,
      reps: valores ? String(valores.reps) : "",
    },
  });
  const unidade = useWatch({ control, name: "load_unit" });

  const salvar = handleSubmit(async (serie) => {
    const resultado = await acao(serie);
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
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor={`${prefixo}-carga`}>Carga</Label>
          <Input
            id={`${prefixo}-carga`}
            inputMode="decimal"
            autoComplete="off"
            disabled={unidade === "Bodyweight"}
            placeholder={unidade === "Bodyweight" ? "—" : "0"}
            className="bg-background"
            aria-invalid={Boolean(errors.carga)}
            aria-describedby={errors.carga ? `${prefixo}-carga-erro` : undefined}
            {...register("carga")}
          />
          {errors.carga && (
            <p id={`${prefixo}-carga-erro`} className="text-sm text-destructive">
              {errors.carga.message}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor={`${prefixo}-reps`}>Reps</Label>
          <Input
            id={`${prefixo}-reps`}
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            className="bg-background"
            aria-invalid={Boolean(errors.reps)}
            aria-describedby={errors.reps ? `${prefixo}-reps-erro` : undefined}
            {...register("reps")}
          />
          {errors.reps && (
            <p id={`${prefixo}-reps-erro`} className="text-sm text-destructive">
              {errors.reps.message}
            </p>
          )}
        </div>
      </div>

      <div role="radiogroup" aria-label="Unidade da carga" className="grid grid-cols-3 gap-1">
        {UNIDADES.map((u) => (
          <button
            key={u}
            type="button"
            role="radio"
            aria-checked={unidade === u}
            onClick={() => setValue("load_unit", u)}
            className={cn(
              "min-h-toque rounded-md border text-sm font-medium transition-colors",
              unidade === u ? "border-primary bg-primary text-primary-foreground" : "bg-background",
            )}
          >
            {ROTULO_DA_UNIDADE[u]}
          </button>
        ))}
      </div>

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
