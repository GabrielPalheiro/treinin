"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { prescricaoSchema, type Prescricao, type PrescricaoEntrada } from "./ficha-schema";
import type { ResultadoDaAcao } from "@/lib/resultado-da-acao";

type Props = {
  valoresIniciais: PrescricaoEntrada;
  textoDoBotao: string;
  acao: (dados: Prescricao) => Promise<ResultadoDaAcao>;
  aoCancelar?: () => void;
  aoSalvar?: () => void;
};

const CAMPOS_NUMERICOS = [
  { nome: "target_sets", rotulo: "Séries" },
  { nome: "rep_min", rotulo: "Reps mín." },
  { nome: "rep_max", rotulo: "Reps máx." },
] as const;

/** Séries, faixa de reps e técnica. Editado no próprio cartão, sem modal. */
export function FormularioDePrescricao({ valoresIniciais, textoDoBotao, acao, aoCancelar, aoSalvar }: Props) {
  const prefixo = useId();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PrescricaoEntrada, unknown, Prescricao>({
    resolver: zodResolver(prescricaoSchema),
    defaultValues: valoresIniciais,
  });

  const enviar = handleSubmit(async (dados) => {
    const resultado = await acao(dados);
    if (resultado) {
      setError("root", { message: resultado.erro });
      return;
    }
    aoSalvar?.();
  });

  const erroNumerico = errors.target_sets ?? errors.rep_min ?? errors.rep_max;

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        {CAMPOS_NUMERICOS.map(({ nome, rotulo }) => (
          <div key={nome} className="flex flex-col gap-1">
            <Label htmlFor={`${prefixo}-${nome}`}>{rotulo}</Label>
            <Input
              id={`${prefixo}-${nome}`}
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              aria-invalid={Boolean(errors[nome])}
              {...register(nome)}
            />
          </div>
        ))}
      </div>
      {erroNumerico && <p className="text-sm text-destructive">{erroNumerico.message}</p>}

      <div className="flex flex-col gap-1">
        <Label htmlFor={`${prefixo}-technique`}>Técnica (opcional)</Label>
        <Textarea
          id={`${prefixo}-technique`}
          placeholder="Ex.: segurar 2 s na fase alongada"
          aria-invalid={Boolean(errors.technique)}
          {...register("technique")}
        />
        {errors.technique && <p className="text-sm text-destructive">{errors.technique.message}</p>}
      </div>

      {errors.root && (
        <p role="alert" className="text-sm text-destructive">
          {errors.root.message}
        </p>
      )}

      <div className={aoCancelar ? "grid grid-cols-2 gap-2" : "flex"}>
        {aoCancelar && (
          <Button type="button" variant="outline" onClick={aoCancelar}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting} className={aoCancelar ? undefined : "w-full"}>
          {isSubmitting ? "Salvando…" : textoDoBotao}
        </Button>
      </div>
    </form>
  );
}
