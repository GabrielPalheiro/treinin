import { chaveDeBusca, palavrasDoTermo } from "../texto/chave-de-busca";
import { normalizarNome } from "../texto/nome";

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

const ordemAlfabetica = new Intl.Collator("pt-BR", { sensitivity: "base" });

/**
 * Exercícios cujo nome contém todas as palavras do termo, em qualquer ordem,
 * sem diferenciar acento nem maiúscula. Resultado em ordem alfabética.
 */
export function buscarExercicios<T extends { name: string }>(lista: readonly T[], termo: string): T[] {
  const palavras = palavrasDoTermo(termo);
  return lista
    .filter((item) => {
      const nome = chaveDeBusca(item.name);
      return palavras.every((palavra) => nome.includes(palavra));
    })
    .sort((a, b) => ordemAlfabetica.compare(a.name, b.name));
}
