import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LinkDeVoltar } from "@/components/link-de-voltar";
import { buscarFicha } from "@/features/ficha/consultas";
import { EditorDaFicha } from "@/features/ficha/editor-da-ficha";

export const metadata: Metadata = {
  title: "Ficha · TreinIn",
};

export default function PaginaFicha({ params }: PageProps<"/ficha/[fichaId]">) {
  return (
    <main className="flex flex-col gap-4">
      <LinkDeVoltar href="/ficha">Fichas</LinkDeVoltar>
      <Suspense fallback={<p className="text-muted-foreground">Carregando…</p>}>
        <Ficha params={params} />
      </Suspense>
    </main>
  );
}

async function Ficha({ params }: Pick<PageProps<"/ficha/[fichaId]">, "params">) {
  const { fichaId } = await params;
  const ficha = await buscarFicha(fichaId);
  if (!ficha) notFound();
  return <EditorDaFicha ficha={ficha} />;
}
