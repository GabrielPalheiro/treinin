import type { Data } from "../tempo/hoje";
import { calcularKcal, type Meal } from "./registro";

/** Um registro da refeição de origem, com o kcal por 100 g atual do alimento. */
export type RegistroParaCopiar = { food_id: string; grams: number; kcal_per_100g: number };

export type RegistroCopiado = { date: Data; meal: Meal; food_id: string; grams: number; kcal: number };

/**
 * "Copiar de…": os mesmos alimentos e gramas na data e refeição de destino, na mesma ordem.
 * O kcal é recalculado com o valor atual do alimento, como num registro novo.
 */
export function copiarRegistros(
  origem: readonly RegistroParaCopiar[],
  destino: { date: Data; meal: Meal },
): RegistroCopiado[] {
  return origem.map(({ food_id, grams, kcal_per_100g }) => ({
    ...destino,
    food_id,
    grams,
    kcal: calcularKcal(kcal_per_100g, grams),
  }));
}
