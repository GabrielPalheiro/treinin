export const LIMITES_DA_PRESCRICAO = {
  seriesMin: 1,
  seriesMax: 10,
  repsMin: 1,
  repsMax: 100,
  tecnicaMax: 500,
} as const;

/** Nova ordem com o item de `de` levado para `para`. Índices fora da lista não mudam nada. */
export function moverItem<T>(lista: readonly T[], de: number, para: number): T[] {
  const copia = [...lista];
  if (de < 0 || de >= copia.length || para < 0 || para >= copia.length) return copia;
  const [item] = copia.splice(de, 1);
  copia.splice(para, 0, item as T);
  return copia;
}

/** Posição para um item novo no fim da lista. Posições começam em 1 e podem ter buracos. */
export function proximaPosicao(posicoes: readonly number[]): number {
  return posicoes.length === 0 ? 1 : Math.max(...posicoes) + 1;
}

type Prescricao = { target_sets: number; rep_min: number; rep_max: number };

/** "2 × 8–10", ou "3 × 10" quando a faixa é um número só. */
export function formatarPrescricao({ target_sets, rep_min, rep_max }: Prescricao): string {
  const reps = rep_min === rep_max ? `${rep_min}` : `${rep_min}–${rep_max}`;
  return `${target_sets} × ${reps}`;
}

/** Reps inteiras entre 1 e 100, com mínimo ≤ máximo. */
export function faixaDeRepsValida(min: number, max: number): boolean {
  const { repsMin, repsMax } = LIMITES_DA_PRESCRICAO;
  return (
    Number.isInteger(min) &&
    Number.isInteger(max) &&
    min >= repsMin &&
    max <= repsMax &&
    min <= max
  );
}
