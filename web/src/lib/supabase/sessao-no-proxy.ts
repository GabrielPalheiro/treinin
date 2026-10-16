import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseChavePublica, supabaseUrl } from "./config";
import type { Database } from "./database.types";

const ROTA_ENTRAR = "/entrar";
const ROTA_INICIAL = "/hoje";

/**
 * Renova a sessão do Supabase a cada requisição e protege as rotas do app:
 * sem sessão, tudo vai para /entrar; com sessão, /entrar vai para /hoje.
 */
export async function protegerRotas(request: NextRequest) {
  let resposta = NextResponse.next({ request });
  let cabecalhosDaSessao: Record<string, string> = {};

  const supabase = createServerClient<Database>(supabaseUrl, supabaseChavePublica, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesParaGravar, cabecalhos) {
        for (const { name, value } of cookiesParaGravar) {
          request.cookies.set(name, value);
        }
        resposta = NextResponse.next({ request });
        for (const { name, value, options } of cookiesParaGravar) {
          resposta.cookies.set(name, value, options);
        }
        cabecalhosDaSessao = cabecalhos;
        for (const [nome, valor] of Object.entries(cabecalhos)) {
          resposta.headers.set(nome, valor);
        }
      },
    },
  });

  // getClaims valida o JWT; não confiar só no cookie.
  const { data } = await supabase.auth.getClaims();
  const logado = Boolean(data?.claims);
  const naTelaDeEntrar = request.nextUrl.pathname === ROTA_ENTRAR;

  if (!logado && !naTelaDeEntrar) {
    return redirecionar(request, resposta, cabecalhosDaSessao, ROTA_ENTRAR);
  }
  if (logado && naTelaDeEntrar) {
    return redirecionar(request, resposta, cabecalhosDaSessao, ROTA_INICIAL);
  }
  return resposta;
}

// Leva junto os cookies e cabeçalhos da sessão renovada.
function redirecionar(
  request: NextRequest,
  resposta: NextResponse,
  cabecalhos: Record<string, string>,
  destino: string,
) {
  const url = request.nextUrl.clone();
  url.pathname = destino;
  url.search = "";
  const redirecionamento = NextResponse.redirect(url);
  for (const cookie of resposta.cookies.getAll()) {
    redirecionamento.cookies.set(cookie);
  }
  for (const [nome, valor] of Object.entries(cabecalhos)) {
    redirecionamento.headers.set(nome, valor);
  }
  return redirecionamento;
}
