import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dieta · TreinIn",
};

export default function PaginaDieta() {
  return (
    <main className="flex flex-col gap-2">
      <h1 className="text-3xl font-bold tracking-tight">Dieta</h1>
      <p className="text-muted-foreground">As refeições e as calorias do dia chegam na Fatia 3.</p>
    </main>
  );
}
