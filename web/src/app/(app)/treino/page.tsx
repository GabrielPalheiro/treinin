import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Treino · TreinIn",
};

export default function PaginaTreino() {
  return (
    <main className="flex flex-col gap-2">
      <h1 className="text-3xl font-bold tracking-tight">Treino</h1>
      <p className="text-muted-foreground">A ficha e a sessão de treino chegam nas Fatias 1 e 2.</p>
    </main>
  );
}
