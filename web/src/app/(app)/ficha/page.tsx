import type { Metadata } from "next";
import { Suspense } from "react";
import { LinkDeVoltar } from "@/components/link-de-voltar";
import { criarFicha } from "@/features/ficha/acoes-ficha";
import { listarFichas } from "@/features/ficha/consultas";
import { FormularioDeNome } from "@/features/ficha/formulario-de-nome";
import { ListaDeFichas } from "@/features/ficha/lista-de-fichas";

export const metadata: Metadata = {
  title: "Fichas · TreinIn",
};

export default function PaginaFichas() {
  return (
    <main className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <LinkDeVoltar href="/treino">Treino</LinkDeVoltar>
        <h1 className="text-3xl font-bold tracking-tight">Fichas</h1>
        <p className="text-muted-foreground">Só uma fica ativa: dela vêm os treinos do dia.</p>
      </header>
      <Suspense fallback={<p className="text-muted-foreground">Carregando…</p>}>
        <Fichas />
      </Suspense>
      <FormularioDeNome
        tipo="ficha"
        rotulo="Nova ficha"
        placeholder="Ex.: Ficha outubro"
        textoDoBotao="Criar ficha"
        acao={criarFicha}
      />
    </main>
  );
}

async function Fichas() {
  return <ListaDeFichas fichas={await listarFichas()} />;
}
