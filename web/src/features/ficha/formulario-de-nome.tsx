"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { nomeDaFichaSchema, nomeDoTreinoSchema, type Nome } from "./ficha-schema";
import type { ResultadoDaAcao } from "./resultado";

// Por nome, e não o schema em si: Server Components só passam dados serializáveis.
const SCHEMAS = { ficha: nomeDaFichaSchema, treino: nomeDoTreinoSchema } as const;

type Props = {
  tipo: keyof typeof SCHEMAS;
  rotulo: string;
  rotuloVisivel?: boolean;
  valorInicial?: string;
  placeholder?: string;
  textoDoBotao: string;
  acao: (dados: Nome) => Promise<ResultadoDaAcao>;
  /** Quando existe, mostra "Cancelar" e é chamado depois de salvar. */
  aoTerminar?: () => void;
};

/** Um campo de nome com validação: serve para criar e para renomear, sem modal. */
export function FormularioDeNome({
  tipo,
  rotulo,
  rotuloVisivel = true,
  valorInicial = "",
  placeholder,
  textoDoBotao,
  acao,
  aoTerminar,
}: Props) {
  const idDoCampo = useId();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Nome>({ resolver: zodResolver(SCHEMAS[tipo]), defaultValues: { name: valorInicial } });

  const enviar = handleSubmit(async (dados) => {
    const resultado = await acao(dados);
    if (resultado) {
      setError("name", { message: resultado.erro });
      return;
    }
    if (aoTerminar) aoTerminar();
    else reset();
  });

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-2">
      <Label htmlFor={idDoCampo} className={rotuloVisivel ? undefined : "sr-only"}>
        {rotulo}
      </Label>
      <Input
        id={idDoCampo}
        autoComplete="off"
        enterKeyHint="done"
        placeholder={placeholder}
        autoFocus={Boolean(aoTerminar)}
        aria-invalid={Boolean(errors.name)}
        aria-describedby={errors.name ? `${idDoCampo}-erro` : undefined}
        {...register("name")}
      />
      {errors.name && (
        <p id={`${idDoCampo}-erro`} className="text-sm text-destructive">
          {errors.name.message}
        </p>
      )}
      <div className={aoTerminar ? "grid grid-cols-2 gap-2" : "flex"}>
        {aoTerminar && (
          <Button type="button" variant="outline" onClick={aoTerminar}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting} className={aoTerminar ? undefined : "w-full"}>
          {isSubmitting ? "Salvando…" : textoDoBotao}
        </Button>
      </div>
    </form>
  );
}
