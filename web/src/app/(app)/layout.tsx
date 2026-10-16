import { Suspense } from "react";
import { BarraDeNavegacao, NavegacaoInferior } from "./navegacao-inferior";

export default function LayoutDoApp({ children }: LayoutProps<"/">) {
  return (
    <>
      <div className="mx-auto flex w-full max-w-app flex-1 flex-col px-4 pt-6 pb-com-nav">
        {children}
      </div>
      <Suspense fallback={<BarraDeNavegacao caminho={null} />}>
        <NavegacaoInferior />
      </Suspense>
    </>
  );
}
