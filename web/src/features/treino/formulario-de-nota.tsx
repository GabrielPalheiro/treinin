"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ResultadoDaAcao } from "@/lib/resultado-da-acao";
import { notaDoExercicioSchema, type NotaDoExercicio } from "./serie-schema";

type Props = {
  rotulo: string;
  placeholder?: string;
  valorInicial?: string | null;
  textoDoBotao: string;
  acao: (dados: { note: string | null }) => Promise<ResultadoDaAcao>;
  aoTerminar: () => void;
};

export function FormularioDeNota({ rotulo, placeholder, valorInicial, textoDoBotao, acao, aoTerminar }: Props) {
  const idDoCampo = useId();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<NotaDoExercicio, unknown, { note: string | null }>({
    resolver: zodResolver(notaDoExercicioSchema),
    defaultValues: { note: valorInicial ?? "" },
  });

  const salvar = handleSubmit(async (dados) => {
    const resultado = await acao(dados);
    if (resultado) setError("root", { message: resultado.erro });
    else aoTerminar();
  });

  return (
    <form onSubmit={salvar} noValidate className="flex flex-col gap-2">
      <Label htmlFor={idDoCampo}>{rotulo}</Label>
      <Textarea id={idDoCampo} placeholder={placeholder} className="bg-background" {...register("note")} />
      {(errors.note ?? errors.root) && (
        <p role="alert" className="text-sm text-destructive">
          {errors.note?.message ?? errors.root?.message}
        </p>
      )}
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" onClick={aoTerminar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando…" : textoDoBotao}
        </Button>
      </div>
    </form>
  );
}
