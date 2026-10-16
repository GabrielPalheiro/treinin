import type { MetadataRoute } from "next";
import { CORES_DO_TEMA } from "./cores-do-tema";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TreinIn",
    short_name: "TreinIn",
    description: "Caderno de treino e dieta",
    lang: "pt-BR",
    start_url: "/hoje",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: CORES_DO_TEMA.claro,
    theme_color: CORES_DO_TEMA.claro,
    icons: [
      { src: "/icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
