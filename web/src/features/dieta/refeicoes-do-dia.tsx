"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { refeicoesEmOrdem, totalPorRefeicao, type Meal } from "@/domain/dieta/registro";
import type { Data } from "@/domain/tempo/hoje";
import { editarGramas, registrarAlimento, removerRegistro } from "./acoes";
import { AdicionarAlimento } from "./adicionar-alimento";
import type { Alimento, RegistroDaRefeicao } from "./consultas";
import { EditorDeGramas } from "./editor-de-gramas";
import { formatarNumero } from "./formatar";

const ROTULO_DA_REFEICAO: Record<Meal, string> = {
  Breakfast: "Café da manhã",
  Lunch: "Almoço",
  Snack: "Lanche",
  Dinner: "Jantar",
  Supper: "Ceia",
};

type Props = {
  data: Data;
  registros: RegistroDaRefeicao[];
  alimentos: Alimento[];
  usos: Record<string, number>;
};

/** As refeições do dia, cada uma com seus alimentos, o total e o "+ Alimento". */
export function RefeicoesDoDia({ data, registros, alimentos, usos }: Props) {
  const mapaDeUsos = useMemo(() => new Map(Object.entries(usos)), [usos]);
  const totais = totalPorRefeicao(registros);
  // Um editor aberto por vez na tela: o id do registro, ou "+meal" para o "+ Alimento".
  const [aberto, setAberto] = useState<string | null>(null);
  const fechar = () => setAberto(null);

  return (
    <ol className="flex flex-col gap-4">
      {refeicoesEmOrdem.map((meal) => {
        const daRefeicao = registros.filter((r) => r.meal === meal);
        const rotulo = ROTULO_DA_REFEICAO[meal];
        return (
          <li key={meal} className="flex flex-col gap-3 rounded-lg border bg-card p-4 text-card-foreground">
            <header className="flex items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold leading-tight">{rotulo}</h2>
              <span className="text-sm text-muted-foreground tabular-nums">{totais[meal]} kcal</span>
            </header>

            {daRefeicao.length > 0 && (
              <ul className="flex flex-col gap-1" aria-label={`Alimentos de ${rotulo}`}>
                {daRefeicao.map((registro) =>
                  aberto === registro.id ? (
                    <li key={registro.id}>
                      <EditorDeGramas
                        alimento={registro.food}
                        gramas={registro.grams}
                        textoDoBotao="Salvar"
                        acao={(gramas) => editarGramas(registro.id, gramas)}
                        aoRemover={() => removerRegistro(registro.id)}
                        aoTerminar={fechar}
                      />
                    </li>
                  ) : (
                    <li key={registro.id}>
                      <button
                        type="button"
                        onClick={() => setAberto(registro.id)}
                        aria-label={`Editar ${registro.food.name}: ${formatarNumero(registro.grams)} g, ${registro.kcal} kcal`}
                        className="flex min-h-toque w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left hover:bg-accent"
                      >
                        <span className="flex flex-col">
                          <span className="leading-tight">{registro.food.name}</span>
                          <span className="text-sm text-muted-foreground tabular-nums">
                            {formatarNumero(registro.grams)} g
                          </span>
                        </span>
                        <span className="shrink-0 font-semibold tabular-nums">{registro.kcal} kcal</span>
                      </button>
                    </li>
                  ),
                )}
              </ul>
            )}

            {aberto === `+${meal}` ? (
              <AdicionarAlimento
                alimentos={alimentos}
                usos={mapaDeUsos}
                rotuloDaRefeicao={rotulo}
                registrar={(alimento, grams) => registrarAlimento({ date: data, meal, food_id: alimento.id, grams })}
                aoTerminar={fechar}
              />
            ) : (
              <Button variant="secondary" className="w-full" onClick={() => setAberto(`+${meal}`)}>
                <Plus aria-hidden />
                Alimento
              </Button>
            )}
          </li>
        );
      })}
    </ol>
  );
}
