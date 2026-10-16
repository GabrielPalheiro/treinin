import type { Metadata } from "next";
import { FormularioEntrar } from "@/features/auth/formulario-entrar";

export const metadata: Metadata = {
  title: "Entrar · TreinIn",
};

export default function PaginaEntrar() {
  return (
    <main className="mx-auto flex w-full max-w-app flex-1 flex-col justify-center gap-8 px-4 py-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">TreinIn</h1>
        <p className="text-muted-foreground">Entre para registrar o treino e a dieta.</p>
      </div>
      <FormularioEntrar />
    </main>
  );
}
