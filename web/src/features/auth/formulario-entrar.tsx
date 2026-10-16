"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { entrar } from "./acoes";
import { credenciaisSchema, type Credenciais } from "./credenciais";

export function FormularioEntrar() {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Credenciais>({
    resolver: zodResolver(credenciaisSchema),
    defaultValues: { email: "", senha: "" },
  });

  const enviar = handleSubmit(async (dados) => {
    const resultado = await entrar(dados);
    if (resultado) {
      setError("root", { message: resultado.erro });
    }
  });

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="username"
          autoCapitalize="none"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-erro" : undefined}
          {...register("email")}
        />
        {errors.email && (
          <p id="email-erro" className="text-sm text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="senha">Senha</Label>
        <Input
          id="senha"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(errors.senha)}
          aria-describedby={errors.senha ? "senha-erro" : undefined}
          {...register("senha")}
        />
        {errors.senha && (
          <p id="senha-erro" className="text-sm text-destructive">
            {errors.senha.message}
          </p>
        )}
      </div>

      {errors.root && (
        <p role="alert" className="text-sm text-destructive">
          {errors.root.message}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
