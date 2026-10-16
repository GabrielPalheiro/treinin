"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buscarExercicios, encontrarPorNome, normalizarNome } from "@/domain/treino/catalogo";
import { criarExercicio, renomearExercicio } from "./acoes-exercicios";
import type { Exercise } from "./consultas";
import { nomeDoExercicioSchema, type NomeDoExercicio } from "./exercicio-schema";

export function CatalogoDeExercicios({ exercicios }: { exercicios: Exercise[] }) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<NomeDoExercicio>({
    resolver: zodResolver(nomeDoExercicioSchema),
    defaultValues: { name: "" },
  });

  const termo = useWatch({ control, name: "name" });
  const resultados = buscarExercicios(exercicios, termo);
  const nomeNovo = normalizarNome(termo);
  const podeCriar = nomeNovo !== "" && !encontrarPorNome(exercicios, termo);

  const criar = handleSubmit(async (dados) => {
    if (!podeCriar) return;
    const resultado = await criarExercicio(dados);
    if ("erro" in resultado) {
      setError("name", { message: resultado.erro });
      return;
    }
    reset();
  });

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={criar} noValidate className="flex flex-col gap-3">
        <Label htmlFor="busca-exercicio">Buscar ou criar exercício</Label>
        <Input
          id="busca-exercicio"
          type="search"
          autoComplete="off"
          enterKeyHint="done"
          placeholder="Ex.: Supino reto máquina"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "busca-exercicio-erro" : undefined}
          {...register("name")}
        />
        {errors.name && (
          <p id="busca-exercicio-erro" className="text-sm text-destructive">
            {errors.name.message}
          </p>
        )}
        {podeCriar && (
          <Button type="submit" disabled={isSubmitting} className="w-full justify-start">
            <Plus aria-hidden />
            <span className="truncate">Adicionar “{nomeNovo}”</span>
          </Button>
        )}
      </form>

      <section aria-labelledby="titulo-lista" className="flex flex-col gap-2">
        <h2 id="titulo-lista" className="text-sm font-medium text-muted-foreground">
          {exercicios.length === 1 ? "1 exercício" : `${exercicios.length} exercícios`}
        </h2>
        {exercicios.length === 0 ? (
          <p className="text-muted-foreground">
            Nenhum exercício ainda. Digite o nome acima para criar o primeiro.
          </p>
        ) : resultados.length === 0 ? (
          <p className="text-muted-foreground">Nenhum exercício com “{termo.trim()}”.</p>
        ) : (
          <ul className="flex flex-col divide-y rounded-lg border bg-card">
            {resultados.map((exercicio) => (
              <ItemDoCatalogo key={exercicio.id} exercicio={exercicio} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ItemDoCatalogo({ exercicio }: { exercicio: Exercise }) {
  const [editando, setEditando] = useState(false);

  if (!editando) {
    return (
      <li className="flex min-h-toque items-center justify-between gap-2 pl-4">
        <span className="py-3">{exercicio.name}</span>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Renomear ${exercicio.name}`}
          onClick={() => setEditando(true)}
        >
          <Pencil aria-hidden />
        </Button>
      </li>
    );
  }

  return (
    <li className="p-3">
      <FormularioRenomear exercicio={exercicio} aoTerminar={() => setEditando(false)} />
    </li>
  );
}

function FormularioRenomear({
  exercicio,
  aoTerminar,
}: {
  exercicio: Exercise;
  aoTerminar: () => void;
}) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<NomeDoExercicio>({
    resolver: zodResolver(nomeDoExercicioSchema),
    defaultValues: { name: exercicio.name },
  });

  const salvar = handleSubmit(async (dados) => {
    const resultado = await renomearExercicio({ id: exercicio.id, name: dados.name });
    if (resultado) {
      setError("name", { message: resultado.erro });
      return;
    }
    aoTerminar();
  });

  const idDoCampo = `renomear-${exercicio.id}`;

  return (
    <form onSubmit={salvar} noValidate className="flex flex-col gap-2">
      <Label htmlFor={idDoCampo} className="sr-only">
        Novo nome de {exercicio.name}
      </Label>
      <Input
        id={idDoCampo}
        autoFocus
        autoComplete="off"
        enterKeyHint="done"
        aria-invalid={Boolean(errors.name)}
        aria-describedby={errors.name ? `${idDoCampo}-erro` : undefined}
        {...register("name")}
      />
      {errors.name && (
        <p id={`${idDoCampo}-erro`} className="text-sm text-destructive">
          {errors.name.message}
        </p>
      )}
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" onClick={aoTerminar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </form>
  );
}
