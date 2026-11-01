"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil } from "lucide-react";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ResultadoDaAcao } from "@/lib/resultado-da-acao";
import { criarAlimento, editarAlimento } from "./acoes";
import {
  alimentoDoFormularioSchema,
  type AlimentoDoFormulario,
  type NovoAlimento,
} from "./alimento-schema";
import type { Alimento } from "./consultas";
import { formatarNumero } from "./formatar";

// 265.5 → "265,5", como se digita no celular.
const paraTexto = (n: number) => String(n).replace(".", ",");

type Props = { alimentos: Alimento[]; nomeInicial: string };

/** Cadastrar e corrigir os alimentos próprios, os que não estão na TACO. */
export function AlimentosProprios({ alimentos, nomeInicial }: Props) {
  // Muda a key depois de criar: o formulário volta vazio.
  const [criados, setCriados] = useState(0);

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="titulo-novo-alimento" className="flex flex-col gap-3 rounded-lg border bg-card p-4">
        <h2 id="titulo-novo-alimento" className="font-semibold">
          Novo alimento
        </h2>
        <FormularioDeAlimento
          key={criados}
          valores={criados === 0 ? { name: nomeInicial, kcal: "" } : { name: "", kcal: "" }}
          textoDoBotao="Cadastrar"
          acao={async (dados) => {
            const resultado = await criarAlimento(dados);
            if ("erro" in resultado) return resultado;
            setCriados((n) => n + 1);
          }}
        />
      </section>

      <section aria-labelledby="titulo-meus-alimentos" className="flex flex-col gap-2">
        <h2 id="titulo-meus-alimentos" className="text-sm font-medium text-muted-foreground">
          {alimentos.length === 1 ? "1 alimento seu" : `${alimentos.length} alimentos seus`}
        </h2>
        {alimentos.length === 0 ? (
          <p className="text-muted-foreground">
            Nenhum ainda. Cadastre o que não achar na busca: o whey da sua marca, o pão da padaria.
          </p>
        ) : (
          <ul className="flex flex-col divide-y rounded-lg border bg-card">
            {alimentos.map((alimento) => (
              <ItemDoAlimento key={alimento.id} alimento={alimento} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ItemDoAlimento({ alimento }: { alimento: Alimento }) {
  const [editando, setEditando] = useState(false);

  if (editando) {
    return (
      <li className="p-3">
        <FormularioDeAlimento
          valores={{ name: alimento.name, kcal: paraTexto(alimento.kcal_per_100g) }}
          textoDoBotao="Salvar"
          acao={(dados) => editarAlimento({ id: alimento.id, ...dados })}
          aoTerminar={() => setEditando(false)}
        />
        <p className="mt-2 text-sm text-muted-foreground">O que já foi registrado continua com as kcal da época.</p>
      </li>
    );
  }

  return (
    <li className="flex min-h-toque items-center justify-between gap-2 pl-4">
      <span className="flex flex-col py-2">
        <span className="leading-tight">{alimento.name}</span>
        <span className="text-sm text-muted-foreground tabular-nums">
          {formatarNumero(alimento.kcal_per_100g)} kcal/100 g
        </span>
      </span>
      <Button variant="ghost" size="icon" aria-label={`Editar ${alimento.name}`} onClick={() => setEditando(true)}>
        <Pencil aria-hidden />
      </Button>
    </li>
  );
}

type PropsDoFormulario = {
  valores: AlimentoDoFormulario;
  textoDoBotao: string;
  acao: (dados: NovoAlimento) => Promise<ResultadoDaAcao>;
  /** Quando existe, mostra "Cancelar" e é chamado depois de salvar. */
  aoTerminar?: () => void;
};

function FormularioDeAlimento({ valores, textoDoBotao, acao, aoTerminar }: PropsDoFormulario) {
  const prefixo = useId();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AlimentoDoFormulario, unknown, NovoAlimento>({
    resolver: zodResolver(alimentoDoFormularioSchema),
    defaultValues: valores,
  });

  const salvar = handleSubmit(async (dados) => {
    const resultado = await acao(dados);
    if (resultado) setError("root", { message: resultado.erro });
    else aoTerminar?.();
  });

  return (
    <form onSubmit={salvar} noValidate className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <Label htmlFor={`${prefixo}-nome`}>Nome</Label>
        <Input
          id={`${prefixo}-nome`}
          autoComplete="off"
          placeholder="Ex.: Whey da marca X"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? `${prefixo}-nome-erro` : undefined}
          {...register("name")}
        />
        {errors.name && (
          <p id={`${prefixo}-nome-erro`} className="text-sm text-destructive">
            {errors.name.message}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor={`${prefixo}-kcal`}>kcal por 100 g</Label>
        <Input
          id={`${prefixo}-kcal`}
          inputMode="decimal"
          autoComplete="off"
          placeholder="0"
          aria-invalid={Boolean(errors.kcal)}
          aria-describedby={errors.kcal ? `${prefixo}-kcal-erro` : undefined}
          {...register("kcal")}
        />
        {errors.kcal && (
          <p id={`${prefixo}-kcal-erro`} className="text-sm text-destructive">
            {errors.kcal.message}
          </p>
        )}
      </div>

      {errors.root && (
        <p role="alert" className="text-sm text-destructive">
          {errors.root.message}
        </p>
      )}

      <div className={aoTerminar ? "grid grid-cols-2 gap-2" : "grid gap-2"}>
        {aoTerminar && (
          <Button type="button" variant="outline" onClick={aoTerminar}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando…" : textoDoBotao}
        </Button>
      </div>
    </form>
  );
}
