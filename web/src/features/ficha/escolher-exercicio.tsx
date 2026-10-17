"use client";

import { Plus } from "lucide-react";
import { useId, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buscarExercicios, encontrarPorNome, normalizarNome } from "@/domain/treino/catalogo";
import { criarExercicio } from "./acoes-exercicios";
import type { Exercise } from "./consultas";

const MAXIMO_DE_SUGESTOES = 6;

type Props = {
  catalogo: Exercise[];
  aoEscolher: (exercicio: Exercise) => void;
  rotulo?: string;
  /** Exercícios que não fazem sentido aqui (ex.: o próprio prescrito, na troca). */
  ocultar?: string[];
};

/** Busca no catálogo, ou cria o exercício na hora se ele não existir. */
export function EscolherExercicio({ catalogo, aoEscolher, rotulo = "Buscar ou criar exercício", ocultar = [] }: Props) {
  const idDoCampo = useId();
  const [termo, setTermo] = useState("");
  const [erro, setErro] = useState<string>();
  const [criando, iniciar] = useTransition();

  const nomeNovo = normalizarNome(termo);
  const sugestoes = nomeNovo
    ? buscarExercicios(catalogo, termo)
        .filter((e) => !ocultar.includes(e.id))
        .slice(0, MAXIMO_DE_SUGESTOES)
    : [];
  const podeCriar = nomeNovo !== "" && !encontrarPorNome(catalogo, termo);

  const criarEEscolher = () => {
    setErro(undefined);
    iniciar(async () => {
      const resultado = await criarExercicio({ name: nomeNovo });
      if ("erro" in resultado) {
        setErro(resultado.erro);
        return;
      }
      setTermo("");
      aoEscolher({ id: resultado.id, name: nomeNovo });
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={idDoCampo} className="sr-only">
        {rotulo}
      </Label>
      <Input
        id={idDoCampo}
        type="search"
        autoComplete="off"
        placeholder={rotulo}
        value={termo}
        onChange={(evento) => setTermo(evento.target.value)}
      />
      {(sugestoes.length > 0 || podeCriar) && (
        <ul className="flex flex-col divide-y rounded-lg border bg-card">
          {sugestoes.map((exercicio) => (
            <li key={exercicio.id}>
              <button
                type="button"
                className="flex min-h-toque w-full items-center px-4 text-left hover:bg-accent"
                onClick={() => {
                  setTermo("");
                  aoEscolher(exercicio);
                }}
              >
                {exercicio.name}
              </button>
            </li>
          ))}
          {podeCriar && (
            <li>
              <button
                type="button"
                disabled={criando}
                className="flex min-h-toque w-full items-center gap-2 px-4 text-left font-medium text-primary hover:bg-accent"
                onClick={criarEEscolher}
              >
                <Plus aria-hidden className="size-4 shrink-0" />
                <span className="truncate">Criar “{nomeNovo}” no catálogo</span>
              </button>
            </li>
          )}
        </ul>
      )}
      {erro && (
        <p role="alert" className="text-sm text-destructive">
          {erro}
        </p>
      )}
    </div>
  );
}
