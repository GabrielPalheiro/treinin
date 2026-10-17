"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  nome: string;
  indice: number;
  total: number;
  desabilitado: boolean;
  aoMover: (de: number, para: number) => void;
};

/** ↑ e ↓ com alvo de 48 px. Arrastar e soltar fica para depois, se fizer falta. */
export function BotoesDeOrdem({ nome, indice, total, desabilitado, aoMover }: Props) {
  return (
    <div className="flex shrink-0">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Subir ${nome}`}
        disabled={desabilitado || indice === 0}
        onClick={() => aoMover(indice, indice - 1)}
      >
        <ArrowUp aria-hidden />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Descer ${nome}`}
        disabled={desabilitado || indice === total - 1}
        onClick={() => aoMover(indice, indice + 1)}
      >
        <ArrowDown aria-hidden />
      </Button>
    </div>
  );
}
