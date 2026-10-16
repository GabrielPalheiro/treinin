import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { CatalogoDeExercicios } from "@/features/ficha/catalogo-de-exercicios";
import { listarExercicios } from "@/features/ficha/consultas";

export const metadata: Metadata = {
  title: "Exercícios · TreinIn",
};

export default function PaginaExercicios() {
  return (
    <main className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Button asChild variant="ghost" className="-ml-3 self-start">
          <Link href="/treino">
            <ChevronLeft aria-hidden />
            Treino
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Exercícios</h1>
        <p className="text-muted-foreground">O seu catálogo, usado para montar a ficha.</p>
      </header>
      <Suspense fallback={<p className="text-muted-foreground">Carregando…</p>}>
        <Catalogo />
      </Suspense>
    </main>
  );
}

async function Catalogo() {
  const exercicios = await listarExercicios();
  return <CatalogoDeExercicios exercicios={exercicios} />;
}
