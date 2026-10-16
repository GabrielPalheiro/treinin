import { criarClienteServidor } from "@/lib/supabase/servidor";
import type { Tables } from "@/lib/supabase/database.types";

export type Exercise = Pick<Tables<"exercises">, "id" | "name">;

/** Catálogo do usuário logado. O RLS garante que só vêm os exercícios dele. */
export async function listarExercicios(): Promise<Exercise[]> {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.from("exercises").select("id, name");
  if (error) throw error;
  return data;
}
