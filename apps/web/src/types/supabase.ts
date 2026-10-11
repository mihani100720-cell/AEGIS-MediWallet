export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      access_audit_logs: {
        Row: {
          accessor_id: number
          accessor_name: string
          accessor_role: string | null
          action: string | null
          grant_id: number | null
          id: number
          record_id: number | null
          timestamp: string | null
        }
        Insert: {
          accessor_id: number
          accessor_name: string
          accessor_role?: string | null
          action?: string | null
          grant_id?: number | null
          id?: number
          record_id?: number | null
          timestamp?: string | null
        }
        Update: {
          accessor_id?: number
          accessor_name?: string
          accessor_role?: string | null
          action?: string | null
          grant_id?: number | null
          id?: number
          record_id?: number | null
          timestamp?: string | null
        }
        Relationships: []
      }
      appointments: {
        Row: {
          appointment_date: string
          clinic: string
          doctor_id: number | null
          doctor_name: string
          follow_up_instructions: string | null
          id: number
          reminder_sent: boolean | null
          status: string | null
          user_id: number
        }
        Insert: {
          appointment_date: string
          clinic: string
          doctor_id?: number | null
          doctor_name: string
          follow_up_instructions?: string | null
          id?: number
          reminder_sent?: boolean | null
          status?: string | null
          user_id: number
        }
        Update: {
          appointment_date?: string
          clinic?: string
          doctor_id?: number | null
          doctor_name?: string
          follow_up_instructions?: string | null
          id?: number
          reminder_sent?: boolean | null
          status?: string | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_grants: {
        Row: {
          created_at: string | null
          doctor_id: number
          expires_at: string
          id: number
          mode: string | null
          patient_id: number
          purpose: string | null
          qr_token: string
          record_ids: string | null
          revoked_at: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          doctor_id: number
          expires_at: string
          id?: number
          mode?: string | null
          patient_id: number
          purpose?: string | null
          qr_token: string
          record_ids?: string | null
          revoked_at?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          doctor_id?: number
          expires_at?: string
          id?: number
          mode?: string | null
          patient_id?: number
          purpose?: string | null
          qr_token?: string
          record_ids?: string | null
          revoked_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consent_grants_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consent_grants_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_profiles: {
        Row: {
          badge_issued: boolean | null
          document_proof_url: string | null
          hospital_affiliation: string
          id: number
          medical_reg_no: string
          specialization: string
          user_id: number
          verification_status: string | null
          verified_at: string | null
        }
        Insert: {
          badge_issued?: boolean | null
          document_proof_url?: string | null
          hospital_affiliation: string
          id?: number
          medical_reg_no: string
          specialization: string
          user_id: number
          verification_status?: string | null
          verified_at?: string | null
        }
        Update: {
          badge_issued?: boolean | null
          document_proof_url?: string | null
          hospital_affiliation?: string
          id?: number
          medical_reg_no?: string
          specialization?: string
          user_id?: number
          verification_status?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctor_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_profiles: {
        Row: {
          allergies: string | null
          blood_group: string | null
          chronic_conditions: string | null
          current_medications: string | null
          emergency_contacts: string | null
          id: number
          qr_payload: string | null
          updated_at: string | null
          user_id: number
        }
        Insert: {
          allergies?: string | null
          blood_group?: string | null
          chronic_conditions?: string | null
          current_medications?: string | null
          emergency_contacts?: string | null
          id?: number
          qr_payload?: string | null
          updated_at?: string | null
          user_id: number
        }
        Update: {
          allergies?: string | null
          blood_group?: string | null
          chronic_conditions?: string | null
          current_medications?: string | null
          emergency_contacts?: string | null
          id?: number
          qr_payload?: string | null
          updated_at?: string | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "emergency_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      family_members: {
        Row: {
          age: number | null
          blood_group: string | null
          created_at: string | null
          emergency_contact: string | null
          face_encoding: string | null
          face_enrolled: boolean | null
          id: number
          name: string
          primary_user_id: number
          relation: string
        }
        Insert: {
          age?: number | null
          blood_group?: string | null
          created_at?: string | null
          emergency_contact?: string | null
          face_encoding?: string | null
          face_enrolled?: boolean | null
          id?: number
          name: string
          primary_user_id: number
          relation: string
        }
        Update: {
          age?: number | null
          blood_group?: string | null
          created_at?: string | null
          emergency_contact?: string | null
          face_encoding?: string | null
          face_enrolled?: boolean | null
          id?: number
          name?: string
          primary_user_id?: number
          relation?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_members_primary_user_id_fkey"
            columns: ["primary_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      folder_access_audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: string | null
          folder_id: number | null
          id: number
          ip_address: string | null
          method: string | null
          report_id: number | null
          status: string | null
          user_agent: string | null
          user_id: number
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: string | null
          folder_id?: number | null
          id?: number
          ip_address?: string | null
          method?: string | null
          report_id?: number | null
          status?: string | null
          user_agent?: string | null
          user_id: number
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: string | null
          folder_id?: number | null
          id?: number
          ip_address?: string | null
          method?: string | null
          report_id?: number | null
          status?: string | null
          user_agent?: string | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "folder_access_audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      folder_access_sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          folder_id: number | null
          id: number
          is_active: boolean | null
          session_token: string
          user_id: number
          verified_via: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          folder_id?: number | null
          id?: number
          is_active?: boolean | null
          session_token: string
          user_id: number
          verified_via?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          folder_id?: number | null
          id?: number
          is_active?: boolean | null
          session_token?: string
          user_id?: number
          verified_via?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "folder_access_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      folder_members: {
        Row: {
          age: number | null
          blood_group: string | null
          created_at: string | null
          email: string | null
          folder_id: number
          gender: string | null
          id: number
          name: string
          notes: string | null
          phone: string | null
          relationship_label: string | null
          updated_at: string | null
          user_id: number
        }
        Insert: {
          age?: number | null
          blood_group?: string | null
          created_at?: string | null
          email?: string | null
          folder_id: number
          gender?: string | null
          id?: number
          name: string
          notes?: string | null
          phone?: string | null
          relationship_label?: string | null
          updated_at?: string | null
          user_id: number
        }
        Update: {
          age?: number | null
          blood_group?: string | null
          created_at?: string | null
          email?: string | null
          folder_id?: number
          gender?: string | null
          id?: number
          name?: string
          notes?: string | null
          phone?: string | null
          relationship_label?: string | null
          updated_at?: string | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "folder_members_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "health_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folder_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      folder_otp_verifications: {
        Row: {
          attempts_remaining: number | null
          created_at: string | null
          delivery_channel: string | null
          expires_at: string
          folder_id: number | null
          id: number
          otp_hash: string
          target_masked: string
          used: boolean | null
          user_id: number
        }
        Insert: {
          attempts_remaining?: number | null
          created_at?: string | null
          delivery_channel?: string | null
          expires_at: string
          folder_id?: number | null
          id?: number
          otp_hash: string
          target_masked: string
          used?: boolean | null
          user_id: number
        }
        Update: {
          attempts_remaining?: number | null
          created_at?: string | null
          delivery_channel?: string | null
          expires_at?: string
          folder_id?: number | null
          id?: number
          otp_hash?: string
          target_masked?: string
          used?: boolean | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "folder_otp_verifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      health_folders: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          name: string
          updated_at: string | null
          user_id: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          name: string
          updated_at?: string | null
          user_id: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          name?: string
          updated_at?: string | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "health_folders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_records: {
        Row: {
          ai_summary: string | null
          category: string | null
          created_at: string | null
          doctor_name: string | null
          extracted_text: string | null
          family_member_id: number | null
          file_name: string
          file_size: number | null
          file_url: string
          hospital_name: string | null
          id: number
          is_abnormal: boolean | null
          mime_type: string | null
          ocr_status: string | null
          record_date: string | null
          sha256_hash: string
          storage_key: string | null
          structured_data: string | null
          title: string
          user_id: number
        }
        Insert: {
          ai_summary?: string | null
          category?: string | null
          created_at?: string | null
          doctor_name?: string | null
          extracted_text?: string | null
          family_member_id?: number | null
          file_name: string
          file_size?: number | null
          file_url: string
          hospital_name?: string | null
          id?: number
          is_abnormal?: boolean | null
          mime_type?: string | null
          ocr_status?: string | null
          record_date?: string | null
          sha256_hash: string
          storage_key?: string | null
          structured_data?: string | null
          title: string
          user_id: number
        }
        Update: {
          ai_summary?: string | null
          category?: string | null
          created_at?: string | null
          doctor_name?: string | null
          extracted_text?: string | null
          family_member_id?: number | null
          file_name?: string
          file_size?: number | null
          file_url?: string
          hospital_name?: string | null
          id?: number
          is_abnormal?: boolean | null
          mime_type?: string | null
          ocr_status?: string | null
          record_date?: string | null
          sha256_hash?: string
          storage_key?: string | null
          structured_data?: string | null
          title?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "medical_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      medicines: {
        Row: {
          common_side_effects: string | null
          contraindications: string | null
          dosage_form: string | null
          generic_name: string
          id: number
          indications: string | null
          name: string
          standard_dose: string | null
        }
        Insert: {
          common_side_effects?: string | null
          contraindications?: string | null
          dosage_form?: string | null
          generic_name: string
          id?: number
          indications?: string | null
          name: string
          standard_dose?: string | null
        }
        Update: {
          common_side_effects?: string | null
          contraindications?: string | null
          dosage_form?: string | null
          generic_name?: string
          id?: number
          indications?: string | null
          name?: string
          standard_dose?: string | null
        }
        Relationships: []
      }
      member_medical_reports: {
        Row: {
          created_at: string | null
          document_type: string | null
          file_name: string
          file_size: number | null
          folder_id: number
          id: number
          member_id: number
          mime_type: string
          notes: string | null
          report_date: string | null
          sha256_hash: string
          storage_key: string
          title: string
          user_id: number
        }
        Insert: {
          created_at?: string | null
          document_type?: string | null
          file_name: string
          file_size?: number | null
          folder_id: number
          id?: number
          member_id: number
          mime_type: string
          notes?: string | null
          report_date?: string | null
          sha256_hash: string
          storage_key: string
          title: string
          user_id: number
        }
        Update: {
          created_at?: string | null
          document_type?: string | null
          file_name?: string
          file_size?: number | null
          folder_id?: number
          id?: number
          member_id?: number
          mime_type?: string
          notes?: string | null
          report_date?: string | null
          sha256_hash?: string
          storage_key?: string
          title?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "member_medical_reports_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "health_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_medical_reports_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "folder_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_medical_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          doctor_notes: string | null
          extracted_medicines: string | null
          id: number
          original_image_url: string
          status: string | null
          user_id: number
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          doctor_notes?: string | null
          extracted_medicines?: string | null
          id?: number
          original_image_url: string
          status?: string | null
          user_id: number
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          doctor_notes?: string | null
          extracted_medicines?: string | null
          id?: number
          original_image_url?: string
          status?: string | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      security_events: {
        Row: {
          created_at: string | null
          details: string | null
          event_type: string
          id: number
          ip_address: string | null
          severity: string | null
          user_agent: string | null
          user_id: number | null
        }
        Insert: {
          created_at?: string | null
          details?: string | null
          event_type: string
          id?: number
          ip_address?: string | null
          severity?: string | null
          user_agent?: string | null
          user_id?: number | null
        }
        Update: {
          created_at?: string | null
          details?: string | null
          event_type?: string
          id?: number
          ip_address?: string | null
          severity?: string | null
          user_agent?: string | null
          user_id?: number | null
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string | null
          device_name: string | null
          id: number
          ip_address: string | null
          is_active: boolean | null
          last_active_at: string | null
          session_token: string
          user_id: number
        }
        Insert: {
          created_at?: string | null
          device_name?: string | null
          id?: number
          ip_address?: string | null
          is_active?: boolean | null
          last_active_at?: string | null
          session_token: string
          user_id: number
        }
        Update: {
          created_at?: string | null
          device_name?: string | null
          id?: number
          ip_address?: string | null
          is_active?: boolean | null
          last_active_at?: string | null
          session_token?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          allowed_access_methods: string | null
          blood_group: string | null
          created_at: string | null
          email: string
          full_name: string
          hashed_password: string
          id: number
          passkey_registered: boolean | null
          phone: string | null
          preferred_language: string | null
          report_access_failed_attempts: number | null
          report_access_locked_until: string | null
          report_access_password_hash: string | null
          role: string | null
          vault_failed_attempts: number | null
          vault_locked_until: string | null
          vault_password_hash: string | null
          vault_salt: string | null
          verified_email: string | null
          verified_phone: string | null
        }
        Insert: {
          allowed_access_methods?: string | null
          blood_group?: string | null
          created_at?: string | null
          email: string
          full_name: string
          hashed_password: string
          id?: number
          passkey_registered?: boolean | null
          phone?: string | null
          preferred_language?: string | null
          report_access_failed_attempts?: number | null
          report_access_locked_until?: string | null
          report_access_password_hash?: string | null
          role?: string | null
          vault_failed_attempts?: number | null
          vault_locked_until?: string | null
          vault_password_hash?: string | null
          vault_salt?: string | null
          verified_email?: string | null
          verified_phone?: string | null
        }
        Update: {
          allowed_access_methods?: string | null
          blood_group?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          hashed_password?: string
          id?: number
          passkey_registered?: boolean | null
          phone?: string | null
          preferred_language?: string | null
          report_access_failed_attempts?: number | null
          report_access_locked_until?: string | null
          report_access_password_hash?: string | null
          role?: string | null
          vault_failed_attempts?: number | null
          vault_locked_until?: string | null
          vault_password_hash?: string | null
          vault_salt?: string | null
          verified_email?: string | null
          verified_phone?: string | null
        }
        Relationships: []
      }
      vault_sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          id: number
          is_active: boolean | null
          session_token: string
          user_id: number
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: number
          is_active?: boolean | null
          session_token: string
          user_id: number
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: number
          is_active?: boolean | null
          session_token?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "vault_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
