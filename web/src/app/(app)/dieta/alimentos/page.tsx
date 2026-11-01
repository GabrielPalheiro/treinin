import type { Metadata } from "next";
import { Suspense } from "react";
import { LinkDeVoltar } from "@/components/link-de-voltar";
import { AlimentosProprios } from "@/features/dieta/alimentos-proprios";
import { listarAlimentosProprios } from "@/features/dieta/consultas";
import { FonteTaco } from "@/features/dieta/fonte-taco";

export const metadata: Metadata = {
  title: "Alimentos · TreinIn",
};

type Props = PageProps<"/dieta/alimentos">;

export default function PaginaAlimentos({ searchParams }: Props) {
  return (
    <main className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <LinkDeVoltar href="/dieta">Dieta</LinkDeVoltar>
        <h1 className="text-3xl font-bold tracking-tight">Alimentos</h1>
        <p className="text-muted-foreground">
          A busca já tem os alimentos da TACO. Aqui ficam os seus, com as kcal do rótulo.
        </p>
      </header>
      <Suspense fallback={<p className="text-muted-foreground">Carregando…</p>}>
        <Alimentos searchParams={searchParams} />
      </Suspense>
      <FonteTaco />
    </main>
  );
}

async function Alimentos({ searchParams }: Pick<Props, "searchParams">) {
  // `?nome=` vem do "Cadastrar" da busca, quando o alimento não foi encontrado.
  const [{ nome }, alimentos] = await Promise.all([searchParams, listarAlimentosProprios()]);
  return <AlimentosProprios alimentos={alimentos} nomeInicial={typeof nome === "string" ? nome.trim() : ""} />;
}
