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
      academy_asset_versions: {
        Row: {
          asset_id: string
          asset_type: string
          change_summary: string | null
          changed_by: string | null
          created_at: string
          id: string
          snapshot: Json
          version_number: number
        }
        Insert: {
          asset_id: string
          asset_type: string
          change_summary?: string | null
          changed_by?: string | null
          created_at?: string
          id?: string
          snapshot?: Json
          version_number?: number
        }
        Update: {
          asset_id?: string
          asset_type?: string
          change_summary?: string | null
          changed_by?: string | null
          created_at?: string
          id?: string
          snapshot?: Json
          version_number?: number
        }
        Relationships: []
      }
      academy_campaign_targets: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          target_id: string
          target_type: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          target_id: string
          target_type?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_campaign_targets_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "academy_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_campaigns: {
        Row: {
          created_at: string
          created_by: string
          description: string
          ends_at: string | null
          id: string
          name: string
          organization_id: string
          path_id: string
          reminder_config: Json
          starts_at: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string
          ends_at?: string | null
          id?: string
          name: string
          organization_id: string
          path_id: string
          reminder_config?: Json
          starts_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          ends_at?: string | null
          id?: string
          name?: string
          organization_id?: string
          path_id?: string
          reminder_config?: Json
          starts_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_campaigns_path_id_fkey"
            columns: ["path_id"]
            isOneToOne: false
            referencedRelation: "academy_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_certificate_config: {
        Row: {
          api_key_hash: string | null
          created_at: string
          custom_signature: string | null
          custom_title: string | null
          id: string
          min_score: number
          path_id: string
          template_key: string
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          api_key_hash?: string | null
          created_at?: string
          custom_signature?: string | null
          custom_title?: string | null
          id?: string
          min_score?: number
          path_id: string
          template_key?: string
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          api_key_hash?: string | null
          created_at?: string
          custom_signature?: string | null
          custom_title?: string | null
          id?: string
          min_score?: number
          path_id?: string
          template_key?: string
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "academy_certificate_config_path_id_fkey"
            columns: ["path_id"]
            isOneToOne: true
            referencedRelation: "academy_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_certificates: {
        Row: {
          certificate_data: Json
          enrollment_id: string
          id: string
          issued_at: string
          path_id: string
          public_share_enabled: boolean
          revoked_at: string | null
          revoked_reason: string | null
          status: string
          user_id: string
        }
        Insert: {
          certificate_data?: Json
          enrollment_id: string
          id?: string
          issued_at?: string
          path_id: string
          public_share_enabled?: boolean
          revoked_at?: string | null
          revoked_reason?: string | null
          status?: string
          user_id: string
        }
        Update: {
          certificate_data?: Json
          enrollment_id?: string
          id?: string
          issued_at?: string
          path_id?: string
          public_share_enabled?: boolean
          revoked_at?: string | null
          revoked_reason?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_certificates_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "academy_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_certificates_path_id_fkey"
            columns: ["path_id"]
            isOneToOne: false
            referencedRelation: "academy_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_contents: {
        Row: {
          body: string
          content_type: string
          created_at: string
          generation_mode: string
          id: string
          media_url: string | null
          module_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          body?: string
          content_type?: string
          created_at?: string
          generation_mode?: string
          id?: string
          media_url?: string | null
          module_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          body?: string
          content_type?: string
          created_at?: string
          generation_mode?: string
          id?: string
          media_url?: string | null
          module_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_contents_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "academy_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_document_sends: {
        Row: {
          document_version: number | null
          email: string | null
          id: string
          path_id: string
          sent_at: string | null
          user_id: string
        }
        Insert: {
          document_version?: number | null
          email?: string | null
          id?: string
          path_id: string
          sent_at?: string | null
          user_id: string
        }
        Update: {
          document_version?: number | null
          email?: string | null
          id?: string
          path_id?: string
          sent_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_document_sends_path_id_fkey"
            columns: ["path_id"]
            isOneToOne: false
            referencedRelation: "academy_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_enrollments: {
        Row: {
          campaign_id: string | null
          completed_at: string | null
          enrolled_at: string
          id: string
          path_id: string
          status: string
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          completed_at?: string | null
          enrolled_at?: string
          id?: string
          path_id: string
          status?: string
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          completed_at?: string | null
          enrolled_at?: string
          id?: string
          path_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_enrollments_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "academy_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_enrollments_path_id_fkey"
            columns: ["path_id"]
            isOneToOne: false
            referencedRelation: "academy_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_exercises: {
        Row: {
          ai_evaluation_enabled: boolean
          created_at: string
          evaluation_criteria: Json
          expected_output_type: string
          generation_mode: string
          id: string
          instructions: string
          module_id: string
          organization_id: string | null
          tags: string[]
          title: string
        }
        Insert: {
          ai_evaluation_enabled?: boolean
          created_at?: string
          evaluation_criteria?: Json
          expected_output_type?: string
          generation_mode?: string
          id?: string
          instructions?: string
          module_id: string
          organization_id?: string | null
          tags?: string[]
          title: string
        }
        Update: {
          ai_evaluation_enabled?: boolean
          created_at?: string
          evaluation_criteria?: Json
          expected_output_type?: string
          generation_mode?: string
          id?: string
          instructions?: string
          module_id?: string
          organization_id?: string | null
          tags?: string[]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_exercises_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "academy_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_exercises_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_function_users: {
        Row: {
          assigned_at: string
          custom_context: Json
          function_id: string
          id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          custom_context?: Json
          function_id: string
          id?: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          custom_context?: Json
          function_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_function_users_function_id_fkey"
            columns: ["function_id"]
            isOneToOne: false
            referencedRelation: "academy_functions"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_functions: {
        Row: {
          ai_use_cases: Json
          company_size: string | null
          created_at: string
          created_by: string
          department: string | null
          description: string
          generation_mode: string
          id: string
          industry: string | null
          kpis: Json
          name: string
          organization_id: string | null
          responsibilities: Json
          seniority: string | null
          status: string
          tools_used: Json
          updated_at: string
        }
        Insert: {
          ai_use_cases?: Json
          company_size?: string | null
          created_at?: string
          created_by: string
          department?: string | null
          description?: string
          generation_mode?: string
          id?: string
          industry?: string | null
          kpis?: Json
          name: string
          organization_id?: string | null
          responsibilities?: Json
          seniority?: string | null
          status?: string
          tools_used?: Json
          updated_at?: string
        }
        Update: {
          ai_use_cases?: Json
          company_size?: string | null
          created_at?: string
          created_by?: string
          department?: string | null
          description?: string
          generation_mode?: string
          id?: string
          industry?: string | null
          kpis?: Json
          name?: string
          organization_id?: string | null
          responsibilities?: Json
          seniority?: string | null
          status?: string
          tools_used?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_functions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_modules: {
        Row: {
          created_at: string
          description: string
          estimated_minutes: number | null
          generation_mode: string
          id: string
          module_type: string
          objectives: Json
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          estimated_minutes?: number | null
          generation_mode?: string
          id?: string
          module_type?: string
          objectives?: Json
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          estimated_minutes?: number | null
          generation_mode?: string
          id?: string
          module_type?: string
          objectives?: Json
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      academy_path_feedback: {
        Row: {
          ai_generated_insights: Json | null
          created_at: string | null
          difficulty_rating: number | null
          enrollment_id: string
          id: string
          improvements: string[] | null
          overall_rating: number | null
          path_id: string
          relevance_rating: number | null
          strengths: string[] | null
          testimonial: string | null
          user_id: string
          would_recommend: boolean | null
        }
        Insert: {
          ai_generated_insights?: Json | null
          created_at?: string | null
          difficulty_rating?: number | null
          enrollment_id: string
          id?: string
          improvements?: string[] | null
          overall_rating?: number | null
          path_id: string
          relevance_rating?: number | null
          strengths?: string[] | null
          testimonial?: string | null
          user_id: string
          would_recommend?: boolean | null
        }
        Update: {
          ai_generated_insights?: Json | null
          created_at?: string | null
          difficulty_rating?: number | null
          enrollment_id?: string
          id?: string
          improvements?: string[] | null
          overall_rating?: number | null
          path_id?: string
          relevance_rating?: number | null
          strengths?: string[] | null
          testimonial?: string | null
          user_id?: string
          would_recommend?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "academy_path_feedback_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: true
            referencedRelation: "academy_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_path_feedback_path_id_fkey"
            columns: ["path_id"]
            isOneToOne: false
            referencedRelation: "academy_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_path_modules: {
        Row: {
          id: string
          module_id: string
          path_id: string
          sort_order: number
        }
        Insert: {
          id?: string
          module_id: string
          path_id: string
          sort_order?: number
        }
        Update: {
          id?: string
          module_id?: string
          path_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "academy_path_modules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "academy_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_path_modules_path_id_fkey"
            columns: ["path_id"]
            isOneToOne: false
            referencedRelation: "academy_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_paths: {
        Row: {
          aptitudes: Json
          certificate_enabled: boolean
          cover_image_url: string | null
          created_at: string
          created_by: string
          description: string
          difficulty: string | null
          estimated_hours: number | null
          function_id: string | null
          generation_mode: string
          guide_document: Json | null
          id: string
          name: string
          organization_id: string | null
          persona_id: string | null
          prerequisites: Json
          professional_outcomes: Json
          skills: Json
          status: string
          tags: Json
          updated_at: string
        }
        Insert: {
          aptitudes?: Json
          certificate_enabled?: boolean
          cover_image_url?: string | null
          created_at?: string
          created_by: string
          description?: string
          difficulty?: string | null
          estimated_hours?: number | null
          function_id?: string | null
          generation_mode?: string
          guide_document?: Json | null
          id?: string
          name: string
          organization_id?: string | null
          persona_id?: string | null
          prerequisites?: Json
          professional_outcomes?: Json
          skills?: Json
          status?: string
          tags?: Json
          updated_at?: string
        }
        Update: {
          aptitudes?: Json
          certificate_enabled?: boolean
          cover_image_url?: string | null
          created_at?: string
          created_by?: string
          description?: string
          difficulty?: string | null
          estimated_hours?: number | null
          function_id?: string | null
          generation_mode?: string
          guide_document?: Json | null
          id?: string
          name?: string
          organization_id?: string | null
          persona_id?: string | null
          prerequisites?: Json
          professional_outcomes?: Json
          skills?: Json
          status?: string
          tags?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_paths_function_id_fkey"
            columns: ["function_id"]
            isOneToOne: false
            referencedRelation: "academy_functions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_paths_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_paths_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "academy_personae"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_personae: {
        Row: {
          avatar_url: string | null
          characteristics: Json
          created_at: string
          created_by: string
          description: string
          generation_mode: string
          id: string
          name: string
          organization_id: string | null
          parent_persona_id: string | null
          status: string
          tags: Json
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          characteristics?: Json
          created_at?: string
          created_by: string
          description?: string
          generation_mode?: string
          id?: string
          name: string
          organization_id?: string | null
          parent_persona_id?: string | null
          status?: string
          tags?: Json
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          characteristics?: Json
          created_at?: string
          created_by?: string
          description?: string
          generation_mode?: string
          id?: string
          name?: string
          organization_id?: string | null
          parent_persona_id?: string | null
          status?: string
          tags?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_personae_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_personae_parent_persona_id_fkey"
            columns: ["parent_persona_id"]
            isOneToOne: false
            referencedRelation: "academy_personae"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_practice_sessions: {
        Row: {
          completed_at: string | null
          enrollment_id: string | null
          evaluation: Json | null
          id: string
          messages: Json
          metadata: Json
          practice_id: string | null
          score: number | null
          started_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          enrollment_id?: string | null
          evaluation?: Json | null
          id?: string
          messages?: Json
          metadata?: Json
          practice_id?: string | null
          score?: number | null
          started_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          enrollment_id?: string | null
          evaluation?: Json | null
          id?: string
          messages?: Json
          metadata?: Json
          practice_id?: string | null
          score?: number | null
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_practice_sessions_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "academy_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_practice_sessions_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "academy_practices"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_practices: {
        Row: {
          ai_assistance_level: string
          attached_data: Json
          audience: string | null
          coaching_mode: string
          created_at: string
          difficulty: string | null
          estimated_minutes: number | null
          evaluation_dimensions: Json
          evaluation_rubric: Json
          evaluation_strategy: string
          evaluation_weights: Json
          generation_mode: string
          guardrails: Json
          hints: Json
          id: string
          is_public: boolean
          max_exchanges: number
          model_override: string | null
          module_id: string | null
          objectives: Json
          organization_id: string | null
          phases: Json
          practice_type: string
          restitution_template: Json
          scenario: string
          status: string
          success_criteria: Json
          system_prompt: string
          tags: string[]
          temperature_override: number | null
          title: string
          type_config: Json
          universe: string | null
          updated_at: string
        }
        Insert: {
          ai_assistance_level?: string
          attached_data?: Json
          audience?: string | null
          coaching_mode?: string
          created_at?: string
          difficulty?: string | null
          estimated_minutes?: number | null
          evaluation_dimensions?: Json
          evaluation_rubric?: Json
          evaluation_strategy?: string
          evaluation_weights?: Json
          generation_mode?: string
          guardrails?: Json
          hints?: Json
          id?: string
          is_public?: boolean
          max_exchanges?: number
          model_override?: string | null
          module_id?: string | null
          objectives?: Json
          organization_id?: string | null
          phases?: Json
          practice_type?: string
          restitution_template?: Json
          scenario?: string
          status?: string
          success_criteria?: Json
          system_prompt?: string
          tags?: string[]
          temperature_override?: number | null
          title: string
          type_config?: Json
          universe?: string | null
          updated_at?: string
        }
        Update: {
          ai_assistance_level?: string
          attached_data?: Json
          audience?: string | null
          coaching_mode?: string
          created_at?: string
          difficulty?: string | null
          estimated_minutes?: number | null
          evaluation_dimensions?: Json
          evaluation_rubric?: Json
          evaluation_strategy?: string
          evaluation_weights?: Json
          generation_mode?: string
          guardrails?: Json
          hints?: Json
          id?: string
          is_public?: boolean
          max_exchanges?: number
          model_override?: string | null
          module_id?: string | null
          objectives?: Json
          organization_id?: string | null
          phases?: Json
          practice_type?: string
          restitution_template?: Json
          scenario?: string
          status?: string
          success_criteria?: Json
          system_prompt?: string
          tags?: string[]
          temperature_override?: number | null
          title?: string
          type_config?: Json
          universe?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_practices_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "academy_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_practices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_progress: {
        Row: {
          completed_at: string | null
          enrollment_id: string
          id: string
          metadata: Json
          module_id: string
          score: number | null
          started_at: string | null
          status: string
          time_spent_seconds: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          enrollment_id: string
          id?: string
          metadata?: Json
          module_id: string
          score?: number | null
          started_at?: string | null
          status?: string
          time_spent_seconds?: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          enrollment_id?: string
          id?: string
          metadata?: Json
          module_id?: string
          score?: number | null
          started_at?: string | null
          status?: string
          time_spent_seconds?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_progress_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "academy_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "academy_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_quiz_questions: {
        Row: {
          correct_answer: Json
          explanation: string | null
          id: string
          options: Json
          points: number
          question: string
          question_type: string
          quiz_id: string
          sort_order: number
        }
        Insert: {
          correct_answer?: Json
          explanation?: string | null
          id?: string
          options?: Json
          points?: number
          question: string
          question_type?: string
          quiz_id: string
          sort_order?: number
        }
        Update: {
          correct_answer?: Json
          explanation?: string | null
          id?: string
          options?: Json
          points?: number
          question?: string
          question_type?: string
          quiz_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "academy_quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "academy_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_quizzes: {
        Row: {
          created_at: string
          description: string
          generation_mode: string
          id: string
          module_id: string
          organization_id: string | null
          passing_score: number
          tags: string[]
          title: string
        }
        Insert: {
          created_at?: string
          description?: string
          generation_mode?: string
          id?: string
          module_id: string
          organization_id?: string | null
          passing_score?: number
          tags?: string[]
          title?: string
        }
        Update: {
          created_at?: string
          description?: string
          generation_mode?: string
          id?: string
          module_id?: string
          organization_id?: string | null
          passing_score?: number
          tags?: string[]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_quizzes_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "academy_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_quizzes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_skill_assessments: {
        Row: {
          assessed_at: string | null
          enrollment_id: string
          evidence: Json | null
          final_level: number | null
          id: string
          initial_level: number | null
          skill_name: string
          user_id: string
        }
        Insert: {
          assessed_at?: string | null
          enrollment_id: string
          evidence?: Json | null
          final_level?: number | null
          id?: string
          initial_level?: number | null
          skill_name: string
          user_id: string
        }
        Update: {
          assessed_at?: string | null
          enrollment_id?: string
          evidence?: Json | null
          final_level?: number | null
          id?: string
          initial_level?: number | null
          skill_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_skill_assessments_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "academy_enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          organization_id: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_configurations: {
        Row: {
          api_key: string | null
          api_key_secret_id: string | null
          created_at: string
          id: string
          is_active: boolean
          max_tokens: number
          model_chat: string
          model_structured: string
          organization_id: string | null
          prompts: Json
          provider_id: string
          temperature: number
          updated_at: string
        }
        Insert: {
          api_key?: string | null
          api_key_secret_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          max_tokens?: number
          model_chat?: string
          model_structured?: string
          organization_id?: string | null
          prompts?: Json
          provider_id: string
          temperature?: number
          updated_at?: string
        }
        Update: {
          api_key?: string | null
          api_key_secret_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          max_tokens?: number
          model_chat?: string
          model_structured?: string
          organization_id?: string | null
          prompts?: Json
          provider_id?: string
          temperature?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_configurations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_configurations_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "ai_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_providers: {
        Row: {
          auth_header_prefix: string
          base_url: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          slug: string
        }
        Insert: {
          auth_header_prefix?: string
          base_url: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
        }
        Update: {
          auth_header_prefix?: string
          base_url?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
        }
        Relationships: []
      }
      audit_logs_immutable: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          current_hash: string
          entity_id: string | null
          entity_type: string | null
          id: number
          occurred_at: string
          organization_id: string | null
          payload: Json
          prev_hash: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          current_hash: string
          entity_id?: string | null
          entity_type?: string | null
          id?: number
          occurred_at?: string
          organization_id?: string | null
          payload?: Json
          prev_hash?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          current_hash?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: number
          occurred_at?: string
          organization_id?: string | null
          payload?: Json
          prev_hash?: string | null
        }
        Relationships: []
      }
      business_quotes: {
        Row: {
          challenges: string | null
          created_at: string
          created_by: string
          engagement_months: number
          id: string
          parent_quote_id: string | null
          prospect_name: string
          quote_markdown: string | null
          role_configs: Json
          sale_model_id: string
          segment: string
          selected_service_ids: Json
          selected_setup_ids: Json
          status: string
          totals: Json
          updated_at: string
          user_count: number
          version: number
        }
        Insert: {
          challenges?: string | null
          created_at?: string
          created_by: string
          engagement_months?: number
          id?: string
          parent_quote_id?: string | null
          prospect_name: string
          quote_markdown?: string | null
          role_configs?: Json
          sale_model_id: string
          segment: string
          selected_service_ids?: Json
          selected_setup_ids?: Json
          status?: string
          totals?: Json
          updated_at?: string
          user_count?: number
          version?: number
        }
        Update: {
          challenges?: string | null
          created_at?: string
          created_by?: string
          engagement_months?: number
          id?: string
          parent_quote_id?: string | null
          prospect_name?: string
          quote_markdown?: string | null
          role_configs?: Json
          sale_model_id?: string
          segment?: string
          selected_service_ids?: Json
          selected_setup_ids?: Json
          status?: string
          totals?: Json
          updated_at?: string
          user_count?: number
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "business_quotes_parent_quote_id_fkey"
            columns: ["parent_quote_id"]
            isOneToOne: false
            referencedRelation: "business_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      cards: {
        Row: {
          action: string | null
          created_at: string
          definition: string | null
          difficulty: string | null
          duration_minutes: number | null
          icon_name: string | null
          id: string
          kpi: string | null
          objective: string | null
          phase: Database["public"]["Enums"]["card_phase"]
          pillar_id: string
          qualification: string | null
          sort_order: number
          status: string
          step_name: string | null
          subtitle: string | null
          tags: Json
          title: string
          valorization: number
        }
        Insert: {
          action?: string | null
          created_at?: string
          definition?: string | null
          difficulty?: string | null
          duration_minutes?: number | null
          icon_name?: string | null
          id?: string
          kpi?: string | null
          objective?: string | null
          phase?: Database["public"]["Enums"]["card_phase"]
          pillar_id: string
          qualification?: string | null
          sort_order?: number
          status?: string
          step_name?: string | null
          subtitle?: string | null
          tags?: Json
          title: string
          valorization?: number
        }
        Update: {
          action?: string | null
          created_at?: string
          definition?: string | null
          difficulty?: string | null
          duration_minutes?: number | null
          icon_name?: string | null
          id?: string
          kpi?: string | null
          objective?: string | null
          phase?: Database["public"]["Enums"]["card_phase"]
          pillar_id?: string
          qualification?: string | null
          sort_order?: number
          status?: string
          step_name?: string | null
          subtitle?: string | null
          tags?: Json
          title?: string
          valorization?: number
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
          sort_order: number
          subject_id: string
          user_id: string
          workshop_id: string
        }
        Insert: {
          card_id: string
          created_at?: string
          format?: string
          id?: string
          sort_order?: number
          subject_id: string
          user_id: string
          workshop_id: string
        }
        Update: {
          card_id?: string
          created_at?: string
          format?: string
          id?: string
          sort_order?: number
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
      challenge_template_toolkits: {
        Row: {
          created_at: string
          id: string
          template_id: string
          toolkit_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          template_id: string
          toolkit_id: string
        }
        Update: {
          created_at?: string
          id?: string
          template_id?: string
          toolkit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_template_toolkits_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "challenge_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_template_toolkits_toolkit_id_fkey"
            columns: ["toolkit_id"]
            isOneToOne: false
            referencedRelation: "toolkits"
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
      email_ab_tests: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          name: string
          organization_id: string | null
          significance_pct: number | null
          started_at: string
          status: string
          template_id: string
          updated_at: string
          variant_a_clicked: number
          variant_a_opened: number
          variant_a_sent: number
          variant_a_subject: string
          variant_b_clicked: number
          variant_b_opened: number
          variant_b_sent: number
          variant_b_subject: string
          winner: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          name: string
          organization_id?: string | null
          significance_pct?: number | null
          started_at?: string
          status?: string
          template_id: string
          updated_at?: string
          variant_a_clicked?: number
          variant_a_opened?: number
          variant_a_sent?: number
          variant_a_subject: string
          variant_b_clicked?: number
          variant_b_opened?: number
          variant_b_sent?: number
          variant_b_subject: string
          winner?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          name?: string
          organization_id?: string | null
          significance_pct?: number | null
          started_at?: string
          status?: string
          template_id?: string
          updated_at?: string
          variant_a_clicked?: number
          variant_a_opened?: number
          variant_a_sent?: number
          variant_a_subject?: string
          variant_b_clicked?: number
          variant_b_opened?: number
          variant_b_sent?: number
          variant_b_subject?: string
          winner?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_ab_tests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_ab_tests_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_automation_runs: {
        Row: {
          automation_id: string | null
          bounced_at: string | null
          clicked_at: string | null
          complained_at: string | null
          created_at: string
          delivered_at: string | null
          error: string | null
          id: string
          idempotency_key: string | null
          opened_at: string | null
          organization_id: string | null
          payload: Json
          provider_message_id: string | null
          provider_used: string | null
          recipient_email: string
          scheduled_at: string
          sent_at: string | null
          status: string
          template_code: string
          trigger_event: string
          unsubscribed_at: string | null
        }
        Insert: {
          automation_id?: string | null
          bounced_at?: string | null
          clicked_at?: string | null
          complained_at?: string | null
          created_at?: string
          delivered_at?: string | null
          error?: string | null
          id?: string
          idempotency_key?: string | null
          opened_at?: string | null
          organization_id?: string | null
          payload?: Json
          provider_message_id?: string | null
          provider_used?: string | null
          recipient_email: string
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          template_code: string
          trigger_event: string
          unsubscribed_at?: string | null
        }
        Update: {
          automation_id?: string | null
          bounced_at?: string | null
          clicked_at?: string | null
          complained_at?: string | null
          created_at?: string
          delivered_at?: string | null
          error?: string | null
          id?: string
          idempotency_key?: string | null
          opened_at?: string | null
          organization_id?: string | null
          payload?: Json
          provider_message_id?: string | null
          provider_used?: string | null
          recipient_email?: string
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          template_code?: string
          trigger_event?: string
          unsubscribed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_automation_runs_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "email_automations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_automation_runs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_automations: {
        Row: {
          code: string
          conditions: Json
          created_at: string
          created_by: string | null
          delay_minutes: number
          description: string | null
          id: string
          is_active: boolean
          name: string
          organization_id: string | null
          template_code: string
          trigger_event: string
          updated_at: string
        }
        Insert: {
          code: string
          conditions?: Json
          created_at?: string
          created_by?: string | null
          delay_minutes?: number
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          organization_id?: string | null
          template_code: string
          trigger_event: string
          updated_at?: string
        }
        Update: {
          code?: string
          conditions?: Json
          created_at?: string
          created_by?: string | null
          delay_minutes?: number
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string | null
          template_code?: string
          trigger_event?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_automations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_categories: {
        Row: {
          code: string
          created_at: string
          description: string | null
          is_required: boolean
          name: string
          sort_order: number
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          is_required?: boolean
          name: string
          sort_order?: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          is_required?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      email_confirmation_tokens: {
        Row: {
          category_code: string
          confirmed_at: string | null
          created_at: string
          email: string
          expires_at: string
          organization_id: string | null
          token: string
        }
        Insert: {
          category_code: string
          confirmed_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          organization_id?: string | null
          token: string
        }
        Update: {
          category_code?: string
          confirmed_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          organization_id?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_confirmation_tokens_category_code_fkey"
            columns: ["category_code"]
            isOneToOne: false
            referencedRelation: "email_categories"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "email_confirmation_tokens_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_idempotency_keys: {
        Row: {
          created_at: string
          expires_at: string
          key: string
          organization_id: string | null
          response_payload: Json | null
        }
        Insert: {
          created_at?: string
          expires_at?: string
          key: string
          organization_id?: string | null
          response_payload?: Json | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          key?: string
          organization_id?: string | null
          response_payload?: Json | null
        }
        Relationships: []
      }
      email_provider_configs: {
        Row: {
          created_at: string
          created_by: string | null
          credentials: Json
          credentials_secret_id: string | null
          from_email: string | null
          from_name: string | null
          id: string
          is_active: boolean
          is_default: boolean
          organization_id: string | null
          provider_code: string
          reply_to: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          credentials?: Json
          credentials_secret_id?: string | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          organization_id?: string | null
          provider_code: string
          reply_to?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          credentials?: Json
          credentials_secret_id?: string | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          organization_id?: string | null
          provider_code?: string
          reply_to?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_provider_configs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_provider_configs_provider_code_fkey"
            columns: ["provider_code"]
            isOneToOne: false
            referencedRelation: "email_providers"
            referencedColumns: ["code"]
          },
        ]
      }
      email_providers: {
        Row: {
          code: string
          config_schema: Json
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          code: string
          config_schema?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          code?: string
          config_schema?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      email_quota_usage: {
        Row: {
          id: string
          organization_id: string | null
          period_start: string
          plan_limit: number | null
          sent_count: number
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id?: string | null
          period_start?: string
          plan_limit?: number | null
          sent_count?: number
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string | null
          period_start?: string
          plan_limit?: number | null
          sent_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_quota_usage_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_security_flags: {
        Row: {
          created_at: string
          details: Json
          flag_type: string
          id: string
          organization_id: string | null
          raw_html: string | null
          recipient_email: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          severity: string
          status: string
          template_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json
          flag_type: string
          id?: string
          organization_id?: string | null
          raw_html?: string | null
          recipient_email?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string
          status?: string
          template_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json
          flag_type?: string
          id?: string
          organization_id?: string | null
          raw_html?: string | null
          recipient_email?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string
          status?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_security_flags_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_subscriber_preferences: {
        Row: {
          category_code: string
          double_opt_in_confirmed_at: string | null
          email: string
          id: string
          organization_id: string | null
          source: string | null
          subscribed: boolean
          updated_at: string
          user_id: string | null
        }
        Insert: {
          category_code: string
          double_opt_in_confirmed_at?: string | null
          email: string
          id?: string
          organization_id?: string | null
          source?: string | null
          subscribed?: boolean
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          category_code?: string
          double_opt_in_confirmed_at?: string | null
          email?: string
          id?: string
          organization_id?: string | null
          source?: string | null
          subscribed?: boolean
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_subscriber_preferences_category_code_fkey"
            columns: ["category_code"]
            isOneToOne: false
            referencedRelation: "email_categories"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "email_subscriber_preferences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_suppressions: {
        Row: {
          email: string
          id: string
          is_active: boolean | null
          metadata: Json
          organization_id: string | null
          reactivated_at: string | null
          reactivated_by: string | null
          reason: string
          source_provider: string | null
          suppressed_at: string
        }
        Insert: {
          email: string
          id?: string
          is_active?: boolean | null
          metadata?: Json
          organization_id?: string | null
          reactivated_at?: string | null
          reactivated_by?: string | null
          reason: string
          source_provider?: string | null
          suppressed_at?: string
        }
        Update: {
          email?: string
          id?: string
          is_active?: boolean | null
          metadata?: Json
          organization_id?: string | null
          reactivated_at?: string | null
          reactivated_by?: string | null
          reason?: string
          source_provider?: string | null
          suppressed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_suppressions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_template_translations: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          locale: string
          markdown_body: string
          subject: string
          template_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          locale: string
          markdown_body: string
          subject: string
          template_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          locale?: string
          markdown_body?: string
          subject?: string
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_template_translations_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_template_versions: {
        Row: {
          change_summary: string | null
          changed_by: string | null
          created_at: string
          id: string
          snapshot: Json
          template_id: string
          version_number: number
        }
        Insert: {
          change_summary?: string | null
          changed_by?: string | null
          created_at?: string
          id?: string
          snapshot: Json
          template_id: string
          version_number: number
        }
        Update: {
          change_summary?: string | null
          changed_by?: string | null
          created_at?: string
          id?: string
          snapshot?: Json
          template_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "email_template_versions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          markdown_body: string
          name: string
          organization_id: string | null
          subject: string
          updated_at: string
          variables: Json
          version: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          markdown_body?: string
          name: string
          organization_id?: string | null
          subject: string
          updated_at?: string
          variables?: Json
          version?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          markdown_body?: string
          name?: string
          organization_id?: string | null
          subject?: string
          updated_at?: string
          variables?: Json
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      email_webhook_secrets: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          last_rotated_at: string
          organization_id: string | null
          provider_code: string
          secret: string
          secret_secret_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          last_rotated_at?: string
          organization_id?: string | null
          provider_code: string
          secret: string
          secret_secret_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          last_rotated_at?: string
          organization_id?: string | null
          provider_code?: string
          secret?: string
          secret_secret_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_webhook_secrets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          organization_id: string | null
          read_at: string | null
          severity: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          organization_id?: string | null
          read_at?: string | null
          severity?: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          organization_id?: string | null
          read_at?: string | null
          severity?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      observatory_assets: {
        Row: {
          asset_id: string
          asset_type: string
          contributor_count: number
          contributor_ids: string[]
          created_at: string
          id: string
          last_modified_at: string
          last_modified_by: string | null
          name: string
          organization_id: string | null
          snapshot: Json
          status: string | null
          version_count: number
        }
        Insert: {
          asset_id: string
          asset_type: string
          contributor_count?: number
          contributor_ids?: string[]
          created_at?: string
          id?: string
          last_modified_at?: string
          last_modified_by?: string | null
          name?: string
          organization_id?: string | null
          snapshot?: Json
          status?: string | null
          version_count?: number
        }
        Update: {
          asset_id?: string
          asset_type?: string
          contributor_count?: number
          contributor_ids?: string[]
          created_at?: string
          id?: string
          last_modified_at?: string
          last_modified_by?: string | null
          name?: string
          organization_id?: string | null
          snapshot?: Json
          status?: string | null
          version_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "observatory_assets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          organization_id: string
          revoked_at: string | null
          role: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          organization_id: string
          revoked_at?: string | null
          role?: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          organization_id?: string
          revoked_at?: string | null
          role?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      organization_subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          organization_id: string
          plan_id: string
          started_at: string
          status: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          organization_id: string
          plan_id: string
          started_at?: string
          status?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          organization_id?: string
          plan_id?: string
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
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
          addresses: Json | null
          brand_logo_url: string | null
          contacts: Json | null
          created_at: string
          email: string | null
          email_features_override: Json
          email_sender_domain: string | null
          email_tracking_enabled: boolean
          group_name: string | null
          id: string
          inactivity_reminder_days: number
          is_platform_owner: boolean
          logo_url: string | null
          name: string
          notes: string | null
          parent_organization_id: string | null
          phone: string | null
          primary_color: string | null
          sector: string | null
          siret: string | null
          slug: string
          tva_number: string | null
          ucm_ai_config: Json | null
          ucm_branding: Json | null
          ucm_plan: string | null
          ucm_quotas: Json | null
          updated_at: string
          website: string | null
        }
        Insert: {
          addresses?: Json | null
          brand_logo_url?: string | null
          contacts?: Json | null
          created_at?: string
          email?: string | null
          email_features_override?: Json
          email_sender_domain?: string | null
          email_tracking_enabled?: boolean
          group_name?: string | null
          id?: string
          inactivity_reminder_days?: number
          is_platform_owner?: boolean
          logo_url?: string | null
          name: string
          notes?: string | null
          parent_organization_id?: string | null
          phone?: string | null
          primary_color?: string | null
          sector?: string | null
          siret?: string | null
          slug: string
          tva_number?: string | null
          ucm_ai_config?: Json | null
          ucm_branding?: Json | null
          ucm_plan?: string | null
          ucm_quotas?: Json | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          addresses?: Json | null
          brand_logo_url?: string | null
          contacts?: Json | null
          created_at?: string
          email?: string | null
          email_features_override?: Json
          email_sender_domain?: string | null
          email_tracking_enabled?: boolean
          group_name?: string | null
          id?: string
          inactivity_reminder_days?: number
          is_platform_owner?: boolean
          logo_url?: string | null
          name?: string
          notes?: string | null
          parent_organization_id?: string | null
          phone?: string | null
          primary_color?: string | null
          sector?: string | null
          siret?: string | null
          slug?: string
          tva_number?: string | null
          ucm_ai_config?: Json | null
          ucm_branding?: Json | null
          ucm_plan?: string | null
          ucm_quotas?: Json | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_parent_organization_id_fkey"
            columns: ["parent_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      permission_definitions: {
        Row: {
          created_at: string
          description: string
          domain_key: string
          id: string
          key: string
          label: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string
          domain_key: string
          id?: string
          key: string
          label: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string
          domain_key?: string
          id?: string
          key?: string
          label?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "permission_definitions_domain_key_fkey"
            columns: ["domain_key"]
            isOneToOne: false
            referencedRelation: "permission_domains"
            referencedColumns: ["key"]
          },
        ]
      }
      permission_domains: {
        Row: {
          created_at: string
          icon: string
          id: string
          key: string
          label: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          icon?: string
          id?: string
          key: string
          label: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          key?: string
          label?: string
          sort_order?: number
        }
        Relationships: []
      }
      pillars: {
        Row: {
          color: string | null
          description: string | null
          icon_name: string | null
          id: string
          learning_outcomes: Json
          name: string
          slug: string
          sort_order: number
          status: string
          subtitle: string | null
          target_audience: string | null
          toolkit_id: string
          weight: number
        }
        Insert: {
          color?: string | null
          description?: string | null
          icon_name?: string | null
          id?: string
          learning_outcomes?: Json
          name: string
          slug: string
          sort_order?: number
          status?: string
          subtitle?: string | null
          target_audience?: string | null
          toolkit_id: string
          weight?: number
        }
        Update: {
          color?: string | null
          description?: string | null
          icon_name?: string | null
          id?: string
          learning_outcomes?: Json
          name?: string
          slug?: string
          sort_order?: number
          status?: string
          subtitle?: string | null
          target_audience?: string | null
          toolkit_id?: string
          weight?: number
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
      practice_blocks: {
        Row: {
          content: Json
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_global: boolean
          kind: string
          name: string
          organization_id: string | null
          tags: Json
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_global?: boolean
          kind: string
          name: string
          organization_id?: string | null
          tags?: Json
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_global?: boolean
          kind?: string
          name?: string
          organization_id?: string | null
          tags?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_blocks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_organizations: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          organization_id: string
          practice_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          organization_id: string
          practice_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          organization_id?: string
          practice_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_organizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_organizations_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "academy_practices"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_user_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          due_date: string | null
          id: string
          notes: string | null
          organization_id: string | null
          practice_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          practice_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          practice_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_user_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_user_assignments_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "academy_practices"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_variants: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          practice_id: string
          system_prompt: string
          variant_label: string
          weight: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          practice_id: string
          system_prompt?: string
          variant_label: string
          weight?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          practice_id?: string
          system_prompt?: string
          variant_label?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "practice_variants_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "academy_practices"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_versions: {
        Row: {
          change_summary: string | null
          changed_by: string | null
          created_at: string
          id: string
          practice_id: string
          snapshot: Json
          version_number: number
        }
        Insert: {
          change_summary?: string | null
          changed_by?: string | null
          created_at?: string
          id?: string
          practice_id: string
          snapshot?: Json
          version_number?: number
        }
        Update: {
          change_summary?: string | null
          changed_by?: string | null
          created_at?: string
          id?: string
          practice_id?: string
          snapshot?: Json
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "practice_versions_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "academy_practices"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          department: string | null
          display_name: string | null
          email: string | null
          hierarchy_level: string | null
          id: string
          interests: Json | null
          job_title: string | null
          last_seen_at: string | null
          linkedin_url: string | null
          location: string | null
          manager_name: string | null
          manager_user_id: string | null
          objectives: Json | null
          phone: string | null
          pole: string | null
          service: string | null
          status: string
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          department?: string | null
          display_name?: string | null
          email?: string | null
          hierarchy_level?: string | null
          id?: string
          interests?: Json | null
          job_title?: string | null
          last_seen_at?: string | null
          linkedin_url?: string | null
          location?: string | null
          manager_name?: string | null
          manager_user_id?: string | null
          objectives?: Json | null
          phone?: string | null
          pole?: string | null
          service?: string | null
          status?: string
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          department?: string | null
          display_name?: string | null
          email?: string | null
          hierarchy_level?: string | null
          id?: string
          interests?: Json | null
          job_title?: string | null
          last_seen_at?: string | null
          linkedin_url?: string | null
          location?: string | null
          manager_name?: string | null
          manager_user_id?: string | null
          objectives?: Json | null
          phone?: string | null
          pole?: string | null
          service?: string | null
          status?: string
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
      rate_limits: {
        Row: {
          action_key: string
          count: number
          created_at: string
          id: string
          updated_at: string
          user_id: string
          window_start: string
        }
        Insert: {
          action_key: string
          count?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          window_start?: string
        }
        Update: {
          action_key?: string
          count?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string | null
          id: string
          permission_key: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string | null
          id?: string
          permission_key: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string | null
          id?: string
          permission_key?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string
          features: Json
          id: string
          is_active: boolean
          name: string
          price_monthly: number | null
          price_yearly: number | null
          quotas: Json
          sort_order: number
        }
        Insert: {
          created_at?: string
          features?: Json
          id?: string
          is_active?: boolean
          name: string
          price_monthly?: number | null
          price_yearly?: number | null
          quotas?: Json
          sort_order?: number
        }
        Update: {
          created_at?: string
          features?: Json
          id?: string
          is_active?: boolean
          name?: string
          price_monthly?: number | null
          price_yearly?: number | null
          quotas?: Json
          sort_order?: number
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          bounced_at: string | null
          created_at: string
          email: string
          id: string
          metadata: Json | null
          organization_id: string | null
          provider_code: string | null
          reason: string
          source: string
        }
        Insert: {
          bounced_at?: string | null
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          provider_code?: string | null
          reason: string
          source?: string
        }
        Update: {
          bounced_at?: string | null
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          provider_code?: string | null
          reason?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppressed_emails_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string
          id: string
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          id: string
          lead_user_id: string | null
          name: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lead_user_id?: string | null
          name: string
          organization_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lead_user_id?: string | null
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      toolkits: {
        Row: {
          benefits: string | null
          content_description: string | null
          created_at: string
          credit_cost_challenge: number
          credit_cost_workshop: number
          description: string | null
          difficulty_level: string | null
          estimated_duration: string | null
          icon_emoji: string | null
          id: string
          name: string
          nomenclature: string | null
          price_info: Json
          slug: string
          status: Database["public"]["Enums"]["toolkit_status"]
          tags: Json
          target_audience: string | null
          terms: string | null
          updated_at: string
          usage_mode: string | null
          version: string
        }
        Insert: {
          benefits?: string | null
          content_description?: string | null
          created_at?: string
          credit_cost_challenge?: number
          credit_cost_workshop?: number
          description?: string | null
          difficulty_level?: string | null
          estimated_duration?: string | null
          icon_emoji?: string | null
          id?: string
          name: string
          nomenclature?: string | null
          price_info?: Json
          slug: string
          status?: Database["public"]["Enums"]["toolkit_status"]
          tags?: Json
          target_audience?: string | null
          terms?: string | null
          updated_at?: string
          usage_mode?: string | null
          version?: string
        }
        Update: {
          benefits?: string | null
          content_description?: string | null
          created_at?: string
          credit_cost_challenge?: number
          credit_cost_workshop?: number
          description?: string | null
          difficulty_level?: string | null
          estimated_duration?: string | null
          icon_emoji?: string | null
          id?: string
          name?: string
          nomenclature?: string | null
          price_info?: Json
          slug?: string
          status?: Database["public"]["Enums"]["toolkit_status"]
          tags?: Json
          target_audience?: string | null
          terms?: string | null
          updated_at?: string
          usage_mode?: string | null
          version?: string
        }
        Relationships: []
      }
      ucm_analyses: {
        Row: {
          ai_model: string | null
          ai_provider: string | null
          content: string | null
          created_at: string | null
          generated_by: string | null
          generation_time_ms: number | null
          id: string
          is_current: boolean | null
          mode: string
          organization_id: string
          project_id: string
          prompt_hash: string | null
          section_id: string
          tokens_used: number | null
          updated_at: string | null
          use_case_id: string
          version: number | null
        }
        Insert: {
          ai_model?: string | null
          ai_provider?: string | null
          content?: string | null
          created_at?: string | null
          generated_by?: string | null
          generation_time_ms?: number | null
          id?: string
          is_current?: boolean | null
          mode: string
          organization_id: string
          project_id: string
          prompt_hash?: string | null
          section_id: string
          tokens_used?: number | null
          updated_at?: string | null
          use_case_id: string
          version?: number | null
        }
        Update: {
          ai_model?: string | null
          ai_provider?: string | null
          content?: string | null
          created_at?: string | null
          generated_by?: string | null
          generation_time_ms?: number | null
          id?: string
          is_current?: boolean | null
          mode?: string
          organization_id?: string
          project_id?: string
          prompt_hash?: string | null
          section_id?: string
          tokens_used?: number | null
          updated_at?: string | null
          use_case_id?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ucm_analyses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ucm_analyses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ucm_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ucm_analyses_use_case_id_fkey"
            columns: ["use_case_id"]
            isOneToOne: false
            referencedRelation: "ucm_use_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      ucm_analysis_sections: {
        Row: {
          brief_instruction: string
          code: string
          created_at: string | null
          detailed_instruction: string
          icon: string | null
          id: string
          is_active: boolean | null
          organization_id: string | null
          sort_order: number | null
          title: string
        }
        Insert: {
          brief_instruction: string
          code: string
          created_at?: string | null
          detailed_instruction: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          organization_id?: string | null
          sort_order?: number | null
          title: string
        }
        Update: {
          brief_instruction?: string
          code?: string
          created_at?: string | null
          detailed_instruction?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          organization_id?: string | null
          sort_order?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "ucm_analysis_sections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ucm_chat_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          organization_id: string
          project_id: string
          role: string
          tokens_used: number | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          organization_id: string
          project_id: string
          role: string
          tokens_used?: number | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          organization_id?: string
          project_id?: string
          role?: string
          tokens_used?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ucm_chat_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ucm_chat_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ucm_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ucm_exports: {
        Row: {
          created_at: string | null
          error_message: string | null
          expires_at: string | null
          file_size_bytes: number | null
          file_url: string | null
          format: string
          id: string
          options: Json | null
          organization_id: string
          project_id: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          expires_at?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          format?: string
          id?: string
          options?: Json | null
          organization_id: string
          project_id: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          expires_at?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          format?: string
          id?: string
          options?: Json | null
          organization_id?: string
          project_id?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ucm_exports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ucm_exports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ucm_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ucm_global_analysis_sections: {
        Row: {
          code: string
          created_at: string | null
          icon: string | null
          id: string
          instruction: string
          is_active: boolean | null
          organization_id: string | null
          sort_order: number | null
          title: string
        }
        Insert: {
          code: string
          created_at?: string | null
          icon?: string | null
          id?: string
          instruction: string
          is_active?: boolean | null
          organization_id?: string | null
          sort_order?: number | null
          title: string
        }
        Update: {
          code?: string
          created_at?: string | null
          icon?: string | null
          id?: string
          instruction?: string
          is_active?: boolean | null
          organization_id?: string | null
          sort_order?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "ucm_global_analysis_sections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ucm_global_sections: {
        Row: {
          ai_model: string | null
          ai_provider: string | null
          content: string | null
          created_at: string | null
          generated_by: string | null
          id: string
          is_current: boolean | null
          organization_id: string
          project_id: string
          section_id: string
          tokens_used: number | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          ai_model?: string | null
          ai_provider?: string | null
          content?: string | null
          created_at?: string | null
          generated_by?: string | null
          id?: string
          is_current?: boolean | null
          organization_id: string
          project_id: string
          section_id: string
          tokens_used?: number | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          ai_model?: string | null
          ai_provider?: string | null
          content?: string | null
          created_at?: string | null
          generated_by?: string | null
          id?: string
          is_current?: boolean | null
          organization_id?: string
          project_id?: string
          section_id?: string
          tokens_used?: number | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ucm_global_sections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ucm_global_sections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ucm_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ucm_projects: {
        Row: {
          company: string
          context: string | null
          created_at: string | null
          created_by: string | null
          id: string
          immersion: string | null
          notes: string | null
          organization_id: string
          sector_id: string | null
          sector_label: string | null
          selected_functions: string[] | null
          status: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          company?: string
          context?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          immersion?: string | null
          notes?: string | null
          organization_id: string
          sector_id?: string | null
          sector_label?: string | null
          selected_functions?: string[] | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          company?: string
          context?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          immersion?: string | null
          notes?: string | null
          organization_id?: string
          sector_id?: string | null
          sector_label?: string | null
          selected_functions?: string[] | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ucm_projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ucm_projects_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "ucm_sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      ucm_quota_usage: {
        Row: {
          analysis_generations: number | null
          chat_messages: number | null
          exports: number | null
          global_generations: number | null
          id: string
          organization_id: string
          period: string
          total_cost_cents: number | null
          total_tokens: number | null
          uc_generations: number | null
          updated_at: string | null
        }
        Insert: {
          analysis_generations?: number | null
          chat_messages?: number | null
          exports?: number | null
          global_generations?: number | null
          id?: string
          organization_id: string
          period: string
          total_cost_cents?: number | null
          total_tokens?: number | null
          uc_generations?: number | null
          updated_at?: string | null
        }
        Update: {
          analysis_generations?: number | null
          chat_messages?: number | null
          exports?: number | null
          global_generations?: number | null
          id?: string
          organization_id?: string
          period?: string
          total_cost_cents?: number | null
          total_tokens?: number | null
          uc_generations?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ucm_quota_usage_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ucm_sectors: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          functions: Json
          group_name: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_custom: boolean | null
          knowledge: string | null
          label: string
          organization_id: string | null
          sort_order: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          functions?: Json
          group_name?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_custom?: boolean | null
          knowledge?: string | null
          label: string
          organization_id?: string | null
          sort_order?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          functions?: Json
          group_name?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_custom?: boolean | null
          knowledge?: string | null
          label?: string
          organization_id?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ucm_sectors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ucm_uc_contexts: {
        Row: {
          constraints: string | null
          custom_fields: Json | null
          id: string
          objectives: string | null
          organization_id: string
          pain_points: string | null
          situation: string | null
          team: string | null
          tools: string | null
          updated_at: string | null
          use_case_id: string
          volumes: string | null
        }
        Insert: {
          constraints?: string | null
          custom_fields?: Json | null
          id?: string
          objectives?: string | null
          organization_id: string
          pain_points?: string | null
          situation?: string | null
          team?: string | null
          tools?: string | null
          updated_at?: string | null
          use_case_id: string
          volumes?: string | null
        }
        Update: {
          constraints?: string | null
          custom_fields?: Json | null
          id?: string
          objectives?: string | null
          organization_id?: string
          pain_points?: string | null
          situation?: string | null
          team?: string | null
          tools?: string | null
          updated_at?: string | null
          use_case_id?: string
          volumes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ucm_uc_contexts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ucm_uc_contexts_use_case_id_fkey"
            columns: ["use_case_id"]
            isOneToOne: false
            referencedRelation: "ucm_use_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      ucm_use_cases: {
        Row: {
          ai_techniques: string[] | null
          complexity: string | null
          created_at: string | null
          data_readiness: string | null
          description: string | null
          functions: string[] | null
          horizon: string | null
          id: string
          impact_level: string | null
          is_generated: boolean | null
          is_selected: boolean | null
          name: string
          organization_id: string
          priority: string | null
          project_id: string
          sort_order: number | null
          updated_at: string | null
          value_drivers: string[] | null
        }
        Insert: {
          ai_techniques?: string[] | null
          complexity?: string | null
          created_at?: string | null
          data_readiness?: string | null
          description?: string | null
          functions?: string[] | null
          horizon?: string | null
          id?: string
          impact_level?: string | null
          is_generated?: boolean | null
          is_selected?: boolean | null
          name: string
          organization_id: string
          priority?: string | null
          project_id: string
          sort_order?: number | null
          updated_at?: string | null
          value_drivers?: string[] | null
        }
        Update: {
          ai_techniques?: string[] | null
          complexity?: string | null
          created_at?: string | null
          data_readiness?: string | null
          description?: string | null
          functions?: string[] | null
          horizon?: string | null
          id?: string
          impact_level?: string | null
          is_generated?: boolean | null
          is_selected?: boolean | null
          name?: string
          organization_id?: string
          priority?: string | null
          project_id?: string
          sort_order?: number | null
          updated_at?: string | null
          value_drivers?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "ucm_use_cases_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ucm_use_cases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ucm_projects"
            referencedColumns: ["id"]
          },
        ]
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
      webhook_allowlist_domains: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          domain: string
          id: string
          is_active: boolean
          match_suffix: boolean
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          domain: string
          id?: string
          is_active?: boolean
          match_suffix?: boolean
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          domain?: string
          id?: string
          is_active?: boolean
          match_suffix?: boolean
        }
        Relationships: []
      }
      workshop_actions: {
        Row: {
          assignee_id: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          status: string
          title: string
          workshop_id: string
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          status?: string
          title: string
          workshop_id: string
        }
        Update: {
          assignee_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          status?: string
          title?: string
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workshop_actions_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
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
      workshop_invitations: {
        Row: {
          created_at: string
          email: string
          id: string
          invited_by: string
          role: string
          status: string
          token: string
          workshop_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          invited_by: string
          role?: string
          status?: string
          token?: string
          workshop_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          invited_by?: string
          role?: string
          status?: string
          token?: string
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workshop_invitations_workshop_id_fkey"
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
      workshop_snapshots: {
        Row: {
          created_at: string
          created_by: string
          id: string
          snapshot_data: Json
          workshop_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          snapshot_data?: Json
          workshop_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          snapshot_data?: Json
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workshop_snapshots_workshop_id_fkey"
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
          context: string | null
          created_at: string
          current_card_id: string | null
          current_step: number
          description: string | null
          facilitator_id: string | null
          host_id: string
          id: string
          max_participants: number | null
          name: string
          objectives: Json | null
          organization_id: string | null
          scheduled_at: string | null
          session_mode: string | null
          status: Database["public"]["Enums"]["workshop_status"]
          timer_seconds: number | null
          timer_started_at: string | null
          updated_at: string
        }
        Insert: {
          code: string
          config?: Json
          context?: string | null
          created_at?: string
          current_card_id?: string | null
          current_step?: number
          description?: string | null
          facilitator_id?: string | null
          host_id: string
          id?: string
          max_participants?: number | null
          name: string
          objectives?: Json | null
          organization_id?: string | null
          scheduled_at?: string | null
          session_mode?: string | null
          status?: Database["public"]["Enums"]["workshop_status"]
          timer_seconds?: number | null
          timer_started_at?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          config?: Json
          context?: string | null
          created_at?: string
          current_card_id?: string | null
          current_step?: number
          description?: string | null
          facilitator_id?: string | null
          host_id?: string
          id?: string
          max_participants?: number | null
          name?: string
          objectives?: Json | null
          organization_id?: string | null
          scheduled_at?: string | null
          session_mode?: string | null
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
          {
            foreignKeyName: "workshops_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      academy_certificates_public: {
        Row: {
          certificate_summary: Json | null
          id: string | null
          issued_at: string | null
          path_id: string | null
          public_share_enabled: boolean | null
        }
        Insert: {
          certificate_summary?: never
          id?: string | null
          issued_at?: string | null
          path_id?: string | null
          public_share_enabled?: boolean | null
        }
        Update: {
          certificate_summary?: never
          id?: string | null
          issued_at?: string | null
          path_id?: string | null
          public_share_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "academy_certificates_path_id_fkey"
            columns: ["path_id"]
            isOneToOne: false
            referencedRelation: "academy_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_quiz_questions_safe: {
        Row: {
          id: string | null
          options: Json | null
          points: number | null
          question: string | null
          question_type: string | null
          quiz_id: string | null
          sort_order: number | null
        }
        Insert: {
          id?: string | null
          options?: Json | null
          points?: number | null
          question?: string | null
          question_type?: string | null
          quiz_id?: string | null
          sort_order?: number | null
        }
        Update: {
          id?: string | null
          options?: Json | null
          points?: number | null
          question?: string | null
          question_type?: string | null
          quiz_id?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "academy_quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "academy_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      v_academy_quiz_questions_public: {
        Row: {
          explanation: string | null
          id: string | null
          options: Json | null
          points: number | null
          question: string | null
          question_type: string | null
          quiz_id: string | null
          sort_order: number | null
        }
        Insert: {
          explanation?: string | null
          id?: string | null
          options?: Json | null
          points?: number | null
          question?: string | null
          question_type?: string | null
          quiz_id?: string | null
          sort_order?: number | null
        }
        Update: {
          explanation?: string | null
          id?: string | null
          options?: Json | null
          points?: number | null
          question?: string | null
          question_type?: string | null
          quiz_id?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "academy_quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "academy_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      v_audit_log_integrity: {
        Row: {
          chain_ok: boolean | null
          computed_prev: string | null
          id: number | null
          prev_hash: string | null
        }
        Relationships: []
      }
      v_email_stats: {
        Row: {
          clicked_count: number | null
          day: string | null
          failed_count: number | null
          opened_count: number | null
          organization_id: string | null
          provider_used: string | null
          scheduled_count: number | null
          sent_count: number | null
          template_code: string | null
          total_count: number | null
          trigger_event: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_automation_runs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      v_practice_variants_public: {
        Row: {
          created_at: string | null
          id: string | null
          is_active: boolean | null
          practice_id: string | null
          variant_label: string | null
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          practice_id?: string | null
          variant_label?: string | null
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          practice_id?: string | null
          variant_label?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "practice_variants_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "academy_practices"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_invitation: { Args: { _token: string }; Returns: Json }
      app_get_secret: {
        Args: { _context?: string; _secret_id: string }
        Returns: string
      }
      app_store_secret: {
        Args: { _existing_id?: string; _name?: string; _value: string }
        Returns: string
      }
      append_audit_log: {
        Args: {
          _action: string
          _entity_id?: string
          _entity_type?: string
          _organization_id?: string
          _payload?: Json
        }
        Returns: number
      }
      check_circuit_breaker: {
        Args: { _provider_code: string }
        Returns: boolean
      }
      check_email_quota: { Args: { _org_id: string }; Returns: boolean }
      check_rate_limit: {
        Args: {
          _action_key: string
          _max_calls?: number
          _user_id: string
          _window_minutes?: number
        }
        Returns: Json
      }
      check_ucm_quota: {
        Args: { p_action: string; p_org_id: string }
        Returns: boolean
      }
      cleanup_rate_limits: { Args: never; Returns: undefined }
      compute_ab_significance: {
        Args: {
          _a_opened: number
          _a_sent: number
          _b_opened: number
          _b_sent: number
        }
        Returns: number
      }
      confirm_email_opt_in: { Args: { _token: string }; Returns: Json }
      consume_unsubscribe_token: { Args: { _token: string }; Returns: Json }
      count_users_by_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: number
      }
      cron_dispatch_login_reminders: { Args: never; Returns: undefined }
      decrypt_email_credentials: {
        Args: { _encrypted: string; _key: string }
        Returns: string
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      delete_priority_email: {
        Args: { _msg_id: number; _priority: string }
        Returns: boolean
      }
      dispatch_email_event: {
        Args: {
          _entity_id: string
          _event: string
          _organization_id: string
          _payload: Json
          _recipient_email: string
          _recipient_user_id: string
        }
        Returns: undefined
      }
      encrypt_email_credentials: {
        Args: { _key: string; _plain: Json }
        Returns: string
      }
      encrypt_email_credentials_admin: {
        Args: { _plain: Json }
        Returns: string
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      enqueue_email_priority: {
        Args: { _payload: Json; _priority?: string }
        Returns: number
      }
      erase_user_email_data: { Args: { _user_id?: string }; Returns: Json }
      export_user_email_data: { Args: { _user_id?: string }; Returns: Json }
      find_workshop_by_code: {
        Args: { _code: string }
        Returns: {
          code: string
          host_id: string
          id: string
          max_participants: number
          name: string
          scheduled_at: string
          status: Database["public"]["Enums"]["workshop_status"]
        }[]
      }
      get_ai_api_key: { Args: { _config_id: string }; Returns: string }
      get_edge_function_metrics: {
        Args: { _hours?: number }
        Returns: {
          error_rate: number
          errors: number
          function_name: string
          invocations: number
          p50_ms: number
          p95_ms: number
        }[]
      }
      get_email_cron_health: {
        Args: never
        Returns: {
          active: boolean
          jobname: string
          last_end: string
          last_message: string
          last_start: string
          last_status: string
          schedule: string
        }[]
      }
      get_email_provider_credentials: {
        Args: { _config_id: string }
        Returns: Json
      }
      get_email_provider_health: {
        Args: { _hours?: number }
        Returns: {
          bounced: number
          circuit_open: boolean
          dlq: number
          failed: number
          failure_rate: number
          provider: string
          sent: number
          total: number
        }[]
      }
      get_email_quota_alerts: {
        Args: never
        Returns: {
          monthly_limit: number
          organization_id: string
          organization_name: string
          sent_count: number
          usage_percent: number
        }[]
      }
      get_email_webhook_secret: {
        Args: { _organization_id?: string; _provider_code: string }
        Returns: string
      }
      get_invitation_by_token: {
        Args: { _token: string }
        Returns: {
          accepted_at: string
          email: string
          expires_at: string
          id: string
          organization_id: string
          organization_name: string
          revoked_at: string
          role: string
        }[]
      }
      get_or_create_email_hmac_secret: { Args: never; Returns: string }
      get_org_effective_features: { Args: { _org_id: string }; Returns: Json }
      get_priority_lane_metrics: {
        Args: never
        Returns: {
          priority: string
          queue_length: number
          total_messages: number
        }[]
      }
      get_system_health: { Args: never; Returns: Json }
      get_ucm_global_prompt: {
        Args: { p_org_id: string; p_section_code: string }
        Returns: string
      }
      get_ucm_section_prompt: {
        Args: { p_mode: string; p_org_id: string; p_section_code: string }
        Returns: string
      }
      has_academy_access: {
        Args: { _module_id: string; _user_id: string }
        Returns: boolean
      }
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_email_quota: {
        Args: { _by?: number; _org_id: string }
        Returns: undefined
      }
      is_org_admin: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_saas_team: { Args: { _user_id: string }; Returns: boolean }
      is_url_allowed: { Args: { _url: string }; Returns: boolean }
      is_workshop_host: {
        Args: { _user_id: string; _workshop_id: string }
        Returns: boolean
      }
      is_workshop_participant: {
        Args: { _user_id: string; _workshop_id: string }
        Returns: boolean
      }
      log_activity: {
        Args: {
          _action: string
          _entity_id: string
          _entity_type: string
          _metadata?: Json
          _organization_id?: string
        }
        Returns: undefined
      }
      log_audit_event: {
        Args: {
          _action: string
          _entity_id?: string
          _entity_type?: string
          _organization_id?: string
          _payload?: Json
        }
        Returns: number
      }
      mark_all_notifications_read: { Args: never; Returns: number }
      mark_notifications_read: { Args: { _ids: string[] }; Returns: number }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      notify_user: {
        Args: {
          _body?: string
          _link?: string
          _organization_id?: string
          _severity?: string
          _title: string
          _type: string
          _user_id: string
        }
        Returns: string
      }
      purge_expired_email_tokens: { Args: never; Returns: Json }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      read_priority_email_batch: {
        Args: { _batch_size?: number; _priority: string; _vt?: number }
        Returns: {
          enqueued_at: string
          message: Json
          msg_id: number
          read_ct: number
          vt: string
        }[]
      }
      replay_dlq_message: { Args: { _message_id: string }; Returns: Json }
      requires_2fa: { Args: { _user_id: string }; Returns: boolean }
      review_email_security_flag: {
        Args: { _decision: string; _flag_id: string }
        Returns: undefined
      }
      rotate_email_webhook_secret: {
        Args: { _organization_id?: string; _provider_code: string }
        Returns: string
      }
      sign_email_payload: { Args: { _payload: Json }; Returns: string }
      spend_credits: {
        Args: { _amount: number; _description: string; _user_id: string }
        Returns: Json
      }
      ucm_increment_quota: {
        Args: { _field: string; _org_id: string; _tokens?: number }
        Returns: undefined
      }
      validate_confirmation_token: { Args: { _token: string }; Returns: Json }
      validate_unsubscribe_token: { Args: { _token: string }; Returns: Json }
      verify_audit_chain_integrity: { Args: never; Returns: Json }
    }
    Enums: {
      app_role:
        | "owner"
        | "admin"
        | "member"
        | "super_admin"
        | "customer_lead"
        | "innovation_lead"
        | "performance_lead"
        | "product_actor"
        | "lead"
        | "facilitator"
        | "manager"
        | "guest"
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
      app_role: [
        "owner",
        "admin",
        "member",
        "super_admin",
        "customer_lead",
        "innovation_lead",
        "performance_lead",
        "product_actor",
        "lead",
        "facilitator",
        "manager",
        "guest",
      ],
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
