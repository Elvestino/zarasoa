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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      academic_levels: {
        Row: {
          code: string
          created_at: string
          cycle: string
          id: string
          is_active: boolean
          label: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          cycle: string
          id?: string
          is_active?: boolean
          label: string
          sort_order: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          cycle?: string
          id?: string
          is_active?: boolean
          label?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      account_security_events: {
        Row: {
          actor_user_id: string | null
          created_at: string
          event_reason: string | null
          event_type: string
          id: string
          ip_address: unknown
          user_agent: string | null
          user_id: string
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string
          event_reason?: string | null
          event_type: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id: string
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string
          event_reason?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_security_events_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_security_events_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "v_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_security_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_security_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      administrative_audit_logs: {
        Row: {
          action_code: string
          actor_user_id: string | null
          after_data: Json | null
          before_data: Json | null
          created_at: string
          entity_id: string | null
          entity_table: string
          id: string
          ip_address: unknown
          reason: string | null
          request_id: string | null
          user_agent: string | null
        }
        Insert: {
          action_code: string
          actor_user_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_table: string
          id?: string
          ip_address?: unknown
          reason?: string | null
          request_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action_code?: string
          actor_user_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_table?: string
          id?: string
          ip_address?: unknown
          reason?: string | null
          request_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "administrative_audit_logs_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "administrative_audit_logs_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "v_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      course_resources: {
        Row: {
          checksum_sha256: string | null
          course_id: string
          created_at: string
          description: string | null
          disabled_at: string | null
          disabled_by: string | null
          disabled_reason: string | null
          display_order: number
          duration_seconds: number | null
          file_extension: string | null
          file_size_bytes: number
          id: string
          mime_type: string
          original_file_name: string
          resource_status: string
          resource_type: string
          storage_bucket: string
          storage_path: string
          title: string
          updated_at: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          checksum_sha256?: string | null
          course_id: string
          created_at?: string
          description?: string | null
          disabled_at?: string | null
          disabled_by?: string | null
          disabled_reason?: string | null
          display_order?: number
          duration_seconds?: number | null
          file_extension?: string | null
          file_size_bytes: number
          id?: string
          mime_type: string
          original_file_name: string
          resource_status?: string
          resource_type: string
          storage_bucket: string
          storage_path: string
          title: string
          updated_at?: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          checksum_sha256?: string | null
          course_id?: string
          created_at?: string
          description?: string | null
          disabled_at?: string | null
          disabled_by?: string | null
          disabled_reason?: string | null
          display_order?: number
          duration_seconds?: number | null
          file_extension?: string | null
          file_size_bytes?: number
          id?: string
          mime_type?: string
          original_file_name?: string
          resource_status?: string
          resource_type?: string
          storage_bucket?: string
          storage_path?: string
          title?: string
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_resources_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_resources_disabled_by_fkey"
            columns: ["disabled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_resources_disabled_by_fkey"
            columns: ["disabled_by"]
            isOneToOne: false
            referencedRelation: "v_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_resources_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_resources_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "v_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      course_status_events: {
        Row: {
          change_reason: string | null
          changed_by: string | null
          course_id: string
          created_at: string
          id: string
          new_status: string
          previous_status: string | null
          related_assignment_id: string | null
        }
        Insert: {
          change_reason?: string | null
          changed_by?: string | null
          course_id: string
          created_at?: string
          id?: string
          new_status: string
          previous_status?: string | null
          related_assignment_id?: string | null
        }
        Update: {
          change_reason?: string | null
          changed_by?: string | null
          course_id?: string
          created_at?: string
          id?: string
          new_status?: string
          previous_status?: string | null
          related_assignment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_status_events_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_status_events_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "v_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_status_events_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_status_events_related_assignment_id_fkey"
            columns: ["related_assignment_id"]
            isOneToOne: false
            referencedRelation: "professor_subject_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          archive_reason: string | null
          archived_at: string | null
          archived_by: string | null
          course_status: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          published_at: string | null
          responsible_professor_id: string
          slug: string | null
          subject_id: string
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
          course_status?: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          published_at?: string | null
          responsible_professor_id: string
          slug?: string | null
          subject_id: string
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
          course_status?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          published_at?: string | null
          responsible_professor_id?: string
          slug?: string | null
          subject_id?: string
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "v_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_responsible_professor_id_fkey"
            columns: ["responsible_professor_id"]
            isOneToOne: false
            referencedRelation: "professor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      filieres: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          faculty_name: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          faculty_name?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          faculty_name?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "filieres_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "filieres_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      homework_files: {
        Row: {
          checksum_sha256: string | null
          created_at: string
          disabled_at: string | null
          disabled_by: string | null
          display_order: number
          file_role: string
          file_size_bytes: number
          file_status: string
          homework_id: string
          id: string
          mime_type: string
          original_file_name: string
          storage_bucket: string
          storage_path: string
          title: string | null
          updated_at: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          checksum_sha256?: string | null
          created_at?: string
          disabled_at?: string | null
          disabled_by?: string | null
          display_order?: number
          file_role: string
          file_size_bytes: number
          file_status?: string
          homework_id: string
          id?: string
          mime_type: string
          original_file_name: string
          storage_bucket: string
          storage_path: string
          title?: string | null
          updated_at?: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          checksum_sha256?: string | null
          created_at?: string
          disabled_at?: string | null
          disabled_by?: string | null
          display_order?: number
          file_role?: string
          file_size_bytes?: number
          file_status?: string
          homework_id?: string
          id?: string
          mime_type?: string
          original_file_name?: string
          storage_bucket?: string
          storage_path?: string
          title?: string | null
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_files_disabled_by_fkey"
            columns: ["disabled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_files_disabled_by_fkey"
            columns: ["disabled_by"]
            isOneToOne: false
            referencedRelation: "v_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_files_homework_id_fkey"
            columns: ["homework_id"]
            isOneToOne: false
            referencedRelation: "homeworks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_files_homework_id_fkey"
            columns: ["homework_id"]
            isOneToOne: false
            referencedRelation: "student_homeworks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "v_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      homework_submission_files: {
        Row: {
          checksum_sha256: string | null
          created_at: string
          file_size_bytes: number
          id: string
          is_current: boolean
          mime_type: string
          original_file_name: string
          storage_bucket: string
          storage_path: string
          submission_id: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          checksum_sha256?: string | null
          created_at?: string
          file_size_bytes: number
          id?: string
          is_current?: boolean
          mime_type: string
          original_file_name: string
          storage_bucket: string
          storage_path: string
          submission_id: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          checksum_sha256?: string | null
          created_at?: string
          file_size_bytes?: number
          id?: string
          is_current?: boolean
          mime_type?: string
          original_file_name?: string
          storage_bucket?: string
          storage_path?: string
          submission_id?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_submission_files_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "homework_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_submission_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_submission_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "v_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      homework_submissions: {
        Row: {
          created_at: string
          homework_id: string
          id: string
          is_late: boolean
          student_comment: string | null
          student_id: string
          submission_status: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          homework_id: string
          id?: string
          is_late?: boolean
          student_comment?: string | null
          student_id: string
          submission_status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          homework_id?: string
          id?: string
          is_late?: boolean
          student_comment?: string | null
          student_id?: string
          submission_status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_submissions_homework_id_fkey"
            columns: ["homework_id"]
            isOneToOne: false
            referencedRelation: "homeworks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_submissions_homework_id_fkey"
            columns: ["homework_id"]
            isOneToOne: false
            referencedRelation: "student_homeworks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_students"
            referencedColumns: ["id"]
          },
        ]
      }
      homeworks: {
        Row: {
          allow_late_submission: boolean
          archive_reason: string | null
          archived_at: string | null
          archived_by: string | null
          correction_released_at: string | null
          correction_released_by: string | null
          correction_text: string | null
          course_id: string
          created_at: string
          created_by: string
          due_at: string | null
          homework_status: string
          id: string
          instructions: string | null
          max_submission_files: number
          published_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          allow_late_submission?: boolean
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
          correction_released_at?: string | null
          correction_released_by?: string | null
          correction_text?: string | null
          course_id: string
          created_at?: string
          created_by: string
          due_at?: string | null
          homework_status?: string
          id?: string
          instructions?: string | null
          max_submission_files?: number
          published_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          allow_late_submission?: boolean
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
          correction_released_at?: string | null
          correction_released_by?: string | null
          correction_text?: string | null
          course_id?: string
          created_at?: string
          created_by?: string
          due_at?: string | null
          homework_status?: string
          id?: string
          instructions?: string | null
          max_submission_files?: number
          published_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "homeworks_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homeworks_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "v_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homeworks_correction_released_by_fkey"
            columns: ["correction_released_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homeworks_correction_released_by_fkey"
            columns: ["correction_released_by"]
            isOneToOne: false
            referencedRelation: "v_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homeworks_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homeworks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homeworks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      official_student_registry: {
        Row: {
          academic_status: string | null
          created_at: string
          date_of_birth: string | null
          filiere_id: string | null
          first_name: string | null
          id: string
          is_current: boolean
          last_name: string | null
          last_verified_at: string | null
          level_id: string | null
          parcours_id: string | null
          registration_number: string
          source_import_id: string
          updated_at: string
        }
        Insert: {
          academic_status?: string | null
          created_at?: string
          date_of_birth?: string | null
          filiere_id?: string | null
          first_name?: string | null
          id?: string
          is_current?: boolean
          last_name?: string | null
          last_verified_at?: string | null
          level_id?: string | null
          parcours_id?: string | null
          registration_number: string
          source_import_id: string
          updated_at?: string
        }
        Update: {
          academic_status?: string | null
          created_at?: string
          date_of_birth?: string | null
          filiere_id?: string | null
          first_name?: string | null
          id?: string
          is_current?: boolean
          last_name?: string | null
          last_verified_at?: string | null
          level_id?: string | null
          parcours_id?: string | null
          registration_number?: string
          source_import_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "official_student_registry_filiere_id_fkey"
            columns: ["filiere_id"]
            isOneToOne: false
            referencedRelation: "filieres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "official_student_registry_filiere_id_fkey"
            columns: ["filiere_id"]
            isOneToOne: false
            referencedRelation: "v_students"
            referencedColumns: ["filiere_id"]
          },
          {
            foreignKeyName: "official_student_registry_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "academic_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "official_student_registry_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "v_students"
            referencedColumns: ["level_id"]
          },
          {
            foreignKeyName: "official_student_registry_source_import_id_fkey"
            columns: ["source_import_id"]
            isOneToOne: false
            referencedRelation: "registry_imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registry_parcours_filiere_fk"
            columns: ["parcours_id", "filiere_id"]
            isOneToOne: false
            referencedRelation: "parcours"
            referencedColumns: ["id", "filiere_id"]
          },
        ]
      }
      parcours: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          filiere_id: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          filiere_id: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          filiere_id?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parcours_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parcours_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parcours_filiere_id_fkey"
            columns: ["filiere_id"]
            isOneToOne: false
            referencedRelation: "filieres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parcours_filiere_id_fkey"
            columns: ["filiere_id"]
            isOneToOne: false
            referencedRelation: "v_students"
            referencedColumns: ["filiere_id"]
          },
        ]
      }
      professor_profiles: {
        Row: {
          bio: string | null
          created_at: string
          department_name: string | null
          employee_number: string | null
          id: string
          is_active: boolean
          professional_title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          department_name?: string | null
          employee_number?: string | null
          id?: string
          is_active?: boolean
          professional_title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          department_name?: string | null
          employee_number?: string | null
          id?: string
          is_active?: boolean
          professional_title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professor_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professor_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      professor_subject_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          assignment_status: string
          created_at: string
          deactivated_at: string | null
          deactivated_by: string | null
          deactivation_reason: string | null
          id: string
          professor_id: string
          subject_id: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          assignment_status?: string
          created_at?: string
          deactivated_at?: string | null
          deactivated_by?: string | null
          deactivation_reason?: string | null
          id?: string
          professor_id: string
          subject_id: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          assignment_status?: string
          created_at?: string
          deactivated_at?: string | null
          deactivated_by?: string | null
          deactivation_reason?: string | null
          id?: string
          professor_id?: string
          subject_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professor_subject_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professor_subject_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "v_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professor_subject_assignments_deactivated_by_fkey"
            columns: ["deactivated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professor_subject_assignments_deactivated_by_fkey"
            columns: ["deactivated_by"]
            isOneToOne: false
            referencedRelation: "v_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professor_subject_assignments_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professor_subject_assignments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: string
          avatar_path: string | null
          created_at: string
          deactivated_at: string | null
          deleted_at: string | null
          email: string
          failed_login_count: number
          first_name: string
          id: string
          last_name: string
          last_seen_at: string | null
          locked_at: string | null
          phone_number: string | null
          preferred_locale: string
          pseudo: string | null
          updated_at: string
        }
        Insert: {
          account_status?: string
          avatar_path?: string | null
          created_at?: string
          deactivated_at?: string | null
          deleted_at?: string | null
          email: string
          failed_login_count?: number
          first_name: string
          id: string
          last_name: string
          last_seen_at?: string | null
          locked_at?: string | null
          phone_number?: string | null
          preferred_locale?: string
          pseudo?: string | null
          updated_at?: string
        }
        Update: {
          account_status?: string
          avatar_path?: string | null
          created_at?: string
          deactivated_at?: string | null
          deleted_at?: string | null
          email?: string
          failed_login_count?: number
          first_name?: string
          id?: string
          last_name?: string
          last_seen_at?: string | null
          locked_at?: string | null
          phone_number?: string | null
          preferred_locale?: string
          pseudo?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      registry_import_rows: {
        Row: {
          created_at: string
          error_code: string | null
          error_message: string | null
          id: string
          import_id: string
          normalized_registration_number: string | null
          processed_at: string | null
          raw_data: Json
          registry_record_id: string | null
          row_number: number
          row_status: string
        }
        Insert: {
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          import_id: string
          normalized_registration_number?: string | null
          processed_at?: string | null
          raw_data: Json
          registry_record_id?: string | null
          row_number: number
          row_status: string
        }
        Update: {
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          import_id?: string
          normalized_registration_number?: string | null
          processed_at?: string | null
          raw_data?: Json
          registry_record_id?: string | null
          row_number?: number
          row_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "registry_import_rows_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "registry_imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registry_import_rows_registry_record_id_fkey"
            columns: ["registry_record_id"]
            isOneToOne: false
            referencedRelation: "official_student_registry"
            referencedColumns: ["id"]
          },
        ]
      }
      registry_imports: {
        Row: {
          created_at: string
          duplicate_rows: number
          error_summary: Json | null
          file_mime_type: string
          file_sha256: string | null
          file_size_bytes: number
          finished_at: string | null
          id: string
          import_status: string
          imported_by: string
          inserted_rows: number
          invalid_rows: number
          source_file_name: string
          started_at: string | null
          storage_path: string
          total_rows: number
          updated_rows: number
        }
        Insert: {
          created_at?: string
          duplicate_rows?: number
          error_summary?: Json | null
          file_mime_type: string
          file_sha256?: string | null
          file_size_bytes: number
          finished_at?: string | null
          id?: string
          import_status: string
          imported_by: string
          inserted_rows?: number
          invalid_rows?: number
          source_file_name: string
          started_at?: string | null
          storage_path: string
          total_rows?: number
          updated_rows?: number
        }
        Update: {
          created_at?: string
          duplicate_rows?: number
          error_summary?: Json | null
          file_mime_type?: string
          file_sha256?: string | null
          file_size_bytes?: number
          finished_at?: string | null
          id?: string
          import_status?: string
          imported_by?: string
          inserted_rows?: number
          invalid_rows?: number
          source_file_name?: string
          started_at?: string | null
          storage_path?: string
          total_rows?: number
          updated_rows?: number
        }
        Relationships: [
          {
            foreignKeyName: "registry_imports_imported_by_fkey"
            columns: ["imported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registry_imports_imported_by_fkey"
            columns: ["imported_by"]
            isOneToOne: false
            referencedRelation: "v_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      student_profiles: {
        Row: {
          approved_at: string
          approved_by: string
          created_at: string
          current_filiere_id: string
          current_level_id: string
          current_parcours_id: string | null
          enrollment_status: string
          id: string
          registration_number: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at: string
          approved_by: string
          created_at?: string
          current_filiere_id: string
          current_level_id: string
          current_parcours_id?: string | null
          enrollment_status?: string
          id?: string
          registration_number: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string
          approved_by?: string
          created_at?: string
          current_filiere_id?: string
          current_level_id?: string
          current_parcours_id?: string | null
          enrollment_status?: string
          id?: string
          registration_number?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_parcours_filiere_fk"
            columns: ["current_parcours_id", "current_filiere_id"]
            isOneToOne: false
            referencedRelation: "parcours"
            referencedColumns: ["id", "filiere_id"]
          },
          {
            foreignKeyName: "student_profiles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_profiles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "v_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_profiles_current_filiere_id_fkey"
            columns: ["current_filiere_id"]
            isOneToOne: false
            referencedRelation: "filieres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_profiles_current_filiere_id_fkey"
            columns: ["current_filiere_id"]
            isOneToOne: false
            referencedRelation: "v_students"
            referencedColumns: ["filiere_id"]
          },
          {
            foreignKeyName: "student_profiles_current_level_id_fkey"
            columns: ["current_level_id"]
            isOneToOne: false
            referencedRelation: "academic_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_profiles_current_level_id_fkey"
            columns: ["current_level_id"]
            isOneToOne: false
            referencedRelation: "v_students"
            referencedColumns: ["level_id"]
          },
          {
            foreignKeyName: "student_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      student_registration_requests: {
        Row: {
          decision_reason: string | null
          declared_date_of_birth: string | null
          email: string
          email_confirmed_at: string | null
          first_name: string
          id: string
          last_name: string
          matched_registry_id: string | null
          phone_number: string | null
          registration_number: string
          registry_match_status: string | null
          request_status: string
          reviewed_at: string | null
          reviewed_by: string | null
          submitted_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          decision_reason?: string | null
          declared_date_of_birth?: string | null
          email: string
          email_confirmed_at?: string | null
          first_name: string
          id?: string
          last_name: string
          matched_registry_id?: string | null
          phone_number?: string | null
          registration_number: string
          registry_match_status?: string | null
          request_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          submitted_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          decision_reason?: string | null
          declared_date_of_birth?: string | null
          email?: string
          email_confirmed_at?: string | null
          first_name?: string
          id?: string
          last_name?: string
          matched_registry_id?: string | null
          phone_number?: string | null
          registration_number?: string
          registry_match_status?: string | null
          request_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          submitted_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_registration_requests_matched_registry_id_fkey"
            columns: ["matched_registry_id"]
            isOneToOne: false
            referencedRelation: "official_student_registry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_registration_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_registration_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "v_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_registration_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_registration_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      student_validation_events: {
        Row: {
          actor_user_id: string | null
          created_at: string
          event_details: Json | null
          event_reason: string | null
          event_type: string
          id: string
          new_status: string | null
          previous_status: string | null
          registration_request_id: string
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string
          event_details?: Json | null
          event_reason?: string | null
          event_type: string
          id?: string
          new_status?: string | null
          previous_status?: string | null
          registration_request_id: string
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string
          event_details?: Json | null
          event_reason?: string | null
          event_type?: string
          id?: string
          new_status?: string | null
          previous_status?: string | null
          registration_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_validation_events_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_validation_events_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "v_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_validation_events_registration_request_id_fkey"
            columns: ["registration_request_id"]
            isOneToOne: false
            referencedRelation: "student_registration_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_validation_events_registration_request_id_fkey"
            columns: ["registration_request_id"]
            isOneToOne: false
            referencedRelation: "v_registration_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          code: string
          coefficient: number | null
          created_at: string
          created_by: string | null
          credits: number | null
          description: string | null
          filiere_id: string
          id: string
          is_active: boolean
          level_id: string
          name: string
          parcours_id: string | null
          updated_at: string
        }
        Insert: {
          code: string
          coefficient?: number | null
          created_at?: string
          created_by?: string | null
          credits?: number | null
          description?: string | null
          filiere_id: string
          id?: string
          is_active?: boolean
          level_id: string
          name: string
          parcours_id?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          coefficient?: number | null
          created_at?: string
          created_by?: string | null
          credits?: number | null
          description?: string | null
          filiere_id?: string
          id?: string
          is_active?: boolean
          level_id?: string
          name?: string
          parcours_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subjects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subjects_filiere_id_fkey"
            columns: ["filiere_id"]
            isOneToOne: false
            referencedRelation: "filieres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subjects_filiere_id_fkey"
            columns: ["filiere_id"]
            isOneToOne: false
            referencedRelation: "v_students"
            referencedColumns: ["filiere_id"]
          },
          {
            foreignKeyName: "subjects_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "academic_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subjects_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "v_students"
            referencedColumns: ["level_id"]
          },
          {
            foreignKeyName: "subjects_parcours_filiere_fk"
            columns: ["parcours_id", "filiere_id"]
            isOneToOne: false
            referencedRelation: "parcours"
            referencedColumns: ["id", "filiere_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          created_at: string
          id: string
          revocation_reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          role_code: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          id?: string
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          role_code: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          id?: string
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          role_code?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "v_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "v_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      student_homeworks: {
        Row: {
          allow_late_submission: boolean | null
          correction_released_at: string | null
          correction_text: string | null
          course_id: string | null
          created_at: string | null
          due_at: string | null
          homework_status: string | null
          id: string | null
          instructions: string | null
          max_submission_files: number | null
          published_at: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          allow_late_submission?: boolean | null
          correction_released_at?: string | null
          correction_text?: never
          course_id?: string | null
          created_at?: string | null
          due_at?: string | null
          homework_status?: string | null
          id?: string | null
          instructions?: string | null
          max_submission_files?: number | null
          published_at?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          allow_late_submission?: boolean | null
          correction_released_at?: string | null
          correction_text?: never
          course_id?: string | null
          created_at?: string | null
          due_at?: string | null
          homework_status?: string | null
          id?: string | null
          instructions?: string | null
          max_submission_files?: number | null
          published_at?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "homeworks_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      v_accounts: {
        Row: {
          account_status: string | null
          created_at: string | null
          deactivated_at: string | null
          deleted_at: string | null
          email: string | null
          failed_login_count: number | null
          first_name: string | null
          id: string | null
          last_name: string | null
          last_seen_at: string | null
          locked_at: string | null
          pseudo: string | null
          roles: string[] | null
        }
        Relationships: []
      }
      v_registration_requests: {
        Row: {
          decision_reason: string | null
          declared_date_of_birth: string | null
          email: string | null
          email_confirmed_at: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          matched_registry_id: string | null
          official_academic_status: string | null
          official_date_of_birth: string | null
          official_filiere_id: string | null
          official_filiere_name: string | null
          official_first_name: string | null
          official_last_name: string | null
          official_level_id: string | null
          official_level_label: string | null
          official_parcours_id: string | null
          official_parcours_name: string | null
          phone_number: string | null
          registration_number: string | null
          registry_match_status: string | null
          request_status: string | null
          reviewed_at: string | null
          submitted_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "official_student_registry_filiere_id_fkey"
            columns: ["official_filiere_id"]
            isOneToOne: false
            referencedRelation: "filieres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "official_student_registry_filiere_id_fkey"
            columns: ["official_filiere_id"]
            isOneToOne: false
            referencedRelation: "v_students"
            referencedColumns: ["filiere_id"]
          },
          {
            foreignKeyName: "official_student_registry_level_id_fkey"
            columns: ["official_level_id"]
            isOneToOne: false
            referencedRelation: "academic_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "official_student_registry_level_id_fkey"
            columns: ["official_level_id"]
            isOneToOne: false
            referencedRelation: "v_students"
            referencedColumns: ["level_id"]
          },
          {
            foreignKeyName: "registry_parcours_filiere_fk"
            columns: ["official_parcours_id", "official_filiere_id"]
            isOneToOne: false
            referencedRelation: "parcours"
            referencedColumns: ["id", "filiere_id"]
          },
          {
            foreignKeyName: "student_registration_requests_matched_registry_id_fkey"
            columns: ["matched_registry_id"]
            isOneToOne: false
            referencedRelation: "official_student_registry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_registration_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_registration_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      v_students: {
        Row: {
          account_status: string | null
          approved_at: string | null
          email: string | null
          enrollment_status: string | null
          filiere_code: string | null
          filiere_id: string | null
          filiere_name: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          level_code: string | null
          level_id: string | null
          level_label: string | null
          level_order: number | null
          parcours_code: string | null
          parcours_id: string | null
          parcours_name: string | null
          phone_number: string | null
          registration_number: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      approve_student_request: {
        Args: {
          p_filiere_id: string
          p_level_id: string
          p_parcours_id: string
          p_request_id: string
        }
        Returns: string
      }
      assign_role: {
        Args: { p_reason?: string; p_role: string; p_user_id: string }
        Returns: undefined
      }
      assert_not_last_super_admin: { Args: never; Returns: undefined }
      can_view_profile: { Args: { _uid: string }; Returns: boolean }
      check_pending_requests: { Args: never; Returns: number }
      check_registration_request: {
        Args: { p_request_id: string }
        Returns: Json
      }
      current_professor_id: { Args: never; Returns: string }
      current_student_id: { Args: never; Returns: string }
      deactivate_my_account: { Args: never; Returns: undefined }
      delete_my_account: { Args: never; Returns: undefined }
      has_role: { Args: { _role: string }; Returns: boolean }
      homework_accepts_submission: { Args: { _hw: string }; Returns: boolean }
      homework_correction_released: { Args: { _hw: string }; Returns: boolean }
      is_active_member: { Args: never; Returns: boolean }
      is_course_responsible: { Args: { _course: string }; Returns: boolean }
      is_homework_responsible: { Args: { _hw: string }; Returns: boolean }
      is_professor: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      lift_account_suspension: {
        Args: { p_reason: string; p_user_id: string }
        Returns: undefined
      }
      log_admin_action: {
        Args: {
          p_action_code: string
          p_after?: Json
          p_before?: Json
          p_entity_id: string
          p_entity_table: string
          p_reason?: string
        }
        Returns: undefined
      }
      normalize_person_name: { Args: { p: string }; Returns: string }
      normalize_registration_number: { Args: { p: string }; Returns: string }
      professor_can_manage_course: {
        Args: { _course: string }
        Returns: boolean
      }
      professor_can_manage_homework: { Args: { _hw: string }; Returns: boolean }
      professor_can_view_student: {
        Args: { _student: string }
        Returns: boolean
      }
      professor_has_active_assignment: {
        Args: { _professor: string; _subject: string }
        Returns: boolean
      }
      reactivate_account: {
        Args: { p_reason: string; p_user_id: string }
        Returns: undefined
      }
      register_login_failure: {
        Args: { p_email: string; p_ip?: unknown; p_user_agent?: string }
        Returns: Json
      }
      register_login_success: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      registration_number_in_use: { Args: { p_number: string }; Returns: boolean }
      reject_student_request: {
        Args: { p_reason: string; p_request_id: string }
        Returns: undefined
      }
      revoke_role: {
        Args: { p_reason: string; p_role: string; p_user_id: string }
        Returns: undefined
      }
      safe_uuid: { Args: { p: string }; Returns: string }
      student_can_see_course: { Args: { _course: string }; Returns: boolean }
      student_can_see_homework: { Args: { _hw: string }; Returns: boolean }
      student_in_scope_of_subject: {
        Args: { _subject: string }
        Returns: boolean
      }
      suspend_account: {
        Args: { p_reason: string; p_user_id: string }
        Returns: undefined
      }
      unlock_account: {
        Args: { p_reason?: string; p_user_id: string }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
