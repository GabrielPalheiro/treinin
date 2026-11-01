import type { Data } from "./hoje";

const FORMATO_DA_DATA = /^(\d{4})-(\d{2})-(\d{2})$/;

// A conta é feita em UTC, só com o dia de calendário: fuso e horário de verão não interferem.
function paraData(instante: Date): Data {
  return instante.toISOString().slice(0, 10);
}

/** A data `dias` depois (ou antes, se negativo). */
export function somarDias(data: Data, dias: number): Data {
  const instante = new Date(`${data}T00:00:00Z`);
  instante.setUTCDate(instante.getUTCDate() + dias);
  return paraData(instante);
}

/** Texto `YYYY-MM-DD` de uma data que existe no calendário; qualquer outra coisa → null. */
export function lerData(texto: string | undefined): Data | null {
  const partes = texto?.match(FORMATO_DA_DATA);
  if (!partes) return null;
  const [, ano, mes, dia] = partes.map(Number);
  const instante = new Date(Date.UTC(ano ?? 0, (mes ?? 1) - 1, dia ?? 1));
  return paraData(instante) === texto ? texto : null;
}
