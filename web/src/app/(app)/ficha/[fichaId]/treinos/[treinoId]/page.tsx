import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LinkDeVoltar } from "@/components/link-de-voltar";
import { buscarTreino, listarExercicios } from "@/features/ficha/consultas";
import { EditorDoTreino } from "@/features/ficha/editor-do-treino";

export const metadata: Metadata = {
  title: "Treino da ficha · TreinIn",
};

type Props = PageProps<"/ficha/[fichaId]/treinos/[treinoId]">;

export default function PaginaTreinoDaFicha({ params }: Props) {
  return (
    <main className="flex flex-col gap-4">
      <Suspense fallback={<p className="text-muted-foreground">Carregando…</p>}>
        <Treino params={params} />
      </Suspense>
    </main>
  );
}

async function Treino({ params }: Pick<Props, "params">) {
  const { fichaId, treinoId } = await params;
  const [treino, catalogo] = await Promise.all([buscarTreino(treinoId), listarExercicios()]);
  if (!treino || treino.ficha.id !== fichaId) notFound();

  return (
    <>
      <LinkDeVoltar href={`/ficha/${treino.ficha.id}`}>{treino.ficha.name}</LinkDeVoltar>
      <EditorDoTreino treino={treino} catalogo={catalogo} />
    </>
  );
}
