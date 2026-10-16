import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { WorkoutPlan } from "./consultas";
import { EstadoDaFicha } from "./estado-da-ficha";

export function ListaDeFichas({ fichas }: { fichas: WorkoutPlan[] }) {
  const emUso = fichas.filter((f) => !f.archived_at);
  const arquivadas = fichas.filter((f) => f.archived_at);

  return (
    <div className="flex flex-col gap-4">
      {emUso.length === 0 ? (
        <p className="text-muted-foreground">Nenhuma ficha ainda. Crie a primeira abaixo.</p>
      ) : (
        <ItensDaLista fichas={emUso} />
      )}
      {arquivadas.length > 0 && (
        <details className="flex flex-col gap-2">
          <summary className="flex min-h-toque cursor-pointer items-center text-sm font-medium text-muted-foreground">
            Arquivadas ({arquivadas.length})
          </summary>
          <ItensDaLista fichas={arquivadas} />
        </details>
      )}
    </div>
  );
}

function ItensDaLista({ fichas }: { fichas: WorkoutPlan[] }) {
  return (
    <ul className="flex flex-col divide-y rounded-lg border bg-card">
      {fichas.map((ficha) => (
        <li key={ficha.id}>
          <Link href={`/ficha/${ficha.id}`} className="flex min-h-toque items-center gap-3 px-4 py-3">
            <span className="flex-1 font-medium">{ficha.name}</span>
            <EstadoDaFicha ficha={ficha} />
            <ChevronRight aria-hidden className="size-5 text-muted-foreground" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
