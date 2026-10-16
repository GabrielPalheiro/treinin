import { ChevronRight, ListChecks } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Treino · TreinIn",
};

export default function PaginaTreino() {
  return (
    <main className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Treino</h1>
        <p className="text-muted-foreground">A ficha e a sessão de treino chegam nas Fatias 1 e 2.</p>
      </div>
      <Button asChild variant="outline" className="justify-between">
        <Link href="/ficha/exercicios">
          <span className="flex items-center gap-2">
            <ListChecks aria-hidden />
            Exercícios
          </span>
          <ChevronRight aria-hidden />
        </Link>
      </Button>
    </main>
  );
}
