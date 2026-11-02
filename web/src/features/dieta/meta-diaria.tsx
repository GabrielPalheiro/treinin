"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Target } from "lucide-react";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { definirMeta } from "./acoes";
import { metaDoFormularioSchema, type Meta, type MetaDoFormulario } from "./meta-schema";
import { ProgressoDaMeta } from "./progresso-da-meta";

type Props = { consumido: number; meta: number | null };

/** Na Dieta: o progresso do dia contra a meta, ou o convite para definir. Ajusta no lugar, sem modal. */
export function MetaDiaria({ consumido, meta }: Props) {
  const [editando, setEditando] = useState(false);

  if (editando) return <FormularioDeMeta meta={meta} aoTerminar={() => setEditando(false)} />;

  if (meta === null) {
    return (
      <Button variant="outline" className="self-center" onClick={() => setEditando(true)}>
        <Target aria-hidden />
        Definir meta diária
      </Button>
    );
  }

  return (
    <button
      type="button"
      className="flex min-h-toque w-full items-center rounded-md px-1 text-left hover:bg-accent"
      onClick={() => setEditando(true)}
      aria-label={`Ajustar meta diária de ${meta} kcal`}
    >
      <ProgressoDaMeta consumido={consumido} meta={meta} />
    </button>
  );
}

function FormularioDeMeta({ meta, aoTerminar }: { meta: number | null; aoTerminar: () => void }) {
  const prefixo = useId();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<MetaDoFormulario, unknown, Meta>({
    resolver: zodResolver(metaDoFormularioSchema),
    defaultValues: { kcal: meta === null ? "" : String(meta) },
  });

  const salvar = handleSubmit(async (dados) => {
    const resultado = await definirMeta(dados.kcal);
    if (resultado) setError("root", { message: resultado.erro });
    else aoTerminar();
  });

  return (
    <form onSubmit={salvar} noValidate className="flex flex-col gap-3 rounded-md bg-muted p-3">
      <div className="flex flex-col gap-1">
        <Label htmlFor={`${prefixo}-kcal`}>Meta diária (kcal)</Label>
        <Input
          id={`${prefixo}-kcal`}
          inputMode="numeric"
          autoComplete="off"
          autoFocus
          placeholder="2100"
          className="bg-background"
          aria-invalid={Boolean(errors.kcal)}
          aria-describedby={errors.kcal ? `${prefixo}-kcal-erro` : undefined}
          {...register("kcal")}
        />
      </div>
      {errors.kcal && (
        <p id={`${prefixo}-kcal-erro`} className="text-sm text-destructive">
          {errors.kcal.message}
        </p>
      )}
      {errors.root && (
        <p role="alert" className="text-sm text-destructive">
          {errors.root.message}
        </p>
      )}
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" onClick={aoTerminar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando…" : "Salvar meta"}
        </Button>
      </div>
    </form>
  );
}
