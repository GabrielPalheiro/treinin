const MUITAS_TENTATIVAS = "Muitas tentativas. Aguarde alguns minutos e tente de novo.";

const MENSAGENS: Record<string, string> = {
  invalid_credentials: "E-mail ou senha incorretos.",
  email_not_confirmed:
    "Este e-mail ainda não foi confirmado. Confirme o usuário no painel do Supabase.",
  over_request_rate_limit: MUITAS_TENTATIVAS,
};

const MENSAGEM_PADRAO = "Não foi possível entrar agora. Tente de novo em instantes.";

/** Texto para a tela a partir do `code` do erro do Supabase Auth. */
export function mensagemDeErroDoLogin(codigo: string | undefined): string {
  return (codigo && MENSAGENS[codigo]) ?? MENSAGEM_PADRAO;
}

const MENSAGENS_DA_SENHA: Record<string, string> = {
  same_password: "A nova senha precisa ser diferente da atual.",
  weak_password: "Senha fraca. Use pelo menos 8 caracteres.",
  over_request_rate_limit: MUITAS_TENTATIVAS,
};

const MENSAGEM_PADRAO_DA_SENHA = "Não foi possível alterar a senha agora. Tente de novo em instantes.";

/** Texto para a tela a partir do `code` do erro do `updateUser`. */
export function mensagemDeErroDaSenha(codigo: string | undefined): string {
  return (codigo && MENSAGENS_DA_SENHA[codigo]) ?? MENSAGEM_PADRAO_DA_SENHA;
}
