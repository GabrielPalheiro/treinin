import { totalDoDia, type Meal } from "@/domain/dieta/registro";
import type { Data } from "@/domain/tempo/hoje";
import { criarClienteParaLeitura } from "@/lib/supabase/servidor";

// O RLS garante que toda consulta só enxerga dados do usuário logado (e a TACO, em foods).

export type Alimento = { id: string; name: string; kcal_per_100g: number };

export type RegistroDaRefeicao = {
  id: string;
  meal: Meal;
  grams: number;
  kcal: number;
  food: Alimento;
};

/** kcal já registradas na data: a soma dos snapshots. */
export async function totalDaData(data: Data): Promise<number> {
  const supabase = await criarClienteParaLeitura();
  const { data: registros, error } = await supabase.from("meal_entries").select("kcal").eq("date", data);
  if (error) throw error;
  return totalDoDia(registros);
}

/** Os alimentos que o usuário cadastrou (`Custom`), em ordem alfabética. */
export async function listarAlimentosProprios(): Promise<Alimento[]> {
  const supabase = await criarClienteParaLeitura();
  const { data, error } = await supabase
    .from("foods")
    .select("id, name, kcal_per_100g")
    .eq("source", "Custom")
    .order("name");
  if (error) throw error;
  return data;
}

export type DiaDaDieta = {
  registros: RegistroDaRefeicao[];
  alimentos: Alimento[];
  /** Quantas vezes cada alimento foi registrado, por id: "mais usados primeiro" na busca. */
  usos: Record<string, number>;
};

// "Mais usados" olha os registros mais recentes: o que se come hoje pesa mais que o de meses atrás.
// Também fica dentro do limite de linhas por resposta do PostgREST (max_rows = 1000).
const REGISTROS_PARA_CONTAR_USOS = 1000;

export async function carregarDiaDaDieta(data: Data): Promise<DiaDaDieta> {
  const supabase = await criarClienteParaLeitura();

  const [registros, alimentos, recentes] = await Promise.all([
    supabase
      .from("meal_entries")
      .select("id, meal, grams, kcal, foods!inner(id, name, kcal_per_100g)")
      .eq("date", data)
      .order("created_at"),
    // TACO (593) + alimentos próprios: cabem numa resposta; a busca filtra no cliente (decisão 012).
    supabase.from("foods").select("id, name, kcal_per_100g").order("name"),
    supabase
      .from("meal_entries")
      .select("food_id")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(REGISTROS_PARA_CONTAR_USOS),
  ]);
  for (const { error } of [registros, alimentos, recentes]) if (error) throw error;

  const usos: Record<string, number> = {};
  for (const { food_id } of recentes.data ?? []) usos[food_id] = (usos[food_id] ?? 0) + 1;

  return {
    registros: (registros.data ?? []).map((r) => ({
      id: r.id,
      meal: r.meal,
      grams: r.grams,
      kcal: r.kcal,
      food: r.foods,
    })),
    alimentos: alimentos.data ?? [],
    usos,
  };
}

/** A meta diária de kcal do usuário (`DietGoal`), ou nulo se ainda não definiu. */
export async function buscarMeta(): Promise<number | null> {
  const supabase = await criarClienteParaLeitura();
  const { data, error } = await supabase.from("diet_goals").select("daily_kcal").maybeSingle();
  if (error) throw error;
  return data?.daily_kcal ?? null;
}
