import { describe, expect, it } from "vitest";
import { copiarRegistros } from "./copiar";

describe("copiarRegistros", () => {
  const destino = { date: "2026-11-02", meal: "Lunch" } as const;

  it("refeição de origem vazia não copia nada", () => {
    expect(copiarRegistros([], destino)).toEqual([]);
  });

  it("copia alimento e gramas para a data e a refeição de destino, na mesma ordem", () => {
    const origem = [
      { food_id: "arroz", grams: 150, kcal_per_100g: 128 },
      { food_id: "feijao", grams: 87.5, kcal_per_100g: 76 },
    ];
    expect(copiarRegistros(origem, destino)).toEqual([
      { date: "2026-11-02", meal: "Lunch", food_id: "arroz", grams: 150, kcal: 192 },
      { date: "2026-11-02", meal: "Lunch", food_id: "feijao", grams: 87.5, kcal: 67 },
    ]);
  });

  it("recalcula o kcal com o valor atual do alimento, não o gravado na origem", () => {
    // Na origem o whey era 400 kcal/100 g (120 kcal em 30 g); hoje está corrigido para 380,5.
    const origem = [{ food_id: "whey", grams: 30, kcal_per_100g: 380.5 }];
    expect(copiarRegistros(origem, destino)).toEqual([
      { date: "2026-11-02", meal: "Lunch", food_id: "whey", grams: 30, kcal: 114 },
    ]);
  });
});
