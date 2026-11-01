"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buscarAlimentos } from "@/domain/dieta/alimentos";
import type { ResultadoDaAcao } from "@/lib/resultado-da-acao";
import type { Alimento } from "./consultas";
import { EditorDeGramas } from "./editor-de-gramas";
import { formatarNumero } from "./formatar";

const MAXIMO_DE_SUGESTOES = 8;

type Props = {
  alimentos: Alimento[];
  usos: ReadonlyMap<string, number>;
  rotuloDaRefeicao: string;
  registrar: (alimento: Alimento, gramas: number) => Promise<ResultadoDaAcao>;
  aoTerminar: () => void;
};

/** "+ Alimento" dentro da refeição: busca, escolhe e informa os gramas, sem sair da tela. */
export function AdicionarAlimento({ alimentos, usos, rotuloDaRefeicao, registrar, aoTerminar }: Props) {
  const idDoCampo = useId();
  const [termo, setTermo] = useState("");
  const [escolhido, setEscolhido] = useState<Alimento | null>(null);

  if (escolhido) {
    return (
      <EditorDeGramas
        alimento={escolhido}
        gramas={null}
        textoDoBotao="Registrar"
        acao={(gramas) => registrar(escolhido, gramas)}
        aoTerminar={aoTerminar}
      />
    );
  }

  // Sem termo, só os mais usados: o alimento de sempre fica a um toque.
  const sugestoes = buscarAlimentos(alimentos, termo, usos)
    .filter((a) => termo.trim() !== "" || usos.has(a.id))
    .slice(0, MAXIMO_DE_SUGESTOES);

  return (
    <div className="flex flex-col gap-2 rounded-md bg-muted p-3">
      <Label htmlFor={idDoCampo} className="sr-only">
        Buscar alimento para {rotuloDaRefeicao}
      </Label>
      <Input
        id={idDoCampo}
        type="search"
        autoComplete="off"
        autoFocus
        placeholder="Buscar alimento"
        className="bg-background"
        value={termo}
        onChange={(evento) => setTermo(evento.target.value)}
      />
      {sugestoes.length > 0 ? (
        <ul className="flex flex-col divide-y rounded-lg border bg-card" aria-label="Alimentos encontrados">
          {sugestoes.map((alimento) => (
            <li key={alimento.id}>
              <button
                type="button"
                className="flex min-h-toque w-full items-center justify-between gap-3 px-4 py-2 text-left hover:bg-accent"
                onClick={() => setEscolhido(alimento)}
              >
                <span>{alimento.name}</span>
                <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
                  {formatarNumero(alimento.kcal_per_100g)} kcal/100 g
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        termo.trim() !== "" && <p className="px-1 text-sm text-muted-foreground">Nenhum alimento encontrado.</p>
      )}
      <Button type="button" variant="ghost" onClick={aoTerminar}>
        Cancelar
      </Button>
    </div>
  );
}
