import { ImageResponse } from "next/og";
import { DesenhoDoIcone } from "./desenho-do-icone";

// Servidos em /icon/32, /icon/192 e /icon/512; os dois maiores vão no manifest.
const LADOS = [32, 192, 512] as const;

export function generateImageMetadata() {
  return LADOS.map((lado) => ({
    id: String(lado),
    size: { width: lado, height: lado },
    contentType: "image/png",
  }));
}

export default async function Icone({ id }: { id: Promise<string | number> }) {
  const lado = Number(await id);
  return new ImageResponse(<DesenhoDoIcone lado={lado} />, { width: lado, height: lado });
}
