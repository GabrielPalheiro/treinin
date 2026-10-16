/** Nome como será gravado: sem espaços nas pontas e sem espaços repetidos. */
export function normalizarNome(nome: string): string {
  return nome.trim().replace(/\s+/g, " ");
}

/**
 * O exercício com esse nome, pelo mesmo critério do índice único do banco
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

// Minúsculas e sem acento: "Elevação" e "elevacao" se encontram.
function chaveDeBusca(texto: string): string {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

const ordemAlfabetica = new Intl.Collator("pt-BR", { sensitivity: "base" });

/**
 * Exercícios cujo nome contém todas as palavras do termo, em qualquer ordem,
 * sem diferenciar acento nem maiúscula. Resultado em ordem alfabética.
 */
export function buscarExercicios<T extends { name: string }>(lista: readonly T[], termo: string): T[] {
  const palavras = chaveDeBusca(termo).split(/\s+/).filter(Boolean);
  return lista
    .filter((item) => {
      const nome = chaveDeBusca(item.name);
      return palavras.every((palavra) => nome.includes(palavra));
    })
    .sort((a, b) => ordemAlfabetica.compare(a.name, b.name));
}
