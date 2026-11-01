import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { totalDoDia } from "@/domain/dieta/registro";
import { lerData, somarDias } from "@/domain/tempo/calendario";
import { hoje, type Data } from "@/domain/tempo/hoje";
import { carregarDiaDaDieta } from "@/features/dieta/consultas";
import { FonteTaco } from "@/features/dieta/fonte-taco";
import { RefeicoesDoDia } from "@/features/dieta/refeicoes-do-dia";
import { formatarDataLonga } from "@/lib/formatar-data";
import { relogioDoSistema } from "@/lib/relogio";

export const metadata: Metadata = {
  title: "Dieta · TreinIn",
};

type Props = PageProps<"/dieta">;

export default function PaginaDieta({ searchParams }: Props) {
  return (
    <main className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Dieta</h1>
        <Button asChild variant="ghost">
          <Link href="/dieta/alimentos">Meus alimentos</Link>
        </Button>
      </header>
      <Suspense fallback={<p className="text-muted-foreground">Carregando…</p>}>
        <DiaDaDieta searchParams={searchParams} />
      </Suspense>
      <FonteTaco />
    </main>
  );
}

function rotuloDoDia(data: Data, dataDeHoje: Data): string {
  if (data === dataDeHoje) return "Hoje";
  if (data === somarDias(dataDeHoje, -1)) return "Ontem";
  return formatarDataLonga(data);
}

async function DiaDaDieta({ searchParams }: Pick<Props, "searchParams">) {
  const { data: dataDaUrl } = await searchParams;
  // O relógio é lido a cada requisição, nunca no prerender.
  await connection();
  const dataDeHoje = hoje(relogioDoSistema);
  // Sem data na URL, ou data inválida: hoje.
  const data = lerData(typeof dataDaUrl === "string" ? dataDaUrl : undefined) ?? dataDeHoje;
  const { registros, alimentos, usos } = await carregarDiaDaDieta(data);
  const linkDoDia = (d: Data) => (d === dataDeHoje ? "/dieta" : `/dieta?data=${d}`);

  return (
    <div className="flex flex-col gap-4">
      <nav aria-label="Dia" className="flex items-center justify-between gap-2">
        <Button asChild variant="ghost" size="icon">
          <Link href={linkDoDia(somarDias(data, -1))} aria-label="Dia anterior">
            <ChevronLeft aria-hidden />
          </Link>
        </Button>
        <div className="flex flex-col items-center text-center">
          <p className="font-semibold first-letter:uppercase">{rotuloDoDia(data, dataDeHoje)}</p>
          <p className="text-2xl font-bold tabular-nums">{totalDoDia(registros)} kcal</p>
        </div>
        <Button asChild variant="ghost" size="icon">
          <Link href={linkDoDia(somarDias(data, 1))} aria-label="Dia seguinte">
            <ChevronRight aria-hidden />
          </Link>
        </Button>
      </nav>
      {data !== dataDeHoje && (
        <Button asChild variant="outline" className="self-center">
          <Link href="/dieta">Voltar para hoje</Link>
        </Button>
      )}

      <RefeicoesDoDia key={data} data={data} registros={registros} alimentos={alimentos} usos={usos} />
    </div>
  );
}
