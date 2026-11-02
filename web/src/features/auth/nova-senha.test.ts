import { describe, expect, it } from "vitest";
import { novaSenhaSchema } from "./nova-senha";

const erro = (senha: string, confirmacao: string) => {
  const resultado = novaSenhaSchema.safeParse({ senha, confirmacao });
  return resultado.success ? null : resultado.error.issues[0]?.message;
};

describe("novaSenhaSchema", () => {
  it("aceita a mesma senha duas vezes, com pelo menos 8 caracteres", () => {
    expect(erro("treino2026", "treino2026")).toBeNull();
  });

  it.each([
    ["vazia", "", "", "Informe a nova senha"],
    ["curta", "1234567", "1234567", "Use pelo menos 8 caracteres"],
    ["longa demais", "a".repeat(73), "a".repeat(73), "Use no máximo 72 caracteres"],
    ["confirmação diferente", "treino2026", "treino2025", "As senhas não conferem"],
  ])("%s → %s", (_caso, senha, confirmacao, esperado) => {
    expect(erro(senha, confirmacao)).toBe(esperado);
  });

  it("a mensagem da confirmação diferente fica no campo de confirmação", () => {
    const resultado = novaSenhaSchema.safeParse({ senha: "treino2026", confirmacao: "x" });
    expect(resultado.success ? null : resultado.error.issues[0]?.path).toEqual(["confirmacao"]);
  });
});
