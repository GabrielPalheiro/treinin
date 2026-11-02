"use client";

import { useId, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Meal } from "@/domain/dieta/registro";
import { somarDias } from "@/domain/tempo/calendario";
import type { Data } from "@/domain/tempo/hoje";
import { copiarRefeicao } from "./acoes";

type Props = { data: Data; meal: Meal; rotuloDaRefeicao: string; aoTerminar: () => void };

/** "Copiar de…" dentro da refeição: sugere o dia anterior; depois é só ajustar os gramas. */
export function CopiarRefeicao({ data, meal, rotuloDaRefeicao, aoTerminar }: Props) {
  const idDoCampo = useId();
  const [origem, setOrigem] = useState(somarDias(data, -1));
  const [erro, setErro] = useState<string>();
  const [copiando, iniciar] = useTransition();

  const copiar = () => {
    setErro(undefined);
    iniciar(async () => {
      const resultado = await copiarRefeicao({ origem, destino: data, meal });
      if (resultado) setErro(resultado.erro);
      else aoTerminar();
    });
  };

  return (
    <div className="flex flex-col gap-3 rounded-md bg-muted p-3">
      <div className="flex flex-col gap-1">
        <Label htmlFor={idDoCampo}>Copiar {rotuloDaRefeicao.toLowerCase()} de</Label>
        <Input
          id={idDoCampo}
          type="date"
          className="bg-background"
          value={origem}
          onChange={(evento) => setOrigem(evento.target.value)}
          aria-invalid={Boolean(erro)}
          aria-describedby={erro ? `${idDoCampo}-erro` : undefined}
        />
      </div>
      {erro && (
        <p id={`${idDoCampo}-erro`} role="alert" className="text-sm text-destructive">
          {erro}
        </p>
      )}
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" onClick={aoTerminar}>
          Cancelar
        </Button>
        <Button type="button" disabled={copiando} onClick={copiar}>
          {copiando ? "Copiando…" : "Copiar"}
        </Button>
      </div>
    </div>
  );
}
