import { Progress } from "@/components/ui/progress";
import { progressoDaMeta } from "@/domain/dieta/meta";
import { formatarNumero } from "./formatar";

/** "de 2.100 kcal · faltam 350" e a barra. Passar da meta aparece em tom neutro, sem alerta. */
export function ProgressoDaMeta({ consumido, meta }: { consumido: number; meta: number }) {
  const { falta, excedente, fracao } = progressoDaMeta(consumido, meta);
  const situacao =
    excedente > 0
      ? `${formatarNumero(excedente)} acima da meta`
      : falta > 0
        ? `faltam ${formatarNumero(falta)}`
        : "meta atingida";

  return (
    <span className="flex w-full flex-col gap-1">
      <span className="text-sm text-muted-foreground tabular-nums">
        de {formatarNumero(meta)} kcal · {situacao}
      </span>
      <Progress value={Math.round(fracao * 100)} aria-label="Progresso da meta diária de kcal" />
    </span>
  );
}
