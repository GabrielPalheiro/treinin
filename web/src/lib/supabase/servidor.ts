import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { supabaseChavePublica, supabaseUrl } from "./config";
import type { Database } from "./database.types";

/**
 * Para consultas em Server Components. O cliente lê o relógio (`Date.now()`) ao carregar a
 * sessão, o que o Next recusa no prerender do prefetch (partialPrefetching): `connection()`
 * deixa a leitura só para a hora da requisição.
 */
export async function criarClienteParaLeitura() {
  await connection();
  return criarClienteServidor();
}

/** Cliente do Supabase para Server Components e Server Actions. Um por requisição. */
export async function criarClienteServidor() {
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseChavePublica, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesParaGravar) {
        try {
          for (const { name, value, options } of cookiesParaGravar) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components não gravam cookies; o proxy já renovou a sessão.
        }
      },
    },
  });
}
