import type { Data } from "@/domain/tempo/hoje";

// A Data já é o dia em São Paulo; o meio-dia em UTC evita que o fuso troque o dia ao formatar.
const formatoLongo = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "UTC",
  weekday: "long",
  day: "numeric",
  month: "long",
});

/** "sexta-feira, 16 de outubro" */
export function formatarDataLonga(data: Data): string {
  return formatoLongo.format(new Date(`${data}T12:00:00Z`));
}
