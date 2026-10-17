/** Retorno das Server Actions da ficha: nada quando deu certo, ou a mensagem para a tela. */
export type ResultadoDaAcao = { erro: string } | undefined;

/** Para ações que criam algo e a tela precisa do id. */
export type ResultadoComId = { erro: string } | { id: string };

const MENSAGENS_POR_CODIGO: Record<string, string> = {
  "23505": "Já existe um item com esse nome.",
  "23514": "Algum valor está fora dos limites.",
  "23503": "Item relacionado não encontrado.",
  P0002: "Não encontrado.",
};

const FALHA = "Não foi possível salvar. Tente de novo.";

/** Erro do Supabase → mensagem para a tela. Detalhes técnicos vão só para o log. */
export function mensagemDeErro(
  contexto: string,
  error: { code: string },
  mensagens: Record<string, string> = {},
): string {
  const mensagem = mensagens[error.code] ?? MENSAGENS_POR_CODIGO[error.code];
  if (mensagem) return mensagem;
  console.error(`[${contexto}] falha`, { code: error.code });
  return FALHA;
}

export function primeiroErro(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? FALHA;
}
