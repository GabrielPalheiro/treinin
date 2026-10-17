import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LinkDeVoltar } from "@/components/link-de-voltar";
import { listarExercicios } from "@/features/ficha/consultas";
import { AdicionarForaDaFicha } from "@/features/treino/adicionar-fora-da-ficha";
import { CartaoDoExercicio } from "@/features/treino/cartao-do-exercicio";
import { carregarSessao } from "@/features/treino/consultas";
import { FinalizarSessao } from "@/features/treino/finalizar-sessao";
import { formatarDataLonga } from "@/lib/formatar-data";

export const metadata: Metadata = {
  title: "Sessão · TreinIn",
};

type Props = PageProps<"/treino/sessao/[sessaoId]">;

export default function PaginaSessao({ params }: Props) {
  return (
    <main className="flex flex-col gap-4">
      <LinkDeVoltar href="/hoje">Hoje</LinkDeVoltar>
      <Suspense fallback={<p className="text-muted-foreground">Carregando…</p>}>
        <Sessao params={params} />
      </Suspense>
    </main>
  );
}

async function Sessao({ params }: Pick<Props, "params">) {
  const { sessaoId } = await params;
  const [sessao, catalogo] = await Promise.all([carregarSessao(sessaoId), listarExercicios()]);
  if (!sessao) notFound();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">{sessao.nomeDoTreino ?? "Treino"}</h1>
        <p className="text-muted-foreground first-letter:uppercase">
          {formatarDataLonga(sessao.date)}
          {sessao.finalizada && " · finalizada"}
        </p>
      </header>

      {sessao.cartoes.length === 0 ? (
        <p className="text-muted-foreground">Este treino não tem exercícios na ficha.</p>
      ) : (
        <ol className="flex flex-col gap-4">
          {sessao.cartoes.map((cartao) => (
            <CartaoDoExercicio
              key={cartao.chave}
              cartao={cartao}
              sessaoId={sessao.id}
              hoje={sessao.hoje}
              catalogo={catalogo}
            />
          ))}
        </ol>
      )}

      <AdicionarForaDaFicha sessaoId={sessao.id} catalogo={catalogo} />

      {sessao.finalizada ? (
        sessao.note && (
          <section className="flex flex-col gap-1 border-t pt-6">
            <h2 className="text-sm font-medium text-muted-foreground">Observação</h2>
            <p>{sessao.note}</p>
          </section>
        )
      ) : (
        <FinalizarSessao sessaoId={sessao.id} nota={sessao.note} />
      )}
    </div>
  );
}
