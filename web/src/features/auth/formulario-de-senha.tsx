"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { alterarSenha } from "./acoes";
import { novaSenhaSchema, type NovaSenha } from "./nova-senha";

/** Nova senha digitada duas vezes. Sem a senha atual: quem está logado já provou quem é. */
export function FormularioDeSenha() {
  const [alterada, setAlterada] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<NovaSenha>({
    resolver: zodResolver(novaSenhaSchema),
    defaultValues: { senha: "", confirmacao: "" },
  });

  const enviar = handleSubmit(async (dados) => {
    setAlterada(false);
    const resultado = await alterarSenha(dados);
    if (resultado) {
      setError("root", { message: resultado.erro });
      return;
    }
    reset();
    setAlterada(true);
  });

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-5" aria-labelledby="titulo-senha">
      <h2 id="titulo-senha" className="text-lg font-semibold">
        Alterar senha
      </h2>

      <div className="flex flex-col gap-2">
        <Label htmlFor="nova-senha">Nova senha</Label>
        <Input
          id="nova-senha"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.senha)}
          aria-describedby={errors.senha ? "nova-senha-erro" : undefined}
          {...register("senha", { onChange: () => setAlterada(false) })}
        />
        {errors.senha && (
          <p id="nova-senha-erro" className="text-sm text-destructive">
            {errors.senha.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="confirmacao">Repita a nova senha</Label>
        <Input
          id="confirmacao"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.confirmacao)}
          aria-describedby={errors.confirmacao ? "confirmacao-erro" : undefined}
          {...register("confirmacao")}
        />
        {errors.confirmacao && (
          <p id="confirmacao-erro" className="text-sm text-destructive">
            {errors.confirmacao.message}
          </p>
        )}
      </div>

      {errors.root && (
        <p role="alert" className="text-sm text-destructive">
          {errors.root.message}
        </p>
      )}
      {alterada && (
        <p role="status" className="text-sm text-primary">
          Senha alterada.
        </p>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Salvando…" : "Salvar nova senha"}
      </Button>
    </form>
  );
}
