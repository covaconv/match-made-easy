export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      feedback: {
        Row: {
          created_at: string
          given_by: string
          id: string
          meetup_id: string
          qualitative_notes: string | null
          rating: number
        }
        Insert: {
          created_at?: string
          given_by: string
          id?: string
          meetup_id: string
          qualitative_notes?: string | null
          rating: number
        }
        Update: {
          created_at?: string
          given_by?: string
          id?: string
          meetup_id?: string
          qualitative_notes?: string | null
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "feedback_given_by_fkey"
            columns: ["given_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_meetup_id_fkey"
            columns: ["meetup_id"]
            isOneToOne: false
            referencedRelation: "meetups"
            referencedColumns: ["id"]
          },
        ]
      }
      founder_profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          industry: string
          main_challenge: string
          majors: string[]
          meeting_frequency: string
          startup_name: string
          startup_stage: string
          support_needs: string[]
          three_month_goal: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          industry: string
          main_challenge: string
          majors?: string[]
          meeting_frequency: string
          startup_name: string
          startup_stage: string
          support_needs?: string[]
          three_month_goal: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          industry?: string
          main_challenge?: string
          majors?: string[]
          meeting_frequency?: string
          startup_name?: string
          startup_stage?: string
          support_needs?: string[]
          three_month_goal?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "founder_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meetups: {
        Row: {
          created_at: string
          founder_id: string
          id: string
          mentor_id: string
          status: string
        }
        Insert: {
          created_at?: string
          founder_id: string
          id?: string
          mentor_id: string
          status: string
        }
        Update: {
          created_at?: string
          founder_id?: string
          id?: string
          mentor_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetups_founder_id_fkey"
            columns: ["founder_id"]
            isOneToOne: false
            referencedRelation: "founder_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetups_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_profiles: {
        Row: {
          created_at: string
          current_matches: number
          current_role: string
          experience_background: string[]
          expertise: string[]
          full_name: string
          id: string
          industries: string[]
          majors: string[]
          meeting_frequency: string
          mentoring_capacity: string
          monthly_time: string
          preferred_mentee_stages: string[]
          three_month_outcome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_matches?: number
          current_role: string
          experience_background?: string[]
          expertise?: string[]
          full_name: string
          id: string
          industries?: string[]
          majors?: string[]
          meeting_frequency: string
          mentoring_capacity: string
          monthly_time: string
          preferred_mentee_stages?: string[]
          three_month_outcome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_matches?: number
          current_role?: string
          experience_background?: string[]
          expertise?: string[]
          full_name?: string
          id?: string
          industries?: string[]
          majors?: string[]
          meeting_frequency?: string
          mentoring_capacity?: string
          monthly_time?: string
          preferred_mentee_stages?: string[]
          three_month_outcome?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          role: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          role: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          role?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
