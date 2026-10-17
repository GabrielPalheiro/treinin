"use client";

import { Ellipsis, Plus, Undo2 } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { Data } from "@/domain/tempo/hoje";
import { formatarPrescricao } from "@/domain/treino/ficha";
import {
  foiSubstituido,
  formatarCarga,
  formatarSeries,
  haQuantoTempo,
  preencherSerie,
  situacaoDoExercicio,
} from "@/domain/treino/sessao";
import type { Exercise } from "@/features/ficha/consultas";
import { desfazerPulo, editarSerie, registrarSerie, removerSerie, voltarAoPrescrito } from "./acoes-sessao";
import { AjustesDoCartao } from "./ajustes-do-cartao";
import type { CartaoDaSessao } from "./consultas";
import { EditorDeSerie } from "./editor-de-serie";

type Props = { cartao: CartaoDaSessao; sessaoId: string; hoje: Data; catalogo: Exercise[] };

export function CartaoDoExercicio({ cartao, sessaoId, hoje, catalogo }: Props) {
  const { exercise, prescrito, registro, ultimaVez } = cartao;
  const series = registro?.series ?? [];
  const situacao = situacaoDoExercicio(registro);
  const trocado = prescrito !== null && foiSubstituido(prescrito.exercise.id, exercise.id);

  const [editando, setEditando] = useState<string | "nova" | null>(null);
  const [ajustando, setAjustando] = useState(false);
  const [erro, setErro] = useState<string>();
  const [pendente, iniciar] = useTransition();

  const alvo = {
    sessaoId,
    exerciseId: exercise.id,
    plannedExerciseId: prescrito?.id ?? null,
    registroId: registro?.id ?? null,
  };

  const executar = (acao: () => Promise<{ erro: string } | undefined>) => {
    setErro(undefined);
    iniciar(async () => {
      const resultado = await acao();
      if (resultado) setErro(resultado.erro);
    });
  };

  // Um toque: com valor sugerido, a série já é registrada; sem sugestão, abre os campos vazios.
  const adicionarSerie = () => {
    const sugestao = preencherSerie(ultimaVez?.series ?? null, series);
    if (!sugestao) setEditando("nova");
    else executar(() => registrarSerie(alvo, sugestao));
  };

  return (
    <li
      className={
        situacao === "Pulado"
          ? "flex flex-col gap-3 rounded-lg border border-dashed p-4 text-muted-foreground"
          : "flex flex-col gap-3 rounded-lg border bg-card p-4 text-card-foreground"
      }
    >
      <header className="flex items-start gap-2">
        <div className="flex flex-1 flex-col gap-1">
          <h2 className="text-lg font-semibold leading-tight">{exercise.name}</h2>
          {trocado && (
            <p className="text-sm text-muted-foreground">
              No lugar de <span className="font-medium">{prescrito.exercise.name}</span>
            </p>
          )}
          {!prescrito && <p className="text-sm text-muted-foreground">Fora da ficha</p>}
          {prescrito && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground tabular-nums">{formatarPrescricao(prescrito)}</span>
              {situacao !== "Pulado" &&
                ` · ${series.length} de ${prescrito.target_sets} ${prescrito.target_sets === 1 ? "série" : "séries"}`}
            </p>
          )}
          {prescrito?.technique && situacao !== "Pulado" && (
            <p className="text-sm text-muted-foreground">{prescrito.technique}</p>
          )}
        </div>
        {situacao !== "Pulado" && (
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Mais opções de ${exercise.name}`}
            aria-expanded={ajustando}
            onClick={() => setAjustando((aberto) => !aberto)}
          >
            <Ellipsis aria-hidden />
          </Button>
        )}
      </header>

      {ajustando && (
        <AjustesDoCartao cartao={cartao} alvo={alvo} catalogo={catalogo} aoFechar={() => setAjustando(false)} />
      )}

      {situacao === "Pulado" ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm">
            <span className="font-medium text-foreground">Pulado</span>
            {registro?.note && ` · ${registro.note}`}
          </p>
          <Button
            variant="outline"
            disabled={pendente}
            onClick={() => registro && executar(() => desfazerPulo(registro.id))}
          >
            <Undo2 aria-hidden />
            Desfazer
          </Button>
        </div>
      ) : (
        <>
          {trocado && (
            <Button
              variant="ghost"
              className="self-start"
              disabled={pendente}
              onClick={() => registro && executar(() => voltarAoPrescrito(registro.id, prescrito.exercise.id))}
            >
              <Undo2 aria-hidden />
              Voltar para {prescrito.exercise.name}
            </Button>
          )}

          <p className="rounded-md bg-muted px-3 py-2 text-sm">
            {ultimaVez ? (
              <>
                <span className="text-muted-foreground">Última vez · {haQuantoTempo(ultimaVez.date, hoje)}</span>
                <br />
                <span className="font-medium tabular-nums">{formatarSeries(ultimaVez.series)}</span>
              </>
            ) : (
              <span className="text-muted-foreground">Primeira vez</span>
            )}
          </p>

          {registro?.note && <p className="text-sm text-muted-foreground">Nota: {registro.note}</p>}

          {series.length > 0 && (
            <ol className="flex flex-col gap-1" aria-label={`Séries de ${exercise.name}`}>
              {series.map((serie, indice) =>
                editando === serie.id ? (
                  <li key={serie.id}>
                    <EditorDeSerie
                      valores={serie}
                      textoDoBotao="Salvar"
                      acao={(dados) => editarSerie(serie.id, dados)}
                      aoRemover={() => removerSerie(serie.id)}
                      aoTerminar={() => setEditando(null)}
                    />
                  </li>
                ) : (
                  <li key={serie.id}>
                    <button
                      type="button"
                      onClick={() => setEditando(serie.id)}
                      aria-label={`Editar série ${indice + 1}: ${formatarCarga(serie.load, serie.load_unit)} × ${serie.reps}`}
                      className="flex min-h-toque w-full items-center gap-3 rounded-md px-3 text-left hover:bg-accent"
                    >
                      <span className="w-5 text-sm text-muted-foreground tabular-nums">{indice + 1}</span>
                      <span className="text-lg font-semibold tabular-nums">
                        {formatarCarga(serie.load, serie.load_unit)} × {serie.reps}
                      </span>
                    </button>
                  </li>
                ),
              )}
            </ol>
          )}

          {editando === "nova" ? (
            <EditorDeSerie
              valores={null}
              unidadePadrao={series.at(-1)?.load_unit ?? ultimaVez?.series.at(-1)?.load_unit}
              textoDoBotao="Registrar"
              acao={(dados) => registrarSerie(alvo, dados)}
              aoTerminar={() => setEditando(null)}
            />
          ) : (
            <Button variant="secondary" className="w-full" disabled={pendente} onClick={adicionarSerie}>
              <Plus aria-hidden />
              {pendente ? "Registrando…" : "Série"}
            </Button>
          )}
        </>
      )}

      {erro && (
        <p role="alert" className="text-sm text-destructive">
          {erro}
        </p>
      )}
    </li>
  );
}
