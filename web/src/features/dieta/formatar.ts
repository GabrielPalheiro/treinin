const numeroBr = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

/** 87.5 → "87,5"; 1250 → "1.250". */
export function formatarNumero(n: number): string {
  return numeroBr.format(n);
}
