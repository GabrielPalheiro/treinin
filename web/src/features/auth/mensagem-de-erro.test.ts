import { describe, expect, it } from "vitest";
import { mensagemDeErroDoLogin } from "./mensagem-de-erro";

describe("mensagemDeErroDoLogin", () => {
  it.each([
    ["invalid_credentials", "E-mail ou senha incorretos."],
    ["email_not_confirmed", "Este e-mail ainda não foi confirmado. Confirme o usuário no painel do Supabase."],
    ["over_request_rate_limit", "Muitas tentativas. Aguarde alguns minutos e tente de novo."],
    ["email_provider_disabled", "Não foi possível entrar agora. Tente de novo em instantes."],
    [undefined, "Não foi possível entrar agora. Tente de novo em instantes."],
  ])("%s → %s", (codigo, esperado) => {
    expect(mensagemDeErroDoLogin(codigo)).toBe(esperado);
  });
});
