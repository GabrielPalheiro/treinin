"use client";

import { useState, useTransition } from "react";
import type { Exercise } from "@/features/ficha/consultas";
import { EscolherExercicio } from "@/features/ficha/escolher-exercicio";
import { adicionarForaDaFicha } from "./acoes-sessao";

/** Exercício que não está na ficha: entra no fim da sessão. */
export function AdicionarForaDaFicha({ sessaoId, catalogo }: { sessaoId: string; catalogo: Exercise[] }) {
  const [erro, setErro] = useState<string>();
  const [pendente, iniciar] = useTransition();

  return (
    <section
      aria-labelledby="titulo-fora-da-ficha"
      className="flex flex-col gap-2 rounded-lg border border-dashed p-4"
      aria-busy={pendente}
    >
      <h2 id="titulo-fora-da-ficha" className="font-semibold">
        Exercício fora da ficha
      </h2>
      <EscolherExercicio
        catalogo={catalogo}
        aoEscolher={(exercicio) =>
          iniciar(async () => {
            setErro(undefined);
            const resultado = await adicionarForaDaFicha(sessaoId, exercicio.id);
            if (resultado) setErro(resultado.erro);
          })
        }
      />
      {erro && (
        <p role="alert" className="text-sm text-destructive">
          {erro}
        </p>
      )}
    </section>
  );
}
