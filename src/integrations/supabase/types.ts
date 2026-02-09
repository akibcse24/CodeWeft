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
      api_keys: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          revoked_at: string | null
          scopes: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          revoked_at?: string | null
          scopes?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          revoked_at?: string | null
          scopes?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      backup_schedules: {
        Row: {
          backup_retention_days: number | null
          created_at: string | null
          cron_expression: string
          id: string
          is_active: boolean | null
          last_run_at: string | null
          next_run_at: string | null
          repository_ids: string[]
          schedule_name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          backup_retention_days?: number | null
          created_at?: string | null
          cron_expression: string
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          next_run_at?: string | null
          repository_ids: string[]
          schedule_name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          backup_retention_days?: number | null
          created_at?: string | null
          cron_expression?: string
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          next_run_at?: string | null
          repository_ids?: string[]
          schedule_name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      comment_reactions: {
        Row: {
          comment_id: string
          created_at: string | null
          emoji: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          emoji: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          emoji?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "page_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      course_assignments: {
        Row: {
          course_id: string
          created_at: string
          id: string
          is_completed: boolean | null
          name: string
          score: number | null
          updated_at: string
          user_id: string
          weight: number
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          is_completed?: boolean | null
          name: string
          score?: number | null
          updated_at?: string
          user_id: string
          weight: number
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          is_completed?: boolean | null
          name?: string
          score?: number | null
          updated_at?: string
          user_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "course_assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          code: string | null
          color: string | null
          created_at: string
          credits: number | null
          grade: string | null
          icon: string | null
          id: string
          name: string | null
          notes: string | null
          progress: number | null
          semester: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          code?: string | null
          color?: string | null
          created_at?: string
          credits?: number | null
          grade?: string | null
          icon?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          progress?: number | null
          semester?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          code?: string | null
          color?: string | null
          created_at?: string
          credits?: number | null
          grade?: string | null
          icon?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          progress?: number | null
          semester?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      database_cells: {
        Row: {
          cached_formula_value: Json | null
          created_at: string | null
          formula_error: string | null
          formula_last_calculated: string | null
          id: string
          property_id: string
          relation_ids: string[] | null
          row_id: string
          updated_at: string | null
          value: string | null
          values_array: string[] | null
        }
        Insert: {
          cached_formula_value?: Json | null
          created_at?: string | null
          formula_error?: string | null
          formula_last_calculated?: string | null
          id?: string
          property_id: string
          relation_ids?: string[] | null
          row_id: string
          updated_at?: string | null
          value?: string | null
          values_array?: string[] | null
        }
        Update: {
          cached_formula_value?: Json | null
          created_at?: string | null
          formula_error?: string | null
          formula_last_calculated?: string | null
          id?: string
          property_id?: string
          relation_ids?: string[] | null
          row_id?: string
          updated_at?: string | null
          value?: string | null
          values_array?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "database_cells_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "database_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "database_cells_row_id_fkey"
            columns: ["row_id"]
            isOneToOne: false
            referencedRelation: "database_rows"
            referencedColumns: ["id"]
          },
        ]
      }
      database_properties: {
        Row: {
          created_at: string | null
          default_value: string | null
          formula_dependencies: Json | null
          formula_expression: string | null
          id: string
          is_required: boolean | null
          is_unique: boolean | null
          name: string
          options: Json | null
          order_index: number | null
          page_id: string
          property_type: string
          updated_at: string | null
          width: number | null
        }
        Insert: {
          created_at?: string | null
          default_value?: string | null
          formula_dependencies?: Json | null
          formula_expression?: string | null
          id?: string
          is_required?: boolean | null
          is_unique?: boolean | null
          name: string
          options?: Json | null
          order_index?: number | null
          page_id: string
          property_type: string
          updated_at?: string | null
          width?: number | null
        }
        Update: {
          created_at?: string | null
          default_value?: string | null
          formula_dependencies?: Json | null
          formula_expression?: string | null
          id?: string
          is_required?: boolean | null
          is_unique?: boolean | null
          name?: string
          options?: Json | null
          order_index?: number | null
          page_id?: string
          property_type?: string
          updated_at?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "database_properties_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      database_property_options: {
        Row: {
          color: string | null
          icon: string | null
          id: string
          order_index: number | null
          property_id: string
          value: string
        }
        Insert: {
          color?: string | null
          icon?: string | null
          id?: string
          order_index?: number | null
          property_id: string
          value: string
        }
        Update: {
          color?: string | null
          icon?: string | null
          id?: string
          order_index?: number | null
          property_id?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "database_property_options_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "database_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      database_rows: {
        Row: {
          created_at: string | null
          id: string
          page_id: string
          row_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          page_id: string
          row_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          page_id?: string
          row_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "database_rows_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      database_views: {
        Row: {
          column_widths: Json | null
          created_at: string | null
          filter_config: Json | null
          group_by_property_id: string | null
          id: string
          name: string
          page_id: string
          sort_config: Json | null
          updated_at: string | null
          view_order: number | null
          view_type: string
          visible_properties: string[] | null
        }
        Insert: {
          column_widths?: Json | null
          created_at?: string | null
          filter_config?: Json | null
          group_by_property_id?: string | null
          id?: string
          name?: string
          page_id: string
          sort_config?: Json | null
          updated_at?: string | null
          view_order?: number | null
          view_type: string
          visible_properties?: string[] | null
        }
        Update: {
          column_widths?: Json | null
          created_at?: string | null
          filter_config?: Json | null
          group_by_property_id?: string | null
          id?: string
          name?: string
          page_id?: string
          sort_config?: Json | null
          updated_at?: string | null
          view_order?: number | null
          view_type?: string
          visible_properties?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "database_views_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      deleted_pages: {
        Row: {
          content: Json | null
          cover_url: string | null
          created_at: string
          deleted_at: string
          deleted_by: string
          icon: string | null
          id: string
          metadata: Json | null
          original_parent_id: string | null
          permanently_delete_at: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: Json | null
          cover_url?: string | null
          created_at?: string
          deleted_at?: string
          deleted_by: string
          icon?: string | null
          id?: string
          metadata?: Json | null
          original_parent_id?: string | null
          permanently_delete_at?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: Json | null
          cover_url?: string | null
          created_at?: string
          deleted_at?: string
          deleted_by?: string
          icon?: string | null
          id?: string
          metadata?: Json | null
          original_parent_id?: string | null
          permanently_delete_at?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deleted_pages_original_parent_id_fkey"
            columns: ["original_parent_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
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
          card_type: string | null
          created_at: string
          deck_id: string
          ease_factor: number | null
          front: string
          id: string
          interval: number | null
          interval_days: number | null
          last_reviewed_at: string | null
          next_review: string | null
          next_review_date: string | null
          repetitions: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          back: string
          card_type?: string | null
          created_at?: string
          deck_id: string
          ease_factor?: number | null
          front: string
          id?: string
          interval?: number | null
          interval_days?: number | null
          last_reviewed_at?: string | null
          next_review?: string | null
          next_review_date?: string | null
          repetitions?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          back?: string
          card_type?: string | null
          created_at?: string
          deck_id?: string
          ease_factor?: number | null
          front?: string
          id?: string
          interval?: number | null
          interval_days?: number | null
          last_reviewed_at?: string | null
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
      github_backups: {
        Row: {
          backup_name: string
          backup_type: string | null
          compressed: boolean | null
          created_at: string | null
          file_count: number | null
          id: string
          metadata: Json | null
          repository_ids: string[]
          size_bytes: number | null
          storage_path: string
          user_id: string
        }
        Insert: {
          backup_name: string
          backup_type?: string | null
          compressed?: boolean | null
          created_at?: string | null
          file_count?: number | null
          id?: string
          metadata?: Json | null
          repository_ids: string[]
          size_bytes?: number | null
          storage_path: string
          user_id: string
        }
        Update: {
          backup_name?: string
          backup_type?: string | null
          compressed?: boolean | null
          created_at?: string | null
          file_count?: number | null
          id?: string
          metadata?: Json | null
          repository_ids?: string[]
          size_bytes?: number | null
          storage_path?: string
          user_id?: string
        }
        Relationships: []
      }
      github_rate_limits: {
        Row: {
          remaining: number
          reset_at: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          remaining?: number
          reset_at?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          remaining?: number
          reset_at?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
          completed_at: string | null
          completed_date: string
          created_at: string
          habit_id: string
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_date: string
          created_at?: string
          habit_id: string
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_date?: string
          created_at?: string
          habit_id?: string
          id?: string
          updated_at?: string | null
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
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          habit_id: string
          id?: string
          notes?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          habit_id?: string
          id?: string
          notes?: string | null
          updated_at?: string | null
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
          current_streak: number | null
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
          current_streak?: number | null
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
          current_streak?: number | null
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
          content: Json | null
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
          content?: Json | null
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
          content?: Json | null
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
      oauth_applications: {
        Row: {
          client_id: string
          client_secret: string
          created_at: string
          description: string | null
          icon_url: string | null
          id: string
          is_active: boolean
          name: string
          redirect_uris: string[]
          scopes: string[]
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          client_id: string
          client_secret: string
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean
          name: string
          redirect_uris?: string[]
          scopes?: string[]
          updated_at?: string
          user_id: string
          website_url?: string | null
        }
        Update: {
          client_id?: string
          client_secret?: string
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean
          name?: string
          redirect_uris?: string[]
          scopes?: string[]
          updated_at?: string
          user_id?: string
          website_url?: string | null
        }
        Relationships: []
      }
      page_backlinks: {
        Row: {
          created_at: string | null
          id: string
          source_page_id: string
          target_page_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          source_page_id: string
          target_page_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          source_page_id?: string
          target_page_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_backlinks_source_page_id_fkey"
            columns: ["source_page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_backlinks_target_page_id_fkey"
            columns: ["target_page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      page_comments: {
        Row: {
          block_id: string | null
          content: string
          created_at: string | null
          id: string
          mentions: string[] | null
          page_id: string
          parent_id: string | null
          resolved_at: string | null
          resolved_by: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          block_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          mentions?: string[] | null
          page_id: string
          parent_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          block_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          mentions?: string[] | null
          page_id?: string
          parent_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_comments_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "page_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      page_presence: {
        Row: {
          created_at: string
          cursor_block_id: string | null
          cursor_offset: number | null
          cursor_position: Json | null
          id: string
          is_active: boolean
          last_seen_at: string
          page_id: string
          selected_blocks: Json | null
          user_avatar_url: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          created_at?: string
          cursor_block_id?: string | null
          cursor_offset?: number | null
          cursor_position?: Json | null
          id?: string
          is_active?: boolean
          last_seen_at?: string
          page_id: string
          selected_blocks?: Json | null
          user_avatar_url?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          created_at?: string
          cursor_block_id?: string | null
          cursor_offset?: number | null
          cursor_position?: Json | null
          id?: string
          is_active?: boolean
          last_seen_at?: string
          page_id?: string
          selected_blocks?: Json | null
          user_avatar_url?: string | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "page_presence_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      page_templates: {
        Row: {
          category: string | null
          content: Json | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_default: boolean | null
          name: string
          updated_at: string | null
          usage_count: number | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          content?: Json | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          content?: Json | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      page_versions: {
        Row: {
          content: Json | null
          cover_url: string | null
          created_at: string | null
          icon: string | null
          id: string
          page_id: string
          tags: string[] | null
          title: string
          user_id: string
          version_number: number
        }
        Insert: {
          content?: Json | null
          cover_url?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          page_id: string
          tags?: string[] | null
          title: string
          user_id: string
          version_number: number
        }
        Update: {
          content?: Json | null
          cover_url?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          page_id?: string
          tags?: string[] | null
          title?: string
          user_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "page_versions_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
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
          search_content: string | null
          search_vector: unknown
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
          search_content?: string | null
          search_vector?: unknown
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
          search_content?: string | null
          search_vector?: unknown
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
      paper_drafts: {
        Row: {
          abstract: string | null
          bib_key: string | null
          created_at: string
          id: string
          manuscript_url: string | null
          page_id: string | null
          repo_url: string | null
          status: string | null
          target_venue: string | null
          title: string
          updated_at: string
          user_id: string
          venue_deadline: string | null
        }
        Insert: {
          abstract?: string | null
          bib_key?: string | null
          created_at?: string
          id?: string
          manuscript_url?: string | null
          page_id?: string | null
          repo_url?: string | null
          status?: string | null
          target_venue?: string | null
          title: string
          updated_at?: string
          user_id: string
          venue_deadline?: string | null
        }
        Update: {
          abstract?: string | null
          bib_key?: string | null
          created_at?: string
          id?: string
          manuscript_url?: string | null
          page_id?: string | null
          repo_url?: string | null
          status?: string | null
          target_venue?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          venue_deadline?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "paper_drafts_page_id_fkey"
            columns: ["page_id"]
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
          bibtex: string | null
          created_at: string
          id: string
          notes: string | null
          progress_percentage: number | null
          publication_year: number | null
          status: string | null
          summary: string | null
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
          bibtex?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          progress_percentage?: number | null
          publication_year?: number | null
          status?: string | null
          summary?: string | null
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
          bibtex?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          progress_percentage?: number | null
          publication_year?: number | null
          status?: string | null
          summary?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      pomodoro_sessions: {
        Row: {
          completed_at: string | null
          course_id: string | null
          created_at: string
          duration_minutes: number
          id: string
          session_type: string
          started_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id?: string | null
          created_at?: string
          duration_minutes: number
          id?: string
          session_type: string
          started_at: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string | null
          created_at?: string
          duration_minutes?: number
          id?: string
          session_type?: string
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pomodoro_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          timezone: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          timezone?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          timezone?: string | null
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
          end_date: string | null
          github_forks: number | null
          github_language: string | null
          github_open_issues: number | null
          github_stars: number | null
          github_url: string | null
          github_watchers: number | null
          id: string
          last_commit_at: string | null
          last_commit_message: string | null
          name: string
          progress: number | null
          start_date: string | null
          status: string | null
          tech_stack: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          github_forks?: number | null
          github_language?: string | null
          github_open_issues?: number | null
          github_stars?: number | null
          github_url?: string | null
          github_watchers?: number | null
          id?: string
          last_commit_at?: string | null
          last_commit_message?: string | null
          name: string
          progress?: number | null
          start_date?: string | null
          status?: string | null
          tech_stack?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          github_forks?: number | null
          github_language?: string | null
          github_open_issues?: number | null
          github_stars?: number | null
          github_url?: string | null
          github_watchers?: number | null
          id?: string
          last_commit_at?: string | null
          last_commit_message?: string | null
          name?: string
          progress?: number | null
          start_date?: string | null
          status?: string | null
          tech_stack?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      research_venues: {
        Row: {
          abbreviation: string | null
          conference_date: string | null
          created_at: string
          deadline_date: string | null
          description: string | null
          id: string
          name: string
          tags: string[] | null
          website_url: string | null
        }
        Insert: {
          abbreviation?: string | null
          conference_date?: string | null
          created_at?: string
          deadline_date?: string | null
          description?: string | null
          id?: string
          name: string
          tags?: string[] | null
          website_url?: string | null
        }
        Update: {
          abbreviation?: string | null
          conference_date?: string | null
          created_at?: string
          deadline_date?: string | null
          description?: string | null
          id?: string
          name?: string
          tags?: string[] | null
          website_url?: string | null
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
      study_goals: {
        Row: {
          created_at: string
          current_value: number | null
          goal_type: string
          id: string
          is_active: boolean | null
          period: string | null
          target_value: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_value?: number | null
          goal_type: string
          id?: string
          is_active?: boolean | null
          period?: string | null
          target_value: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_value?: number | null
          goal_type?: string
          id?: string
          is_active?: boolean | null
          period?: string | null
          target_value?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          category: string | null
          completed_at: string | null
          course_id: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          is_recurring: boolean | null
          parent_task_id: string | null
          priority: string | null
          recurrence_pattern: string | null
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          completed_at?: string | null
          course_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_recurring?: boolean | null
          parent_task_id?: string | null
          priority?: string | null
          recurrence_pattern?: string | null
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          completed_at?: string | null
          course_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_recurring?: boolean | null
          parent_task_id?: string | null
          priority?: string | null
          recurrence_pattern?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      vectors: {
        Row: {
          content: string
          created_at: string | null
          embedding: string | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      webhooks: {
        Row: {
          created_at: string
          events: string[]
          id: string
          is_active: boolean
          name: string
          secret: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          events?: string[]
          id?: string
          is_active?: boolean
          name: string
          secret: string
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          events?: string[]
          id?: string
          is_active?: boolean
          name?: string
          secret?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      extract_text_from_blocks: { Args: { blocks: Json }; Returns: string }
      generate_random_avatar: { Args: { user_email: string }; Returns: string }
      search_pages: {
        Args: {
          page_limit?: number
          page_offset?: number
          search_query: string
          user_uuid?: string
        }
        Returns: {
          icon: string
          id: string
          parent_id: string
          rank: number
          title: string
          updated_at: string
        }[]
      }
      upsert_page_presence: {
        Args: {
          p_cursor_block_id?: string
          p_cursor_offset?: number
          p_page_id: string
          p_user_avatar_url?: string
          p_user_id: string
          p_user_name?: string
        }
        Returns: undefined
      }
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
