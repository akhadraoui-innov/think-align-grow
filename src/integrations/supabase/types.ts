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
          created_at: string
          difficulty: string | null
          evaluation_dimensions: Json
          evaluation_rubric: Json
          generation_mode: string
          id: string
          max_exchanges: number
          module_id: string | null
          organization_id: string | null
          phases: Json
          practice_type: string
          scenario: string
          system_prompt: string
          tags: string[]
          title: string
          type_config: Json
        }
        Insert: {
          ai_assistance_level?: string
          created_at?: string
          difficulty?: string | null
          evaluation_dimensions?: Json
          evaluation_rubric?: Json
          generation_mode?: string
          id?: string
          max_exchanges?: number
          module_id?: string | null
          organization_id?: string | null
          phases?: Json
          practice_type?: string
          scenario?: string
          system_prompt?: string
          tags?: string[]
          title: string
          type_config?: Json
        }
        Update: {
          ai_assistance_level?: string
          created_at?: string
          difficulty?: string | null
          evaluation_dimensions?: Json
          evaluation_rubric?: Json
          generation_mode?: string
          id?: string
          max_exchanges?: number
          module_id?: string | null
          organization_id?: string | null
          phases?: Json
          practice_type?: string
          scenario?: string
          system_prompt?: string
          tags?: string[]
          title?: string
          type_config?: Json
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
          contacts: Json | null
          created_at: string
          email: string | null
          group_name: string | null
          id: string
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
          updated_at: string
          website: string | null
        }
        Insert: {
          addresses?: Json | null
          contacts?: Json | null
          created_at?: string
          email?: string | null
          group_name?: string | null
          id?: string
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
          updated_at?: string
          website?: string | null
        }
        Update: {
          addresses?: Json | null
          contacts?: Json | null
          created_at?: string
          email?: string | null
          group_name?: string | null
          id?: string
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
      [_ in never]: never
    }
    Functions: {
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
      is_org_admin: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_saas_team: { Args: { _user_id: string }; Returns: boolean }
      is_workshop_host: {
        Args: { _user_id: string; _workshop_id: string }
        Returns: boolean
      }
      is_workshop_participant: {
        Args: { _user_id: string; _workshop_id: string }
        Returns: boolean
      }
      spend_credits: {
        Args: { _amount: number; _description: string; _user_id: string }
        Returns: Json
      }
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
