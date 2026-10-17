"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { ResultadoDaAcao } from "./resultado";

type Props = {
  children: ReactNode;
  textoDeConfirmacao: string;
  acao: () => Promise<ResultadoDaAcao>;
  variante?: "outline" | "ghost" | "destructive";
  className?: string;
};

/** Ação definitiva em dois toques, sem modal: o primeiro pede confirmação no próprio lugar. */
export function BotaoComConfirmacao({
  children,
  textoDeConfirmacao,
  acao,
  variante = "outline",
  className,
}: Props) {
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState<string>();
  const [pendente, iniciar] = useTransition();

  if (!confirmando) {
    return (
      <Button type="button" variant={variante} className={className} onClick={() => setConfirmando(true)}>
        {children}
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" disabled={pendente} onClick={() => setConfirmando(false)}>
          Cancelar
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={pendente}
          onClick={() =>
            iniciar(async () => {
              const resultado = await acao();
              if (resultado) setErro(resultado.erro);
            })
          }
        >
          {pendente ? "Aguarde…" : textoDeConfirmacao}
        </Button>
      </div>
      {erro && (
        <p role="alert" className="text-sm text-destructive">
          {erro}
        </p>
      )}
    </div>
  );
}
