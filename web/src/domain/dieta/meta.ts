/** Onde o dia está em relação à meta: quanto falta, quanto passou e o quanto da barra preencher. */
export type ProgressoDaMeta = { falta: number; excedente: number; fracao: number };

/**
 * Consumido (kcal do dia) contra a meta diária (`DietGoal`). Passar da meta não é erro:
 * `falta` fica em zero, `excedente` mostra quanto passou e a barra fica cheia.
 */
export function progressoDaMeta(consumido: number, meta: number): ProgressoDaMeta {
  return {
    falta: Math.max(meta - consumido, 0),
    excedente: Math.max(consumido - meta, 0),
    fracao: Math.min(consumido / meta, 1),
  };
}
