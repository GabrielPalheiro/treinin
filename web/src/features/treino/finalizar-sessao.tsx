"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { finalizarSessao } from "./acoes-sessao";
import { observacaoSchema, type Observacao } from "./serie-schema";

export function FinalizarSessao({ sessaoId, nota }: { sessaoId: string; nota: string | null }) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Observacao, unknown, { note: string | null }>({
    resolver: zodResolver(observacaoSchema),
    defaultValues: { note: nota ?? "" },
  });

  const finalizar = handleSubmit(async (dados) => {
    const resultado = await finalizarSessao(sessaoId, dados);
    if (resultado) setError("root", { message: resultado.erro });
  });

  return (
    <form onSubmit={finalizar} noValidate className="flex flex-col gap-3 border-t pt-6">
      <div className="flex flex-col gap-1">
        <Label htmlFor="observacao">Observação da sessão (opcional)</Label>
        <Textarea id="observacao" placeholder="Ex.: 15 min de esteira" {...register("note")} />
        {errors.note && <p className="text-sm text-destructive">{errors.note.message}</p>}
      </div>
      {errors.root && (
        <p role="alert" className="text-sm text-destructive">
          {errors.root.message}
        </p>
      )}
      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? "Finalizando…" : "Finalizar treino"}
      </Button>
    </form>
  );
}
