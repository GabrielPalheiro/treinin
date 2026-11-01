/** As refeições na ordem do dia, como aparecem na tela. */
export const refeicoesEmOrdem = ["Breakfast", "Lunch", "Snack", "Dinner", "Supper"] as const;

export type Meal = (typeof refeicoesEmOrdem)[number];

/**
 * kcal = kcal_per_100g × grams ÷ 100, arredondado para o inteiro mais próximo (meio para cima).
 * A conta é feita em décimos inteiros, a precisão das colunas, para o ponto flutuante não
 * transformar 34,5 em 34,4999….
 */
export function calcularKcal(kcalPor100g: number, gramas: number): number {
  const produtoEmDecimos = Math.round(kcalPor100g * 10) * Math.round(gramas * 10);
  return Math.floor((produtoEmDecimos + 5000) / 10000);
}

/** Soma dos kcal gravados nos registros do dia. */
export function totalDoDia(registros: readonly { kcal: number }[]): number {
  return registros.reduce((soma, r) => soma + r.kcal, 0);
}

/** Soma dos kcal de cada refeição; refeição sem registro fica com zero. */
export function totalPorRefeicao(registros: readonly { meal: Meal; kcal: number }[]): Record<Meal, number> {
  const totais: Record<Meal, number> = { Breakfast: 0, Lunch: 0, Snack: 0, Dinner: 0, Supper: 0 };
  for (const r of registros) totais[r.meal] += r.kcal;
  return totais;
}
