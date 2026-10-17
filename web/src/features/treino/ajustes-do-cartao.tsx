"use client";

import { ArrowLeftRight, MessageSquare, SkipForward, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { podePular } from "@/domain/treino/sessao";
import type { Exercise } from "@/features/ficha/consultas";
import { EscolherExercicio } from "@/features/ficha/escolher-exercicio";
import {
  pularExercicio,
  removerDaSessao,
  salvarNotaDoExercicio,
  trocarExercicio,
  type AlvoDaSerie,
} from "./acoes-sessao";
import type { CartaoDaSessao } from "./consultas";
import { FormularioDeNota } from "./formulario-de-nota";

type Modo = "menu" | "pular" | "trocar" | "nota" | "remover";

type Props = {
  cartao: CartaoDaSessao;
  alvo: AlvoDaSerie;
  catalogo: Exercise[];
  aoFechar: () => void;
};

/** Pulei · Troquei por… · Nota · Remover (fora da ficha). Abre no próprio cartão, sem modal. */
export function AjustesDoCartao({ cartao, alvo, catalogo, aoFechar }: Props) {
  const [modo, setModo] = useState<Modo>("menu");
  const [erro, setErro] = useState<string>();
  const [pendente, iniciar] = useTransition();
  const { prescrito, registro, exercise } = cartao;

  const executar = (acao: () => Promise<{ erro: string } | undefined>) => {
    setErro(undefined);
    iniciar(async () => {
      const resultado = await acao();
      if (resultado) setErro(resultado.erro);
      else aoFechar();
    });
  };

  const conteudo = (() => {
    switch (modo) {
      case "pular":
        return (
          <FormularioDeNota
            rotulo="Por que pulou? (opcional)"
            placeholder="Ex.: aparelho ocupado"
            valorInicial={registro?.note}
            textoDoBotao="Marcar como pulado"
            acao={(dados) => pularExercicio(alvo, dados)}
            aoTerminar={aoFechar}
          />
        );
      case "trocar":
        return (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Troquei {exercise.name} por…</p>
            <EscolherExercicio
              catalogo={catalogo}
              ocultar={[exercise.id]}
              rotulo="Buscar ou criar exercício"
              aoEscolher={(novo) => executar(() => trocarExercicio(alvo, novo.id))}
            />
            <Button variant="ghost" onClick={aoFechar} disabled={pendente}>
              Cancelar
            </Button>
          </div>
        );
      case "nota":
        return (
          <FormularioDeNota
            rotulo={`Nota sobre ${exercise.name}`}
            placeholder="Ex.: pegada neutra"
            valorInicial={registro?.note}
            textoDoBotao="Salvar nota"
            acao={(dados) => salvarNotaDoExercicio(alvo, dados)}
            aoTerminar={aoFechar}
          />
        );
      case "remover":
        return (
          <div className="flex flex-col gap-2">
            <p className="text-sm">Remover {exercise.name} desta sessão, com as séries?</p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={aoFechar} disabled={pendente}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                disabled={pendente || !registro}
                onClick={() => registro && executar(() => removerDaSessao(registro.id))}
              >
                Remover
              </Button>
            </div>
          </div>
        );
      case "menu":
        return (
          <div className="grid grid-cols-1 gap-1">
            {prescrito && podePular(registro) && (
              <Button variant="ghost" className="justify-start" onClick={() => setModo("pular")}>
                <SkipForward aria-hidden />
                Pulei
              </Button>
            )}
            {prescrito && (
              <Button variant="ghost" className="justify-start" onClick={() => setModo("trocar")}>
                <ArrowLeftRight aria-hidden />
                Troquei por…
              </Button>
            )}
            <Button variant="ghost" className="justify-start" onClick={() => setModo("nota")}>
              <MessageSquare aria-hidden />
              {registro?.note ? "Editar nota" : "Nota"}
            </Button>
            {!prescrito && (
              <Button variant="ghost" className="justify-start text-destructive" onClick={() => setModo("remover")}>
                <Trash2 aria-hidden />
                Remover da sessão
              </Button>
            )}
          </div>
        );
    }
  })();

  return (
    <div className="flex flex-col gap-2 rounded-md bg-muted p-3">
      {conteudo}
      {erro && (
        <p role="alert" className="text-sm text-destructive">
          {erro}
        </p>
      )}
    </div>
  );
}
