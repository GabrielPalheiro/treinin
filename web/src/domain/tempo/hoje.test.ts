import { describe, expect, it } from "vitest";
import { hoje, type Relogio } from "./hoje";

function relogioParado(instanteIso: string): Relogio {
  return { agora: () => new Date(instanteIso) };
}

describe("hoje", () => {
  it.each([
    ["meio-dia em São Paulo", "2026-10-16T15:00:00Z", "2026-10-16"],
    ["meia-noite e cinco em São Paulo", "2026-10-16T03:05:00Z", "2026-10-16"],
    ["23:59 em São Paulo, já dia seguinte em UTC", "2026-10-17T02:59:00Z", "2026-10-16"],
    ["23:30 em São Paulo, já dia seguinte em UTC", "2026-10-17T02:30:00Z", "2026-10-16"],
    ["virada do mês ainda no último dia", "2026-11-01T02:00:00Z", "2026-10-31"],
    ["virada do ano ainda em 31/12", "2027-01-01T01:00:00Z", "2026-12-31"],
    ["primeiro minuto do ano em São Paulo", "2027-01-01T03:00:00Z", "2027-01-01"],
    ["29 de fevereiro em ano bissexto", "2028-02-29T12:00:00Z", "2028-02-29"],
  ])("%s → %s", (_caso, instante, esperado) => {
    expect(hoje(relogioParado(instante))).toBe(esperado);
  });
});
