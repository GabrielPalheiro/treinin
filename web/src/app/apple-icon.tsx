import { ImageResponse } from "next/og";
import { DesenhoDoIcone } from "./desenho-do-icone";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function IconeApple() {
  return new ImageResponse(<DesenhoDoIcone lado={size.width} />, size);
}
