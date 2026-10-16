import type { Relogio } from "@/domain/tempo/hoje";

/** O relógio real. Fica fora de `domain/`: as regras recebem o relógio por parâmetro. */
export const relogioDoSistema: Relogio = {
  agora: () => new Date(),
};
