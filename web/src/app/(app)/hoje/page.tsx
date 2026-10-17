import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { hoje } from "@/domain/tempo/hoje";
import { BotaoSair } from "@/features/auth/botao-sair";
import { PainelDeHoje } from "@/features/treino/painel-de-hoje";
import { formatarDataLonga } from "@/lib/formatar-data";
import { relogioDoSistema } from "@/lib/relogio";

export const metadata: Metadata = {
  title: "Hoje · TreinIn",
};

export default function PaginaHoje() {
  return (
    <main className="flex flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Hoje</h1>
          <Suspense fallback={<p className="text-muted-foreground">&nbsp;</p>}>
            <DataDeHoje />
          </Suspense>
        </div>
        <BotaoSair />
      </header>
      <Suspense fallback={<p className="text-muted-foreground">Carregando…</p>}>
        <PainelDeHoje />
      </Suspense>
    </main>
  );
}

async function DataDeHoje() {
  // O relógio é lido a cada requisição, nunca no build.
  await connection();
  return (
    <p className="text-muted-foreground first-letter:uppercase">
      {formatarDataLonga(hoje(relogioDoSistema))}
    </p>
  );
}
