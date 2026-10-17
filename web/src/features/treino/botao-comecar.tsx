"use client";

import { Play } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { comecarSessao } from "./acoes-sessao";

type Props = { treinoId: string; children: React.ReactNode; variante?: "default" | "outline" };

export function BotaoComecar({ treinoId, children, variante = "default" }: Props) {
  const [erro, setErro] = useState<string>();
  const [pendente, iniciar] = useTransition();

  return (
    <div className="flex flex-col gap-1">
      <Button
        size="lg"
        variant={variante}
        className="w-full"
        disabled={pendente}
        onClick={() =>
          iniciar(async () => {
            const resultado = await comecarSessao(treinoId);
            if (resultado) setErro(resultado.erro);
          })
        }
      >
        {variante === "default" && <Play aria-hidden />}
        {pendente ? "Abrindo…" : children}
      </Button>
      {erro && (
        <p role="alert" className="text-sm text-destructive">
          {erro}
        </p>
      )}
    </div>
  );
}
