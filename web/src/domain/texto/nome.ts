/** Nome como será gravado: sem espaços nas pontas e sem espaços repetidos. */
export function normalizarNome(nome: string): string {
  return nome.trim().replace(/\s+/g, " ");
}
