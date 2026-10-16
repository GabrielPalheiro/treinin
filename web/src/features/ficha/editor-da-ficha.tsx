"use client";

import { ChevronRight, Pencil } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { moverItem } from "@/domain/treino/ficha";
import { arquivarFicha, ativarFicha, criarTreino, reordenarTreinos, renomearFicha } from "./acoes-ficha";
import { BotaoComConfirmacao } from "./botao-com-confirmacao";
import { BotoesDeOrdem } from "./botoes-de-ordem";
import type { FichaComTreinos } from "./consultas";
import { EstadoDaFicha } from "./estado-da-ficha";
import { FormularioDeNome } from "./formulario-de-nome";

export function EditorDaFicha({ ficha }: { ficha: FichaComTreinos }) {
  const arquivada = Boolean(ficha.archived_at);
  const [renomeando, setRenomeando] = useState(false);
  const [erro, setErro] = useState<string>();
  const [pendente, iniciar] = useTransition();

  function executar(acao: () => Promise<{ erro: string } | undefined>) {
    setErro(undefined);
    iniciar(async () => {
      const resultado = await acao();
      if (resultado) setErro(resultado.erro);
    });
  }

  const mover = (de: number, para: number) => {
    const ids = moverItem(ficha.treinos, de, para).map((t) => t.id);
    executar(() => reordenarTreinos(ficha.id, ids));
  };

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        {renomeando ? (
          <FormularioDeNome
            tipo="ficha"
            rotulo="Nome da ficha"
            valorInicial={ficha.name}
            textoDoBotao="Salvar"
            acao={(dados) => renomearFicha(ficha.id, dados)}
            aoTerminar={() => setRenomeando(false)}
          />
        ) : (
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{ficha.name}</h1>
            {!arquivada && (
              <Button variant="ghost" size="icon" aria-label="Renomear ficha" onClick={() => setRenomeando(true)}>
                <Pencil aria-hidden />
              </Button>
            )}
          </div>
        )}
        <EstadoDaFicha ficha={ficha} />

        {arquivada ? (
          <p className="text-muted-foreground">Ficha arquivada: só leitura.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {!ficha.active && (
              <Button disabled={pendente} onClick={() => executar(() => ativarFicha(ficha.id))}>
                Ativar esta ficha
              </Button>
            )}
            <BotaoComConfirmacao textoDeConfirmacao="Arquivar" acao={() => arquivarFicha(ficha.id)}>
              Arquivar ficha
            </BotaoComConfirmacao>
          </div>
        )}
        {erro && (
          <p role="alert" className="text-sm text-destructive">
            {erro}
          </p>
        )}
      </header>

      <section aria-labelledby="titulo-treinos" className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="titulo-treinos" className="text-xl font-semibold">
            Treinos
          </h2>
          <p className="text-sm text-muted-foreground">A ordem é a rotação: depois do último, volta ao primeiro.</p>
        </div>

        {ficha.treinos.length === 0 ? (
          <p className="text-muted-foreground">Nenhum treino ainda.</p>
        ) : (
          <ol className="flex flex-col divide-y rounded-lg border bg-card">
            {ficha.treinos.map((treino, indice) => (
              <li key={treino.id} className="flex items-center gap-1 pr-1">
                <Link
                  href={`/ficha/${ficha.id}/treinos/${treino.id}`}
                  className="flex min-h-toque flex-1 items-center gap-3 py-3 pl-4"
                >
                  <span className="w-5 text-sm text-muted-foreground tabular-nums">{indice + 1}</span>
                  <span className="flex flex-col">
                    <span className="font-medium">{treino.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {treino.quantidadeDeExercicios === 1
                        ? "1 exercício"
                        : `${treino.quantidadeDeExercicios} exercícios`}
                    </span>
                  </span>
                  <ChevronRight aria-hidden className="ml-auto size-5 text-muted-foreground" />
                </Link>
                {!arquivada && (
                  <BotoesDeOrdem
                    nome={treino.name}
                    indice={indice}
                    total={ficha.treinos.length}
                    desabilitado={pendente}
                    aoMover={mover}
                  />
                )}
              </li>
            ))}
          </ol>
        )}

        {!arquivada && (
          <FormularioDeNome
            tipo="treino"
            rotulo="Novo treino"
            placeholder="Ex.: Lower A"
            textoDoBotao="Adicionar treino"
            acao={(dados) => criarTreino(ficha.id, dados)}
          />
        )}
      </section>
    </div>
  );
}
