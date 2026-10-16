import type { NextRequest } from "next/server";
import { protegerRotas } from "@/lib/supabase/sessao-no-proxy";

export function proxy(request: NextRequest) {
  return protegerRotas(request);
}

export const config = {
  matcher: [
    // Tudo, menos arquivos estáticos, manifest e ícones (precisam abrir sem login para instalar).
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icon|apple-icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
