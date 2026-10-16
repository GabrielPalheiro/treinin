/** Fonte do instante atual. Injetada para que as regras sejam testáveis. */
export type Relogio = {
  agora(): Date;
};

/** Data de calendário, sem hora, no formato `YYYY-MM-DD` (igual à coluna `date`). */
export type Data = string;

export const FUSO = "America/Sao_Paulo";

// en-CA formata como YYYY-MM-DD
const formatoData = new Intl.DateTimeFormat("en-CA", {
  timeZone: FUSO,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** A data de hoje no fuso de São Paulo, segundo o relógio informado. */
export function hoje(relogio: Relogio): Data {
  return formatoData.format(relogio.agora());
}
