import type { Metadata } from "next";
import { Suspense } from "react";
import { LinkDeVoltar } from "@/components/link-de-voltar";
import { BotaoSair } from "@/features/auth/botao-sair";
import { FormularioDeSenha } from "@/features/auth/formulario-de-senha";
import { criarClienteParaLeitura } from "@/lib/supabase/servidor";

export const metadata: Metadata = {
  title: "Conta · TreinIn",
};

export default function PaginaConta() {
  return (
    <main className="flex flex-col gap-6">
      <LinkDeVoltar href="/hoje">Hoje</LinkDeVoltar>
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Conta</h1>
        <Suspense fallback={<p className="text-muted-foreground">&nbsp;</p>}>
          <EmailDaConta />
        </Suspense>
      </header>
      <section className="rounded-lg border bg-card p-4">
        <FormularioDeSenha />
      </section>
      <BotaoSair />
    </main>
  );
}

async function EmailDaConta() {
  const supabase = await criarClienteParaLeitura();
  const { data } = await supabase.auth.getUser();
  return <p className="truncate text-muted-foreground">{data.user?.email}</p>;
}
