
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "exercise_logs": {
                  Row: {
                    "created_at": string,"exercise_id": string,"id": string,"note": string | null,"planned_exercise_id": string | null,"status": Database["public"]['Enums']["exercise_log_status"],"user_id": string,"workout_session_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"exercise_id": string,"id"?: string,"note"?: string | null,"planned_exercise_id"?: string | null,"status"?: Database["public"]['Enums']["exercise_log_status"],"user_id"?: string,"workout_session_id": string
                  }
                  Update: {
                    "created_at"?: string,"exercise_id"?: string,"id"?: string,"note"?: string | null,"planned_exercise_id"?: string | null,"status"?: Database["public"]['Enums']["exercise_log_status"],"user_id"?: string,"workout_session_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "exercise_logs_exercise_fkey"
      columns: ["exercise_id","user_id"]
isOneToOne: false
      referencedRelation: "exercises"
      referencedColumns: ["id","user_id"]
    },{
      foreignKeyName: "exercise_logs_planned_fkey"
      columns: ["planned_exercise_id","user_id"]
isOneToOne: false
      referencedRelation: "planned_exercises"
      referencedColumns: ["id","user_id"]
    },{
      foreignKeyName: "exercise_logs_session_fkey"
      columns: ["workout_session_id","user_id"]
isOneToOne: false
      referencedRelation: "workout_sessions"
      referencedColumns: ["id","user_id"]
    }
                  ]
                },"exercises": {
                  Row: {
                    "created_at": string,"id": string,"name": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"name": string,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"name"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"planned_exercises": {
                  Row: {
                    "created_at": string,"exercise_id": string,"id": string,"position": number,"rep_max": number,"rep_min": number,"target_sets": number,"technique": string | null,"user_id": string,"workout_template_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"exercise_id": string,"id"?: string,"position": number,"rep_max": number,"rep_min": number,"target_sets": number,"technique"?: string | null,"user_id"?: string,"workout_template_id": string
                  }
                  Update: {
                    "created_at"?: string,"exercise_id"?: string,"id"?: string,"position"?: number,"rep_max"?: number,"rep_min"?: number,"target_sets"?: number,"technique"?: string | null,"user_id"?: string,"workout_template_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "planned_exercises_exercise_fkey"
      columns: ["exercise_id","user_id"]
isOneToOne: false
      referencedRelation: "exercises"
      referencedColumns: ["id","user_id"]
    },{
      foreignKeyName: "planned_exercises_template_fkey"
      columns: ["workout_template_id","user_id"]
isOneToOne: false
      referencedRelation: "workout_templates"
      referencedColumns: ["id","user_id"]
    }
                  ]
                },"set_logs": {
                  Row: {
                    "created_at": string,"exercise_log_id": string,"id": string,"load": number | null,"load_unit": Database["public"]['Enums']["load_unit"],"position": number,"reps": number,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"exercise_log_id": string,"id"?: string,"load"?: number | null,"load_unit": Database["public"]['Enums']["load_unit"],"position": number,"reps": number,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"exercise_log_id"?: string,"id"?: string,"load"?: number | null,"load_unit"?: Database["public"]['Enums']["load_unit"],"position"?: number,"reps"?: number,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "set_logs_exercise_log_fkey"
      columns: ["exercise_log_id","user_id"]
isOneToOne: false
      referencedRelation: "exercise_logs"
      referencedColumns: ["id","user_id"]
    }
                  ]
                },"workout_plans": {
                  Row: {
                    "active": boolean,"archived_at": string | null,"created_at": string,"id": string,"name": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"archived_at"?: string | null,"created_at"?: string,"id"?: string,"name": string,"user_id"?: string
                  }
                  Update: {
                    "active"?: boolean,"archived_at"?: string | null,"created_at"?: string,"id"?: string,"name"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"workout_sessions": {
                  Row: {
                    "created_at": string,"date": string,"finished_at": string | null,"id": string,"note": string | null,"user_id": string,"workout_template_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"date": string,"finished_at"?: string | null,"id"?: string,"note"?: string | null,"user_id"?: string,"workout_template_id"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"date"?: string,"finished_at"?: string | null,"id"?: string,"note"?: string | null,"user_id"?: string,"workout_template_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "workout_sessions_template_fkey"
      columns: ["workout_template_id","user_id"]
isOneToOne: false
      referencedRelation: "workout_templates"
      referencedColumns: ["id","user_id"]
    }
                  ]
                },"workout_templates": {
                  Row: {
                    "created_at": string,"id": string,"name": string,"position": number,"user_id": string,"workout_plan_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"name": string,"position": number,"user_id"?: string,"workout_plan_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"name"?: string,"position"?: number,"user_id"?: string,"workout_plan_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "workout_templates_plan_fkey"
      columns: ["workout_plan_id","user_id"]
isOneToOne: false
      referencedRelation: "workout_plans"
      referencedColumns: ["id","user_id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "activate_workout_plan":
{ Args: { "plan_id": string }; Returns: undefined
                           },
"reorder_planned_exercises":
{ Args: { "planned_exercise_ids": (string)[],"template_id": string }; Returns: undefined
                           },
"reorder_workout_templates":
{ Args: { "plan_id": string,"template_ids": (string)[] }; Returns: undefined
                           }
          }
          Enums: {
            "exercise_log_status": "Done"|"Skipped","load_unit": "Kg"|"Plates"|"Bodyweight"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "exercise_log_status": ["Done", "Skipped"],"load_unit": ["Kg", "Plates", "Bodyweight"]
          }
        }
} as const
