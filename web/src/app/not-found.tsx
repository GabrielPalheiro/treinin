import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NaoEncontrado() {
  return (
    <main className="mx-auto flex w-full max-w-app flex-1 flex-col justify-center gap-4 px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Não encontrado</h1>
      <p className="text-muted-foreground">Essa página não existe ou não é sua.</p>
      <Button asChild>
        <Link href="/hoje">Ir para Hoje</Link>
      </Button>
    </main>
  );
}
