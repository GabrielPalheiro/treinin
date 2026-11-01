import { describe, expect, it } from "vitest";
import { lerData, somarDias } from "./calendario";

describe("somarDias", () => {
  it.each([
    ["2026-10-31", 1, "2026-11-01"],
    ["2026-11-01", -1, "2026-10-31"],
    ["2026-12-31", 1, "2027-01-01"],
    ["2028-02-28", 1, "2028-02-29"],
    ["2027-02-28", 1, "2027-03-01"],
    ["2026-10-16", 0, "2026-10-16"],
    ["2026-10-16", -30, "2026-09-16"],
  ])("%s com %d dias → %s", (data, dias, esperado) => {
    expect(somarDias(data, dias)).toBe(esperado);
  });
});

describe("lerData", () => {
  it.each([
    ["2026-10-31", "2026-10-31"],
    ["2028-02-29", "2028-02-29"],
    ["2027-02-29", null],
    ["2026-13-01", null],
    ["2026-10-32", null],
    ["2026-1-5", null],
    ["31/10/2026", null],
    ["", null],
    [undefined, null],
  ])("%j → %j", (texto, esperado) => {
    expect(lerData(texto)).toBe(esperado);
  });
});
