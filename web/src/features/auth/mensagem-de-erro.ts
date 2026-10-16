const MENSAGENS: Record<string, string> = {
  invalid_credentials: "E-mail ou senha incorretos.",
  email_not_confirmed:
    "Este e-mail ainda não foi confirmado. Confirme o usuário no painel do Supabase.",
  over_request_rate_limit: "Muitas tentativas. Aguarde alguns minutos e tente de novo.",
};

const MENSAGEM_PADRAO = "Não foi possível entrar agora. Tente de novo em instantes.";

/** Texto para a tela a partir do `code` do erro do Supabase Auth. */
export function mensagemDeErroDoLogin(codigo: string | undefined): string {
  return (codigo && MENSAGENS[codigo]) ?? MENSAGEM_PADRAO;
}
