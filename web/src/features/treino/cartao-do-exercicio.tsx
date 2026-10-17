"use client";

import { Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { Data } from "@/domain/tempo/hoje";
import { formatarPrescricao } from "@/domain/treino/ficha";
import { formatarCarga, formatarSeries, haQuantoTempo, preencherSerie } from "@/domain/treino/sessao";
import { editarSerie, registrarSerie, removerSerie } from "./acoes-sessao";
import type { CartaoDaSessao } from "./consultas";
import { EditorDeSerie } from "./editor-de-serie";

type Props = { cartao: CartaoDaSessao; sessaoId: string; hoje: Data };

export function CartaoDoExercicio({ cartao, sessaoId, hoje }: Props) {
  const { exercise, prescrito, registro, ultimaVez } = cartao;
  const series = registro?.series ?? [];
  const [editando, setEditando] = useState<string | "nova" | null>(null);
  const [erro, setErro] = useState<string>();
  const [registrando, iniciar] = useTransition();

  const alvo = {
    sessaoId,
    exerciseId: exercise.id,
    plannedExerciseId: prescrito?.id ?? null,
    registroId: registro?.id ?? null,
  };

  // Um toque: com valor sugerido, a série já é registrada; sem sugestão, abre os campos vazios.
  const adicionarSerie = () => {
    setErro(undefined);
    const sugestao = preencherSerie(ultimaVez?.series ?? null, series);
    if (!sugestao) {
      setEditando("nova");
      return;
    }
    iniciar(async () => {
      const resultado = await registrarSerie(alvo, sugestao);
      if (resultado) setErro(resultado.erro);
    });
  };

  return (
    <li className="flex flex-col gap-3 rounded-lg border bg-card p-4 text-card-foreground">
      <header className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold leading-tight">{exercise.name}</h2>
        {prescrito && (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground tabular-nums">{formatarPrescricao(prescrito)}</span>
            {" · "}
            {series.length} de {prescrito.target_sets} {prescrito.target_sets === 1 ? "série" : "séries"}
          </p>
        )}
        {prescrito?.technique && <p className="text-sm text-muted-foreground">{prescrito.technique}</p>}
      </header>

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
        <Button variant="secondary" className="w-full" disabled={registrando} onClick={adicionarSerie}>
          <Plus aria-hidden />
          {registrando ? "Registrando…" : "Série"}
        </Button>
      )}

      {erro && (
        <p role="alert" className="text-sm text-destructive">
          {erro}
        </p>
      )}
    </li>
  );
}
