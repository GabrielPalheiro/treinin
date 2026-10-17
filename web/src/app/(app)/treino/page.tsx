import { ChevronRight, ClipboardList, ListChecks } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { buscarFichaAtiva } from "@/features/ficha/consultas";

export const metadata: Metadata = {
  title: "Treino · TreinIn",
};

export default function PaginaTreino() {
  return (
    <main className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Treino</h1>
      <Suspense fallback={<p className="text-muted-foreground">Carregando…</p>}>
        <FichaAtiva />
      </Suspense>
      <nav aria-label="Cadastros" className="flex flex-col gap-2">
        <LinkDeCadastro href="/ficha" Icone={ClipboardList}>
          Fichas
        </LinkDeCadastro>
        <LinkDeCadastro href="/ficha/exercicios" Icone={ListChecks}>
          Exercícios
        </LinkDeCadastro>
      </nav>
    </main>
  );
}

async function FichaAtiva() {
  const ficha = await buscarFichaAtiva();

  if (!ficha) {
    return (
      <section className="flex flex-col gap-3 rounded-lg border border-dashed p-4">
        <p className="font-medium">Nenhuma ficha ativa</p>
        <p className="text-sm text-muted-foreground">Cadastre a ficha do treinador e ative-a.</p>
        <Button asChild>
          <Link href="/ficha">Cadastrar ficha</Link>
        </Button>
      </section>
    );
  }

  return (
    <section aria-labelledby="titulo-ficha-ativa" className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">Ficha ativa</p>
        <h2 id="titulo-ficha-ativa" className="text-xl font-semibold">
          {ficha.name}
        </h2>
      </div>
      {ficha.treinos.length === 0 ? (
        <p className="text-muted-foreground">A ficha ainda não tem treinos.</p>
      ) : (
        <ol className="flex flex-col divide-y rounded-lg border bg-card">
          {ficha.treinos.map((treino, indice) => (
            <li key={treino.id}>
              <Link
                href={`/ficha/${ficha.id}/treinos/${treino.id}`}
                className="flex min-h-toque items-center gap-3 px-4 py-3"
              >
                <span className="w-5 text-sm text-muted-foreground tabular-nums">{indice + 1}</span>
                <span className="flex-1 font-medium">{treino.name}</span>
                <span className="text-sm text-muted-foreground">
                  {treino.quantidadeDeExercicios === 1 ? "1 exercício" : `${treino.quantidadeDeExercicios} exercícios`}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
      <Button asChild variant="outline">
        <Link href={`/ficha/${ficha.id}`}>Editar ficha</Link>
      </Button>
    </section>
  );
}

function LinkDeCadastro({
  href,
  Icone,
  children,
}: {
  href: string;
  Icone: typeof ListChecks;
  children: React.ReactNode;
}) {
  return (
    <Button asChild variant="ghost" className="justify-between">
      <Link href={href}>
        <span className="flex items-center gap-2">
          <Icone aria-hidden />
          {children}
        </span>
        <ChevronRight aria-hidden />
      </Link>
    </Button>
  );
}
