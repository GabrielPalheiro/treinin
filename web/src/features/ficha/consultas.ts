import { criarClienteParaLeitura } from "@/lib/supabase/servidor";
import type { Tables } from "@/lib/supabase/database.types";
import { id as idSchema } from "./ficha-schema";

// O RLS garante que toda consulta só enxerga dados do usuário logado.

export type Exercise = Pick<Tables<"exercises">, "id" | "name">;

type WorkoutPlanRow = Tables<"workout_plans">;
export type WorkoutPlan = Pick<WorkoutPlanRow, "id" | "name" | "active" | "archived_at">;
export type WorkoutTemplate = Pick<Tables<"workout_templates">, "id" | "name" | "position">;
export type PlannedExercise = Pick<
  Tables<"planned_exercises">,
  "id" | "position" | "target_sets" | "rep_min" | "rep_max" | "technique"
> & { exercise: Exercise };

export async function listarExercicios(): Promise<Exercise[]> {
  const supabase = await criarClienteParaLeitura();
  const { data, error } = await supabase.from("exercises").select("id, name");
  if (error) throw error;
  return data;
}

/** Ativa primeiro, depois inativas, depois arquivadas; dentro de cada grupo, as mais novas antes. */
export async function listarFichas(): Promise<WorkoutPlan[]> {
  const supabase = await criarClienteParaLeitura();
  const { data, error } = await supabase
    .from("workout_plans")
    .select("id, name, active, archived_at")
    .order("active", { ascending: false })
    .order("archived_at", { ascending: false, nullsFirst: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export type FichaComTreinos = WorkoutPlan & {
  treinos: (WorkoutTemplate & { quantidadeDeExercicios: number })[];
};

export async function buscarFicha(fichaId: string): Promise<FichaComTreinos | null> {
  if (!idSchema.safeParse(fichaId).success) return null;
  const supabase = await criarClienteParaLeitura();
  const { data, error } = await supabase
    .from("workout_plans")
    .select("id, name, active, archived_at, workout_templates(id, name, position, planned_exercises(count))")
    .eq("id", fichaId)
    .order("position", { referencedTable: "workout_templates" })
    .maybeSingle();
  if (error) throw error;
  return data && paraFichaComTreinos(data);
}

export async function buscarFichaAtiva(): Promise<FichaComTreinos | null> {
  const supabase = await criarClienteParaLeitura();
  const { data, error } = await supabase
    .from("workout_plans")
    .select("id, name, active, archived_at, workout_templates(id, name, position, planned_exercises(count))")
    .eq("active", true)
    .order("position", { referencedTable: "workout_templates" })
    .maybeSingle();
  if (error) throw error;
  return data && paraFichaComTreinos(data);
}

type FichaDoBanco = WorkoutPlan & {
  workout_templates: (WorkoutTemplate & { planned_exercises: { count: number }[] })[];
};

function paraFichaComTreinos({ workout_templates, ...ficha }: FichaDoBanco): FichaComTreinos {
  return {
    ...ficha,
    treinos: workout_templates.map(({ planned_exercises, ...treino }) => ({
      ...treino,
      quantidadeDeExercicios: planned_exercises[0]?.count ?? 0,
    })),
  };
}

export type TreinoComPrescricao = WorkoutTemplate & {
  ficha: Pick<WorkoutPlan, "id" | "name" | "archived_at">;
  exercicios: PlannedExercise[];
};

export async function buscarTreino(treinoId: string): Promise<TreinoComPrescricao | null> {
  if (!idSchema.safeParse(treinoId).success) return null;
  const supabase = await criarClienteParaLeitura();
  const { data, error } = await supabase
    .from("workout_templates")
    .select(
      `id, name, position,
       workout_plans!inner(id, name, archived_at),
       planned_exercises(id, position, target_sets, rep_min, rep_max, technique, exercises!inner(id, name))`,
    )
    .eq("id", treinoId)
    .order("position", { referencedTable: "planned_exercises" })
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const { workout_plans, planned_exercises, ...treino } = data;
  return {
    ...treino,
    ficha: workout_plans,
    exercicios: planned_exercises.map(({ exercises, ...prescrito }) => ({
      ...prescrito,
      exercise: exercises,
    })),
  };
}
