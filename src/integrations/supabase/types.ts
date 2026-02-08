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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      courses: {
        Row: {
          code: string | null
          color: string | null
          created_at: string
          credits: number | null
          description: string | null
          grade: string | null
          id: string
          name: string | null
          notes: string | null
          platform: string | null
          progress: number | null
          semester: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          code?: string | null
          color?: string | null
          created_at?: string
          credits?: number | null
          description?: string | null
          grade?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          platform?: string | null
          progress?: number | null
          semester?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          code?: string | null
          color?: string | null
          created_at?: string
          credits?: number | null
          description?: string | null
          grade?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          platform?: string | null
          progress?: number | null
          semester?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      dsa_problems: {
        Row: {
          companies: string[] | null
          created_at: string
          difficulty: string | null
          id: string
          last_reviewed: string | null
          next_review_date: string | null
          notes: string | null
          patterns: string[] | null
          platform: string | null
          review_count: number | null
          solution: string | null
          solution_notes: string | null
          solved_at: string | null
          space_complexity: string | null
          status: string | null
          time_complexity: string | null
          title: string
          topics: string[] | null
          understanding_rating: number | null
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          companies?: string[] | null
          created_at?: string
          difficulty?: string | null
          id?: string
          last_reviewed?: string | null
          next_review_date?: string | null
          notes?: string | null
          patterns?: string[] | null
          platform?: string | null
          review_count?: number | null
          solution?: string | null
          solution_notes?: string | null
          solved_at?: string | null
          space_complexity?: string | null
          status?: string | null
          time_complexity?: string | null
          title: string
          topics?: string[] | null
          understanding_rating?: number | null
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          companies?: string[] | null
          created_at?: string
          difficulty?: string | null
          id?: string
          last_reviewed?: string | null
          next_review_date?: string | null
          notes?: string | null
          patterns?: string[] | null
          platform?: string | null
          review_count?: number | null
          solution?: string | null
          solution_notes?: string | null
          solved_at?: string | null
          space_complexity?: string | null
          status?: string | null
          time_complexity?: string | null
          title?: string
          topics?: string[] | null
          understanding_rating?: number | null
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      flashcard_decks: {
        Row: {
          card_count: number | null
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          card_count?: number | null
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          card_count?: number | null
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      flashcards: {
        Row: {
          back: string
          created_at: string
          deck_id: string
          ease_factor: number | null
          front: string
          id: string
          interval: number | null
          interval_days: number | null
          last_reviewed: string | null
          next_review: string | null
          next_review_date: string | null
          repetitions: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          back: string
          created_at?: string
          deck_id: string
          ease_factor?: number | null
          front: string
          id?: string
          interval?: number | null
          interval_days?: number | null
          last_reviewed?: string | null
          next_review?: string | null
          next_review_date?: string | null
          repetitions?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          back?: string
          created_at?: string
          deck_id?: string
          ease_factor?: number | null
          front?: string
          id?: string
          interval?: number | null
          interval_days?: number | null
          last_reviewed?: string | null
          next_review?: string | null
          next_review_date?: string | null
          repetitions?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "flashcard_decks"
            referencedColumns: ["id"]
          },
        ]
      }
      github_settings: {
        Row: {
          avatar_url: string | null
          created_at: string
          github_installation_id: string | null
          github_token: string | null
          github_username: string | null
          id: string
          solutions_repo: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          github_installation_id?: string | null
          github_token?: string | null
          github_username?: string | null
          id?: string
          solutions_repo?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          github_installation_id?: string | null
          github_token?: string | null
          github_username?: string | null
          id?: string
          solutions_repo?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      habit_completions: {
        Row: {
          completed_at: string
          completed_date: string | null
          created_at: string
          habit_id: string
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string
          completed_date?: string | null
          created_at?: string
          habit_id: string
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string
          completed_date?: string | null
          created_at?: string
          habit_id?: string
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_completions_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_logs: {
        Row: {
          completed_at: string
          created_at: string
          habit_id: string
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          habit_id: string
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          habit_id?: string
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          best_streak: number | null
          color: string | null
          created_at: string
          description: string | null
          frequency: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          longest_streak: number | null
          name: string
          streak: number | null
          target_days: number[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          best_streak?: number | null
          color?: string | null
          created_at?: string
          description?: string | null
          frequency?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          longest_streak?: number | null
          name: string
          streak?: number | null
          target_days?: number[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          best_streak?: number | null
          color?: string | null
          created_at?: string
          description?: string | null
          frequency?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          longest_streak?: number | null
          name?: string
          streak?: number | null
          target_days?: number[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ml_notes: {
        Row: {
          category: string | null
          content: string | null
          created_at: string
          icon: string | null
          id: string
          is_favorite: boolean | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_favorite?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_favorite?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pages: {
        Row: {
          content: Json | null
          cover_url: string | null
          created_at: string
          icon: string | null
          id: string
          is_archived: boolean | null
          is_favorite: boolean | null
          is_public: boolean | null
          parent_id: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: Json | null
          cover_url?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_archived?: boolean | null
          is_favorite?: boolean | null
          is_public?: boolean | null
          parent_id?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: Json | null
          cover_url?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_archived?: boolean | null
          is_favorite?: boolean | null
          is_public?: boolean | null
          parent_id?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      papers: {
        Row: {
          abstract: string | null
          arxiv_id: string | null
          authors: string[] | null
          created_at: string
          id: string
          notes: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          abstract?: string | null
          arxiv_id?: string | null
          authors?: string[] | null
          created_at?: string
          id?: string
          notes?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          abstract?: string | null
          arxiv_id?: string | null
          authors?: string[] | null
          created_at?: string
          id?: string
          notes?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          github_url: string | null
          id: string
          name: string
          progress: number | null
          status: string | null
          tech_stack: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          github_url?: string | null
          id?: string
          name: string
          progress?: number | null
          status?: string | null
          tech_stack?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          github_url?: string | null
          id?: string
          name?: string
          progress?: number | null
          status?: string | null
          tech_stack?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_favorite: boolean | null
          notes: string | null
          rating: number | null
          status: string | null
          tags: string[] | null
          title: string
          type: string | null
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_favorite?: boolean | null
          notes?: string | null
          rating?: number | null
          status?: string | null
          tags?: string[] | null
          title: string
          type?: string | null
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_favorite?: boolean | null
          notes?: string | null
          rating?: number | null
          status?: string | null
          tags?: string[] | null
          title?: string
          type?: string | null
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      secrets_vault: {
        Row: {
          category: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          updated_at: string
          user_id: string
          value: string
          website_url: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          updated_at?: string
          user_id: string
          value: string
          website_url?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
          value?: string
          website_url?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          category: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_random_avatar: { Args: { user_email: string }; Returns: string }
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
