"use client";

import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buscarExercicios, encontrarPorNome, normalizarNome } from "@/domain/treino/catalogo";
import { formatarPrescricao, moverItem } from "@/domain/treino/ficha";
import {
  adicionarExercicioPrescrito,
  editarPrescricao,
  removerExercicioPrescrito,
  removerTreino,
  renomearTreino,
  reordenarExerciciosPrescritos,
} from "./acoes-ficha";
import { criarExercicio } from "./acoes-exercicios";
import { BotaoComConfirmacao } from "./botao-com-confirmacao";
import { BotoesDeOrdem } from "./botoes-de-ordem";
import type { Exercise, PlannedExercise, TreinoComPrescricao } from "./consultas";
import { FormularioDeNome } from "./formulario-de-nome";
import { FormularioDePrescricao } from "./formulario-de-prescricao";

const PRESCRICAO_PADRAO = { target_sets: 3, rep_min: 8, rep_max: 12, technique: "" };
const MAXIMO_DE_SUGESTOES = 6;

export function EditorDoTreino({ treino, catalogo }: { treino: TreinoComPrescricao; catalogo: Exercise[] }) {
  const somenteLeitura = Boolean(treino.ficha.archived_at);
  const [renomeando, setRenomeando] = useState(false);
  const [erro, setErro] = useState<string>();
  const [pendente, iniciar] = useTransition();

  const mover = (de: number, para: number) => {
    const ids = moverItem(treino.exercicios, de, para).map((p) => p.id);
    setErro(undefined);
    iniciar(async () => {
      const resultado = await reordenarExerciciosPrescritos(treino.id, ids);
      if (resultado) setErro(resultado.erro);
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        {renomeando ? (
          <FormularioDeNome
            tipo="treino"
            rotulo="Nome do treino"
            valorInicial={treino.name}
            textoDoBotao="Salvar"
            acao={(dados) => renomearTreino(treino.id, dados)}
            aoTerminar={() => setRenomeando(false)}
          />
        ) : (
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{treino.name}</h1>
            {!somenteLeitura && (
              <Button variant="ghost" size="icon" aria-label="Renomear treino" onClick={() => setRenomeando(true)}>
                <Pencil aria-hidden />
              </Button>
            )}
          </div>
        )}
        <p className="text-muted-foreground">
          {treino.exercicios.length === 1 ? "1 exercício" : `${treino.exercicios.length} exercícios`}, na ordem de
          execução.
        </p>
      </header>

      {erro && (
        <p role="alert" className="text-sm text-destructive">
          {erro}
        </p>
      )}

      {treino.exercicios.length === 0 ? (
        <p className="text-muted-foreground">Nenhum exercício ainda.</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {treino.exercicios.map((prescrito, indice) => (
            <CartaoPrescrito
              key={prescrito.id}
              prescrito={prescrito}
              indice={indice}
              total={treino.exercicios.length}
              somenteLeitura={somenteLeitura}
              ordenando={pendente}
              aoMover={mover}
            />
          ))}
        </ol>
      )}

      {!somenteLeitura && (
        <>
          <AdicionarExercicio treinoId={treino.id} catalogo={catalogo} />
          <section aria-label="Remover treino" className="border-t pt-6">
            <BotaoComConfirmacao
              variante="ghost"
              className="w-full text-destructive"
              textoDeConfirmacao="Remover treino"
              acao={() => removerTreino(treino.ficha.id, treino.id)}
            >
              <Trash2 aria-hidden />
              Remover este treino
            </BotaoComConfirmacao>
          </section>
        </>
      )}
    </div>
  );
}

function CartaoPrescrito({
  prescrito,
  indice,
  total,
  somenteLeitura,
  ordenando,
  aoMover,
}: {
  prescrito: PlannedExercise;
  indice: number;
  total: number;
  somenteLeitura: boolean;
  ordenando: boolean;
  aoMover: (de: number, para: number) => void;
}) {
  const [editando, setEditando] = useState(false);
  const nome = prescrito.exercise.name;

  return (
    <li className="flex flex-col gap-3 rounded-lg border bg-card p-4 text-card-foreground">
      <div className="flex items-start gap-3">
        <span className="pt-0.5 text-sm text-muted-foreground tabular-nums">{indice + 1}</span>
        <div className="flex flex-1 flex-col gap-1">
          <span className="font-medium">{nome}</span>
          <span className="text-lg font-semibold tabular-nums">{formatarPrescricao(prescrito)}</span>
          {prescrito.technique && <p className="text-sm text-muted-foreground">{prescrito.technique}</p>}
        </div>
      </div>

      {editando ? (
        <FormularioDePrescricao
          valoresIniciais={{
            target_sets: prescrito.target_sets,
            rep_min: prescrito.rep_min,
            rep_max: prescrito.rep_max,
            technique: prescrito.technique ?? "",
          }}
          textoDoBotao="Salvar"
          acao={(dados) => editarPrescricao(prescrito.id, dados)}
          aoCancelar={() => setEditando(false)}
          aoSalvar={() => setEditando(false)}
        />
      ) : (
        !somenteLeitura && (
          <div className="flex items-center justify-between border-t pt-2">
            <BotoesDeOrdem nome={nome} indice={indice} total={total} desabilitado={ordenando} aoMover={aoMover} />
            <div className="flex">
              <Button variant="ghost" size="icon" aria-label={`Editar ${nome}`} onClick={() => setEditando(true)}>
                <Pencil aria-hidden />
              </Button>
              <RemoverPrescrito id={prescrito.id} nome={nome} />
            </div>
          </div>
        )
      )}
    </li>
  );
}

function RemoverPrescrito({ id, nome }: { id: string; nome: string }) {
  const [confirmando, setConfirmando] = useState(false);
  const [pendente, iniciar] = useTransition();

  if (!confirmando) {
    return (
      <Button variant="ghost" size="icon" aria-label={`Remover ${nome}`} onClick={() => setConfirmando(true)}>
        <Trash2 aria-hidden />
      </Button>
    );
  }
  return (
    <div className="flex gap-1">
      <Button variant="ghost" size="icon" aria-label="Cancelar" onClick={() => setConfirmando(false)}>
        <X aria-hidden />
      </Button>
      <Button
        variant="destructive"
        disabled={pendente}
        onClick={() => iniciar(async () => void (await removerExercicioPrescrito(id)))}
      >
        Remover
      </Button>
    </div>
  );
}

function AdicionarExercicio({ treinoId, catalogo }: { treinoId: string; catalogo: Exercise[] }) {
  const [termo, setTermo] = useState("");
  const [escolhido, setEscolhido] = useState<Exercise>();
  const [erro, setErro] = useState<string>();
  const [criando, iniciar] = useTransition();

  const nomeNovo = normalizarNome(termo);
  const sugestoes = nomeNovo ? buscarExercicios(catalogo, termo).slice(0, MAXIMO_DE_SUGESTOES) : [];
  const podeCriar = nomeNovo !== "" && !encontrarPorNome(catalogo, termo);

  const criarEEscolher = () => {
    setErro(undefined);
    iniciar(async () => {
      const resultado = await criarExercicio({ name: nomeNovo });
      if ("erro" in resultado) {
        setErro(resultado.erro);
        return;
      }
      setEscolhido({ id: resultado.id, name: nomeNovo });
    });
  };

  const recomecar = () => {
    setEscolhido(undefined);
    setTermo("");
    setErro(undefined);
  };

  return (
    <section aria-labelledby="titulo-adicionar" className="flex flex-col gap-3 rounded-lg border border-dashed p-4">
      <h2 id="titulo-adicionar" className="text-lg font-semibold">
        Adicionar exercício
      </h2>

      {escolhido ? (
        <>
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">{escolhido.name}</span>
            <Button variant="ghost" onClick={recomecar}>
              Trocar
            </Button>
          </div>
          <FormularioDePrescricao
            valoresIniciais={PRESCRICAO_PADRAO}
            textoDoBotao="Adicionar ao treino"
            acao={(dados) => adicionarExercicioPrescrito(treinoId, escolhido.id, dados)}
            aoSalvar={recomecar}
          />
        </>
      ) : (
        <>
          <Label htmlFor="adicionar-busca" className="sr-only">
            Buscar ou criar exercício
          </Label>
          <Input
            id="adicionar-busca"
            type="search"
            autoComplete="off"
            placeholder="Buscar ou criar exercício"
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
                    onClick={() => setEscolhido(exercicio)}
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
        </>
      )}
    </section>
  );
}
