import { cn } from "cn";
import type { WorkoutPlan } from "./consultas";

/** Ativa · Inativa · Arquivada (docs/dominio.md). */
export function EstadoDaFicha({ ficha }: { ficha: Pick<WorkoutPlan, "active" | "archived_at"> }) {
  const [rotulo, estilo] = ficha.archived_at
    ? ["Arquivada", "bg-muted text-muted-foreground"]
    : ficha.active
      ? ["Ativa", "bg-primary text-primary-foreground"]
      : ["Inativa", "bg-secondary text-secondary-foreground"];

  return (
    <span className={cn("inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium", estilo)}>
      {rotulo}
    </span>
  );
}
