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
      cards: {
        Row: {
          action: string | null
          created_at: string
          definition: string | null
          icon_name: string | null
          id: string
          kpi: string | null
          objective: string | null
          phase: Database["public"]["Enums"]["card_phase"]
          pillar_id: string
          sort_order: number
          step_name: string | null
          subtitle: string | null
          title: string
        }
        Insert: {
          action?: string | null
          created_at?: string
          definition?: string | null
          icon_name?: string | null
          id?: string
          kpi?: string | null
          objective?: string | null
          phase?: Database["public"]["Enums"]["card_phase"]
          pillar_id: string
          sort_order?: number
          step_name?: string | null
          subtitle?: string | null
          title: string
        }
        Update: {
          action?: string | null
          created_at?: string
          definition?: string | null
          icon_name?: string | null
          id?: string
          kpi?: string | null
          objective?: string | null
          phase?: Database["public"]["Enums"]["card_phase"]
          pillar_id?: string
          sort_order?: number
          step_name?: string | null
          subtitle?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "cards_pillar_id_fkey"
            columns: ["pillar_id"]
            isOneToOne: false
            referencedRelation: "pillars"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_analyses: {
        Row: {
          analysis: Json
          created_at: string
          id: string
          template_id: string
          workshop_id: string
        }
        Insert: {
          analysis?: Json
          created_at?: string
          id?: string
          template_id: string
          workshop_id: string
        }
        Update: {
          analysis?: Json
          created_at?: string
          id?: string
          template_id?: string
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_analyses_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "challenge_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_analyses_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_responses: {
        Row: {
          card_id: string
          created_at: string
          format: string
          id: string
          maturity: number
          rank: number
          slot_id: string
          subject_id: string
          user_id: string
          workshop_id: string
        }
        Insert: {
          card_id: string
          created_at?: string
          format?: string
          id?: string
          maturity?: number
          rank?: number
          slot_id: string
          subject_id: string
          user_id: string
          workshop_id: string
        }
        Update: {
          card_id?: string
          created_at?: string
          format?: string
          id?: string
          maturity?: number
          rank?: number
          slot_id?: string
          subject_id?: string
          user_id?: string
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_responses_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_responses_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "challenge_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_responses_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "challenge_subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_responses_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_slots: {
        Row: {
          hint: string | null
          id: string
          label: string
          required: boolean
          slot_type: Database["public"]["Enums"]["challenge_slot_type"]
          sort_order: number
          subject_id: string
        }
        Insert: {
          hint?: string | null
          id?: string
          label: string
          required?: boolean
          slot_type?: Database["public"]["Enums"]["challenge_slot_type"]
          sort_order?: number
          subject_id: string
        }
        Update: {
          hint?: string | null
          id?: string
          label?: string
          required?: boolean
          slot_type?: Database["public"]["Enums"]["challenge_slot_type"]
          sort_order?: number
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_slots_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "challenge_subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_staging: {
        Row: {
          card_id: string
          created_at: string
          format: string
          id: string
          subject_id: string
          user_id: string
          workshop_id: string
        }
        Insert: {
          card_id: string
          created_at?: string
          format?: string
          id?: string
          subject_id: string
          user_id: string
          workshop_id: string
        }
        Update: {
          card_id?: string
          created_at?: string
          format?: string
          id?: string
          subject_id?: string
          user_id?: string
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_staging_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_staging_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "challenge_subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_staging_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_subjects: {
        Row: {
          description: string | null
          id: string
          sort_order: number
          template_id: string
          title: string
          type: Database["public"]["Enums"]["challenge_subject_type"]
        }
        Insert: {
          description?: string | null
          id?: string
          sort_order?: number
          template_id: string
          title: string
          type?: Database["public"]["Enums"]["challenge_subject_type"]
        }
        Update: {
          description?: string | null
          id?: string
          sort_order?: number
          template_id?: string
          title?: string
          type?: Database["public"]["Enums"]["challenge_subject_type"]
        }
        Relationships: [
          {
            foreignKeyName: "challenge_subjects_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "challenge_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_templates: {
        Row: {
          created_at: string
          description: string | null
          difficulty: string | null
          id: string
          name: string
          pillar_id: string | null
          toolkit_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          difficulty?: string | null
          id?: string
          name: string
          pillar_id?: string | null
          toolkit_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          difficulty?: string | null
          id?: string
          name?: string
          pillar_id?: string | null
          toolkit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_templates_pillar_id_fkey"
            columns: ["pillar_id"]
            isOneToOne: false
            referencedRelation: "pillars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_templates_toolkit_id_fkey"
            columns: ["toolkit_id"]
            isOneToOne: false
            referencedRelation: "toolkits"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      game_plan_steps: {
        Row: {
          card_id: string | null
          game_plan_id: string
          id: string
          instruction: string | null
          sort_order: number
          title: string
        }
        Insert: {
          card_id?: string | null
          game_plan_id: string
          id?: string
          instruction?: string | null
          sort_order?: number
          title: string
        }
        Update: {
          card_id?: string | null
          game_plan_id?: string
          id?: string
          instruction?: string | null
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_plan_steps_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_plan_steps_game_plan_id_fkey"
            columns: ["game_plan_id"]
            isOneToOne: false
            referencedRelation: "game_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      game_plans: {
        Row: {
          created_at: string
          description: string | null
          difficulty: string | null
          estimated_minutes: number | null
          id: string
          name: string
          sort_order: number
          toolkit_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          difficulty?: string | null
          estimated_minutes?: number | null
          id?: string
          name: string
          sort_order?: number
          toolkit_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          difficulty?: string | null
          estimated_minutes?: number | null
          id?: string
          name?: string
          sort_order?: number
          toolkit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_plans_toolkit_id_fkey"
            columns: ["toolkit_id"]
            isOneToOne: false
            referencedRelation: "toolkits"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_toolkits: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          max_members: number | null
          organization_id: string
          toolkit_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          max_members?: number | null
          organization_id: string
          toolkit_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          max_members?: number | null
          organization_id?: string
          toolkit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_toolkits_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_toolkits_toolkit_id_fkey"
            columns: ["toolkit_id"]
            isOneToOne: false
            referencedRelation: "toolkits"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          primary_color: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          primary_color?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      pillars: {
        Row: {
          color: string | null
          description: string | null
          icon_name: string | null
          id: string
          name: string
          slug: string
          sort_order: number
          toolkit_id: string
        }
        Insert: {
          color?: string | null
          description?: string | null
          icon_name?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
          toolkit_id: string
        }
        Update: {
          color?: string | null
          description?: string | null
          icon_name?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          toolkit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pillars_toolkit_id_fkey"
            columns: ["toolkit_id"]
            isOneToOne: false
            referencedRelation: "toolkits"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      quiz_questions: {
        Row: {
          id: string
          options: Json
          pillar_id: string
          question: string
          sort_order: number
        }
        Insert: {
          id?: string
          options?: Json
          pillar_id: string
          question: string
          sort_order?: number
        }
        Update: {
          id?: string
          options?: Json
          pillar_id?: string
          question?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_pillar_id_fkey"
            columns: ["pillar_id"]
            isOneToOne: false
            referencedRelation: "pillars"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_results: {
        Row: {
          created_at: string
          id: string
          scores: Json
          toolkit_id: string
          total_score: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          scores?: Json
          toolkit_id: string
          total_score?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          scores?: Json
          toolkit_id?: string
          total_score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_results_toolkit_id_fkey"
            columns: ["toolkit_id"]
            isOneToOne: false
            referencedRelation: "toolkits"
            referencedColumns: ["id"]
          },
        ]
      }
      toolkits: {
        Row: {
          created_at: string
          description: string | null
          icon_emoji: string | null
          id: string
          name: string
          slug: string
          status: Database["public"]["Enums"]["toolkit_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon_emoji?: string | null
          id?: string
          name: string
          slug: string
          status?: Database["public"]["Enums"]["toolkit_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon_emoji?: string | null
          id?: string
          name?: string
          slug?: string
          status?: Database["public"]["Enums"]["toolkit_status"]
          updated_at?: string
        }
        Relationships: []
      }
      user_card_progress: {
        Row: {
          card_id: string
          id: string
          is_bookmarked: boolean
          is_viewed: boolean
          user_id: string
          viewed_at: string | null
        }
        Insert: {
          card_id: string
          id?: string
          is_bookmarked?: boolean
          is_viewed?: boolean
          user_id: string
          viewed_at?: string | null
        }
        Update: {
          card_id?: string
          id?: string
          is_bookmarked?: boolean
          is_viewed?: boolean
          user_id?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_card_progress_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      user_credits: {
        Row: {
          balance: number
          id: string
          lifetime_earned: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          id?: string
          lifetime_earned?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          id?: string
          lifetime_earned?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_plan_progress: {
        Row: {
          completed_at: string | null
          current_step: number
          game_plan_id: string
          id: string
          is_completed: boolean
          started_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          current_step?: number
          game_plan_id: string
          id?: string
          is_completed?: boolean
          started_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          current_step?: number
          game_plan_id?: string
          id?: string
          is_completed?: boolean
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_plan_progress_game_plan_id_fkey"
            columns: ["game_plan_id"]
            isOneToOne: false
            referencedRelation: "game_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workshop_canvas_items: {
        Row: {
          card_id: string | null
          color: string | null
          content: Json
          created_at: string
          created_by: string
          from_item_id: string | null
          height: number | null
          id: string
          parent_group_id: string | null
          to_item_id: string | null
          type: Database["public"]["Enums"]["canvas_item_type"]
          updated_at: string
          width: number | null
          workshop_id: string
          x: number
          y: number
          z_index: number
        }
        Insert: {
          card_id?: string | null
          color?: string | null
          content?: Json
          created_at?: string
          created_by: string
          from_item_id?: string | null
          height?: number | null
          id?: string
          parent_group_id?: string | null
          to_item_id?: string | null
          type: Database["public"]["Enums"]["canvas_item_type"]
          updated_at?: string
          width?: number | null
          workshop_id: string
          x?: number
          y?: number
          z_index?: number
        }
        Update: {
          card_id?: string | null
          color?: string | null
          content?: Json
          created_at?: string
          created_by?: string
          from_item_id?: string | null
          height?: number | null
          id?: string
          parent_group_id?: string | null
          to_item_id?: string | null
          type?: Database["public"]["Enums"]["canvas_item_type"]
          updated_at?: string
          width?: number | null
          workshop_id?: string
          x?: number
          y?: number
          z_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "workshop_canvas_items_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workshop_canvas_items_from_item_id_fkey"
            columns: ["from_item_id"]
            isOneToOne: false
            referencedRelation: "workshop_canvas_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workshop_canvas_items_parent_group_id_fkey"
            columns: ["parent_group_id"]
            isOneToOne: false
            referencedRelation: "workshop_canvas_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workshop_canvas_items_to_item_id_fkey"
            columns: ["to_item_id"]
            isOneToOne: false
            referencedRelation: "workshop_canvas_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workshop_canvas_items_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      workshop_comments: {
        Row: {
          canvas_item_id: string
          content: string
          created_at: string
          id: string
          user_id: string
          workshop_id: string
        }
        Insert: {
          canvas_item_id: string
          content: string
          created_at?: string
          id?: string
          user_id: string
          workshop_id: string
        }
        Update: {
          canvas_item_id?: string
          content?: string
          created_at?: string
          id?: string
          user_id?: string
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workshop_comments_canvas_item_id_fkey"
            columns: ["canvas_item_id"]
            isOneToOne: false
            referencedRelation: "workshop_canvas_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workshop_comments_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      workshop_deliverables: {
        Row: {
          content: Json
          credits_used: number | null
          generated_at: string
          generated_by: string | null
          id: string
          type: Database["public"]["Enums"]["deliverable_type"]
          workshop_id: string
        }
        Insert: {
          content?: Json
          credits_used?: number | null
          generated_at?: string
          generated_by?: string | null
          id?: string
          type: Database["public"]["Enums"]["deliverable_type"]
          workshop_id: string
        }
        Update: {
          content?: Json
          credits_used?: number | null
          generated_at?: string
          generated_by?: string | null
          id?: string
          type?: Database["public"]["Enums"]["deliverable_type"]
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workshop_deliverables_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      workshop_participants: {
        Row: {
          display_name: string
          id: string
          is_connected: boolean
          joined_at: string
          role: string
          user_id: string
          workshop_id: string
        }
        Insert: {
          display_name: string
          id?: string
          is_connected?: boolean
          joined_at?: string
          role?: string
          user_id: string
          workshop_id: string
        }
        Update: {
          display_name?: string
          id?: string
          is_connected?: boolean
          joined_at?: string
          role?: string
          user_id?: string
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workshop_participants_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      workshop_responses: {
        Row: {
          card_id: string
          created_at: string
          id: string
          participant_id: string
          response_text: string | null
          vote: number | null
          workshop_id: string
        }
        Insert: {
          card_id: string
          created_at?: string
          id?: string
          participant_id: string
          response_text?: string | null
          vote?: number | null
          workshop_id: string
        }
        Update: {
          card_id?: string
          created_at?: string
          id?: string
          participant_id?: string
          response_text?: string | null
          vote?: number | null
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workshop_responses_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workshop_responses_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "workshop_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workshop_responses_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      workshops: {
        Row: {
          code: string
          config: Json
          created_at: string
          current_card_id: string | null
          current_step: number
          host_id: string
          id: string
          name: string
          status: Database["public"]["Enums"]["workshop_status"]
          timer_seconds: number | null
          timer_started_at: string | null
          updated_at: string
        }
        Insert: {
          code: string
          config?: Json
          created_at?: string
          current_card_id?: string | null
          current_step?: number
          host_id: string
          id?: string
          name: string
          status?: Database["public"]["Enums"]["workshop_status"]
          timer_seconds?: number | null
          timer_started_at?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          config?: Json
          created_at?: string
          current_card_id?: string | null
          current_step?: number
          host_id?: string
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["workshop_status"]
          timer_seconds?: number | null
          timer_started_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workshops_current_card_id_fkey"
            columns: ["current_card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_org_admin: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_workshop_host: {
        Args: { _user_id: string; _workshop_id: string }
        Returns: boolean
      }
      is_workshop_participant: {
        Args: { _user_id: string; _workshop_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "owner" | "admin" | "member"
      canvas_item_type: "card" | "sticky" | "group" | "arrow" | "icon" | "text"
      card_phase: "foundations" | "model" | "growth" | "execution"
      challenge_slot_type: "single" | "multi" | "ranked"
      challenge_subject_type: "question" | "challenge" | "context"
      deliverable_type: "swot" | "bmc" | "pitch_deck" | "action_plan"
      toolkit_status: "draft" | "published" | "archived"
      workshop_status: "lobby" | "active" | "paused" | "completed"
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
    Enums: {
      app_role: ["owner", "admin", "member"],
      canvas_item_type: ["card", "sticky", "group", "arrow", "icon", "text"],
      card_phase: ["foundations", "model", "growth", "execution"],
      challenge_slot_type: ["single", "multi", "ranked"],
      challenge_subject_type: ["question", "challenge", "context"],
      deliverable_type: ["swot", "bmc", "pitch_deck", "action_plan"],
      toolkit_status: ["draft", "published", "archived"],
      workshop_status: ["lobby", "active", "paused", "completed"],
    },
  },
} as const
