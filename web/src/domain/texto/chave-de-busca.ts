/** Minúsculas e sem acento: "Elevação" e "elevacao" se encontram. */
export function chaveDeBusca(texto: string): string {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

/** As palavras do termo de busca, já como chave; termo vazio ou só com espaços não tem nenhuma. */
export function palavrasDoTermo(termo: string): string[] {
  return chaveDeBusca(termo).split(/\s+/).filter(Boolean);
}
