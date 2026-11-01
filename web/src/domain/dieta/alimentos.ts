import { chaveDeBusca, palavrasDoTermo } from "../texto/chave-de-busca";

const ordemAlfabetica = new Intl.Collator("pt-BR", { sensitivity: "base" });

/**
 * Alimentos cujo nome contém todas as palavras do termo, em qualquer ordem, sem diferenciar
 * acento nem maiúscula. Ordem: mais usados primeiro (`usos` por id); depois os que começam
 * com o termo; depois alfabética.
 */
export function buscarAlimentos<T extends { id: string; name: string }>(
  lista: readonly T[],
  termo: string,
  usos: ReadonlyMap<string, number>,
): T[] {
  const palavras = palavrasDoTermo(termo);
  const inicio = palavras.join(" ");
  const comecaComTermo = (item: T) => (inicio && chaveDeBusca(item.name).startsWith(inicio) ? 1 : 0);
  return lista
    .filter((item) => {
      const nome = chaveDeBusca(item.name);
      return palavras.every((palavra) => nome.includes(palavra));
    })
    .sort(
      (a, b) =>
        (usos.get(b.id) ?? 0) - (usos.get(a.id) ?? 0) ||
        comecaComTermo(b) - comecaComTermo(a) ||
        ordemAlfabetica.compare(a.name, b.name),
    );
}
