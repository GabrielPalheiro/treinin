/** Nome como será gravado: sem espaços nas pontas e sem espaços repetidos. */
export function normalizarNome(nome: string): string {
  return nome.trim().replace(/\s+/g, " ");
}

/**
 * O item com esse nome, pelo mesmo critério dos índices únicos do banco
 * (sem diferenciar maiúsculas e espaços; acento diferencia).
 */
export function encontrarPorNome<T extends { name: string }>(
  lista: readonly T[],
  nome: string,
): T | undefined {
  const alvo = normalizarNome(nome).toLowerCase();
  if (!alvo) return undefined;
  return lista.find((item) => normalizarNome(item.name).toLowerCase() === alvo);
}
