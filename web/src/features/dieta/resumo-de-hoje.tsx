import { ChevronRight, Utensils } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { hoje } from "@/domain/tempo/hoje";
import { relogioDoSistema } from "@/lib/relogio";
import { buscarMeta, totalDaData } from "./consultas";
import { formatarNumero } from "./formatar";
import { ProgressoDaMeta } from "./progresso-da-meta";

/** Na tela Hoje: as kcal já registradas no dia e a meta, com atalho para a Dieta. */
export async function ResumoDaDietaDeHoje() {
  // O relógio é lido a cada requisição, nunca no prerender.
  await connection();
  const [total, meta] = await Promise.all([totalDaData(hoje(relogioDoSistema)), buscarMeta()]);

  return (
    <Link
      href="/dieta"
      className="flex min-h-toque items-center gap-3 rounded-lg border bg-card px-4 py-3 text-card-foreground"
    >
      <Utensils aria-hidden className="size-5 text-primary" />
      <span className="flex flex-1 flex-col gap-1">
        <span className="text-sm text-muted-foreground">Dieta de hoje</span>
        <span className="text-lg font-semibold tabular-nums">{formatarNumero(total)} kcal</span>
        {meta === null ? (
          <span className="text-sm text-muted-foreground">Defina uma meta na Dieta</span>
        ) : (
          <ProgressoDaMeta consumido={total} meta={meta} />
        )}
      </span>
      <ChevronRight aria-hidden className="size-5 text-muted-foreground" />
    </Link>
  );
}
