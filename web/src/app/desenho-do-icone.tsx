import { CORES_DO_TEMA } from "./cores-do-tema";

/**
 * Ícone provisório: "T" sobre a cor primária, ocupando o quadro inteiro.
 * A letra fica dentro dos 80% centrais, então também serve como ícone "maskable".
 */
export function DesenhoDoIcone({ lado }: { lado: number }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: CORES_DO_TEMA.primaria,
        color: CORES_DO_TEMA.primariaTexto,
        fontSize: lado * 0.62,
        fontWeight: 700,
        lineHeight: 1,
      }}
    >
      T
    </div>
  );
}
