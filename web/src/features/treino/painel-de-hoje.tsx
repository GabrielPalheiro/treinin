import { CircleCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { haQuantoTempo } from "@/domain/treino/sessao";
import { BotaoComecar } from "./botao-comecar";
import { buscarSituacaoDeHoje } from "./consultas";

/** Tela Hoje: continuar a sessão aberta, ou começar o treino sugerido pela rotação ou outro da ficha. */
export async function PainelDeHoje() {
  const { hoje, aberta, concluidasHoje, ficha, sugestao } = await buscarSituacaoDeHoje();

  return (
    <div className="flex flex-col gap-4">
      {concluidasHoje.map((sessao) => (
        <Link
          key={sessao.id}
          href={`/treino/sessao/${sessao.id}`}
          className="flex min-h-toque items-center gap-2 rounded-lg border bg-card px-4 py-3"
        >
          <CircleCheck aria-hidden className="size-5 text-primary" />
          <span>
            <span className="font-medium">{sessao.nomeDoTreino ?? "Treino"}</span> concluído hoje
          </span>
        </Link>
      ))}

      {aberta ? (
        <section aria-labelledby="titulo-em-andamento" className="flex flex-col gap-3 rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">
            Treino em andamento{aberta.date !== hoje && ` · começou ${haQuantoTempo(aberta.date, hoje)}`}
          </p>
          <h2 id="titulo-em-andamento" className="text-2xl font-bold">
            {aberta.nomeDoTreino ?? "Treino"}
          </h2>
          <Button asChild size="lg">
            <Link href={`/treino/sessao/${aberta.id}`}>Continuar</Link>
          </Button>
        </section>
      ) : !ficha ? (
        <section className="flex flex-col gap-3 rounded-lg border border-dashed p-4">
          <p className="font-medium">Nenhuma ficha ativa</p>
          <p className="text-sm text-muted-foreground">Cadastre a ficha do treinador e ative-a para começar.</p>
          <Button asChild variant="outline">
            <Link href="/ficha">Ir para fichas</Link>
          </Button>
        </section>
      ) : !sugestao ? (
        <section className="flex flex-col gap-3 rounded-lg border border-dashed p-4">
          <p className="font-medium">A ficha ativa ainda não tem treinos</p>
          <Button asChild variant="outline">
            <Link href={`/ficha/${ficha.id}`}>Editar ficha</Link>
          </Button>
        </section>
      ) : (
        <section aria-labelledby="titulo-proximo" className="flex flex-col gap-3 rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Treino de hoje · sugerido pela rotação</p>
          <h2 id="titulo-proximo" className="text-2xl font-bold">
            {sugestao.name}
          </h2>
          <p className="text-sm text-muted-foreground">
            {sugestao.quantidadeDeExercicios === 1 ? "1 exercício" : `${sugestao.quantidadeDeExercicios} exercícios`} ·{" "}
            {ficha.name}
          </p>
          <BotaoComecar treinoId={sugestao.id}>Começar {sugestao.name}</BotaoComecar>

          {/* Sempre à vista: escolher outro treino não pode depender de achar um menu fechado. */}
          {ficha.treinos.length > 1 && (
            <div role="group" aria-labelledby="titulo-outros" className="flex flex-col gap-2 pt-2">
              <p id="titulo-outros" className="text-sm font-medium text-muted-foreground">
                Ou escolha outro treino
              </p>
              {ficha.treinos
                .filter((t) => t.id !== sugestao.id)
                .map((treino) => (
                  <BotaoComecar key={treino.id} treinoId={treino.id} variante="outline">
                    {treino.name}
                  </BotaoComecar>
                ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
