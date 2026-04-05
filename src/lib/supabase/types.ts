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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_log_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          alert_days: number[] | null
          cert_number: string | null
          cert_type: Database["public"]["Enums"]["cert_type"]
          created_at: string
          document_url: string | null
          expiry_date: string | null
          flag_state: string | null
          id: string
          issue_date: string | null
          issuing_authority: string | null
          notes: string | null
          offline_cached: boolean | null
          profile_id: string
          status: Database["public"]["Enums"]["cert_status"] | null
          title: string
          updated_at: string
        }
        Insert: {
          alert_days?: number[] | null
          cert_number?: string | null
          cert_type: Database["public"]["Enums"]["cert_type"]
          created_at?: string | null
          document_url?: string | null
          expiry_date?: string | null
          flag_state?: string | null
          id?: string
          issue_date?: string | null
          issuing_authority?: string | null
          notes?: string | null
          offline_cached?: boolean | null
          profile_id: string
          status?: Database["public"]["Enums"]["cert_status"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          alert_days?: number[] | null
          cert_number?: string | null
          cert_type?: Database["public"]["Enums"]["cert_type"]
          created_at?: string | null
          document_url?: string | null
          expiry_date?: string | null
          flag_state?: string | null
          id?: string
          issue_date?: string | null
          issuing_authority?: string | null
          notes?: string | null
          offline_cached?: boolean | null
          profile_id?: string
          status?: Database["public"]["Enums"]["cert_status"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificates_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          avg_rating: number | null
          company_type: Database["public"]["Enums"]["company_type"]
          contract_accuracy_score: number | null
          country: string | null
          created_at: string
          id: string
          name: string
          pattern_flags: Json | null
          pay_reliability_score: number | null
          review_count: number | null
          safety_culture_score: number | null
          updated_at: string
          website: string | null
        }
        Insert: {
          avg_rating?: number | null
          company_type: Database["public"]["Enums"]["company_type"]
          contract_accuracy_score?: number | null
          country?: string | null
          created_at?: string | null
          id?: string
          name: string
          pattern_flags?: Json | null
          pay_reliability_score?: number | null
          review_count?: number | null
          safety_culture_score?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          avg_rating?: number | null
          company_type?: Database["public"]["Enums"]["company_type"]
          contract_accuracy_score?: number | null
          country?: string | null
          created_at?: string | null
          id?: string
          name?: string
          pattern_flags?: Json | null
          pay_reliability_score?: number | null
          review_count?: number | null
          safety_culture_score?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      company_follows: {
        Row: {
          company_id: string
          created_at: string
          id: string
          profile_id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          profile_id: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_follows_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_follows_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_members: {
        Row: {
          conversation_id: string
          id: string
          is_archived: boolean | null
          is_muted: boolean | null
          is_pinned: boolean | null
          joined_at: string | null
          last_read_at: string | null
          profile_id: string
          role: string | null
        }
        Insert: {
          conversation_id: string
          id?: string
          is_archived?: boolean | null
          is_muted?: boolean | null
          is_pinned?: boolean | null
          joined_at?: string | null
          last_read_at?: string | null
          profile_id: string
          role?: string | null
        }
        Update: {
          conversation_id?: string
          id?: string
          is_archived?: boolean | null
          is_muted?: boolean | null
          is_pinned?: boolean | null
          joined_at?: string | null
          last_read_at?: string | null
          profile_id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_members_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          access_mode: string | null
          auto_expire_hours: number | null
          auto_joinable: boolean | null
          category_id: string | null
          context_company_id: string | null
          context_port: string | null
          context_vessel_id: string | null
          country_code: string | null
          created_at: string
          created_by: string | null
          department_tags:
            | Database["public"]["Enums"]["department_type"][]
            | null
          description: string | null
          id: string
          is_encrypted: boolean | null
          is_featured: boolean | null
          is_system: boolean | null
          last_activity_at: string | null
          last_message_at: string | null
          last_message_preview: string | null
          max_members: number | null
          member_count: number | null
          name: string | null
          rank_tags: Database["public"]["Enums"]["rank_category"][] | null
          region_tag: string | null
          sector_tags: Database["public"]["Enums"]["vessel_type"][] | null
          slug: string | null
          sort_order: number | null
          type: Database["public"]["Enums"]["conversation_type"]
          updated_at: string
        }
        Insert: {
          access_mode?: string | null
          auto_expire_hours?: number | null
          auto_joinable?: boolean | null
          category_id?: string | null
          context_company_id?: string | null
          context_port?: string | null
          context_vessel_id?: string | null
          country_code?: string | null
          created_at?: string | null
          created_by?: string | null
          department_tags?:
            | Database["public"]["Enums"]["department_type"][]
            | null
          description?: string | null
          id?: string
          is_encrypted?: boolean | null
          is_featured?: boolean | null
          is_system?: boolean | null
          last_activity_at?: string | null
          last_message_at?: string | null
          last_message_preview?: string | null
          max_members?: number | null
          member_count?: number | null
          name?: string | null
          rank_tags?: Database["public"]["Enums"]["rank_category"][] | null
          region_tag?: string | null
          sector_tags?: Database["public"]["Enums"]["vessel_type"][] | null
          slug?: string | null
          sort_order?: number | null
          type: Database["public"]["Enums"]["conversation_type"]
          updated_at?: string | null
        }
        Update: {
          access_mode?: string | null
          auto_expire_hours?: number | null
          auto_joinable?: boolean | null
          category_id?: string | null
          context_company_id?: string | null
          context_port?: string | null
          context_vessel_id?: string | null
          country_code?: string | null
          created_at?: string | null
          created_by?: string | null
          department_tags?:
            | Database["public"]["Enums"]["department_type"][]
            | null
          description?: string | null
          id?: string
          is_encrypted?: boolean | null
          is_featured?: boolean | null
          is_system?: boolean | null
          last_activity_at?: string | null
          last_message_at?: string | null
          last_message_preview?: string | null
          max_members?: number | null
          member_count?: number | null
          name?: string | null
          rank_tags?: Database["public"]["Enums"]["rank_category"][] | null
          region_tag?: string | null
          sector_tags?: Database["public"]["Enums"]["vessel_type"][] | null
          slug?: string | null
          sort_order?: number | null
          type?: Database["public"]["Enums"]["conversation_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "channel_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_context_company_id_fkey"
            columns: ["context_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_context_vessel_id_fkey"
            columns: ["context_vessel_id"]
            isOneToOne: false
            referencedRelation: "vessels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crew_history: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          is_current: boolean | null
          joined_at: string | null
          left_at: string | null
          profile_id: string | null
          rank_held: string | null
          vessel_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_current?: boolean | null
          joined_at?: string | null
          left_at?: string | null
          profile_id?: string | null
          rank_held?: string | null
          vessel_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_current?: boolean | null
          joined_at?: string | null
          left_at?: string | null
          profile_id?: string | null
          rank_held?: string | null
          vessel_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crew_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crew_history_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crew_history_vessel_id_fkey"
            columns: ["vessel_id"]
            isOneToOne: false
            referencedRelation: "vessels"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      forum_posts: {
        Row: {
          body: string
          category_id: string
          created_at: string
          id: string
          is_anonymous: boolean | null
          is_pinned: boolean | null
          parent_id: string | null
          profile_id: string | null
          reply_count: number | null
          title: string | null
          updated_at: string
          upvote_count: number | null
        }
        Insert: {
          body: string
          category_id: string
          created_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          is_pinned?: boolean | null
          parent_id?: string | null
          profile_id?: string | null
          reply_count?: number | null
          title?: string | null
          updated_at?: string | null
          upvote_count?: number | null
        }
        Update: {
          body?: string
          category_id?: string
          created_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          is_pinned?: boolean | null
          parent_id?: string | null
          profile_id?: string | null
          reply_count?: number | null
          title?: string | null
          updated_at?: string | null
          upvote_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "forum_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_posts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_posts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_logs: {
        Row: {
          attachments: Json | null
          category: Database["public"]["Enums"]["incident_category"]
          company_id: string | null
          created_at: string
          description_encrypted: string | null
          id: string
          incident_date: string | null
          location: string | null
          profile_id: string
          title: string
          updated_at: string
          vessel_id: string | null
        }
        Insert: {
          attachments?: Json | null
          category: Database["public"]["Enums"]["incident_category"]
          company_id?: string | null
          created_at?: string | null
          description_encrypted?: string | null
          id?: string
          incident_date?: string | null
          location?: string | null
          profile_id: string
          title: string
          updated_at?: string | null
          vessel_id?: string | null
        }
        Update: {
          attachments?: Json | null
          category?: Database["public"]["Enums"]["incident_category"]
          company_id?: string | null
          created_at?: string | null
          description_encrypted?: string | null
          id?: string
          incident_date?: string | null
          location?: string | null
          profile_id?: string
          title?: string
          updated_at?: string | null
          vessel_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incident_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_logs_vessel_id_fkey"
            columns: ["vessel_id"]
            isOneToOne: false
            referencedRelation: "vessels"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          applicant_id: string
          cover_message: string | null
          created_at: string
          id: string
          job_id: string
          status: string | null
        }
        Insert: {
          applicant_id: string
          cover_message?: string | null
          created_at?: string | null
          id?: string
          job_id: string
          status?: string | null
        }
        Update: {
          applicant_id?: string
          cover_message?: string | null
          created_at?: string | null
          id?: string
          job_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      job_listings: {
        Row: {
          applications_count: number | null
          benefits: string[] | null
          company_id: string | null
          contract_months: number | null
          created_at: string
          currency: string | null
          department: string | null
          description: string
          embarkation_date: string | null
          embarkation_port: string | null
          expires_at: string | null
          id: string
          posted_by: string
          rank_required: string | null
          requirements: string[] | null
          salary_max: number | null
          salary_min: number | null
          status: string | null
          title: string
          updated_at: string
          vessel_type: string | null
        }
        Insert: {
          applications_count?: number | null
          benefits?: string[] | null
          company_id?: string | null
          contract_months?: number | null
          created_at?: string | null
          currency?: string | null
          department?: string | null
          description: string
          embarkation_date?: string | null
          embarkation_port?: string | null
          expires_at?: string | null
          id?: string
          posted_by: string
          rank_required?: string | null
          requirements?: string[] | null
          salary_max?: number | null
          salary_min?: number | null
          status?: string | null
          title: string
          updated_at?: string | null
          vessel_type?: string | null
        }
        Update: {
          applications_count?: number | null
          benefits?: string[] | null
          company_id?: string | null
          contract_months?: number | null
          created_at?: string | null
          currency?: string | null
          department?: string | null
          description?: string
          embarkation_date?: string | null
          embarkation_port?: string | null
          expires_at?: string | null
          id?: string
          posted_by?: string
          rank_required?: string | null
          requirements?: string[] | null
          salary_max?: number | null
          salary_min?: number | null
          status?: string | null
          title?: string
          updated_at?: string | null
          vessel_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_listings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: Json | null
          ciphertext: string | null
          conversation_id: string
          created_at: string
          edited_at: string | null
          expires_at: string | null
          id: string
          message_type: Database["public"]["Enums"]["message_type"] | null
          plaintext: string | null
          reactions: Json | null
          reply_to_id: string | null
          sender_id: string
        }
        Insert: {
          attachments?: Json | null
          ciphertext?: string | null
          conversation_id: string
          created_at?: string | null
          edited_at?: string | null
          expires_at?: string | null
          id?: string
          message_type?: Database["public"]["Enums"]["message_type"] | null
          plaintext?: string | null
          reactions?: Json | null
          reply_to_id?: string | null
          sender_id: string
        }
        Update: {
          attachments?: Json | null
          ciphertext?: string | null
          conversation_id?: string
          created_at?: string | null
          edited_at?: string | null
          expires_at?: string | null
          id?: string
          message_type?: Database["public"]["Enums"]["message_type"] | null
          plaintext?: string | null
          reactions?: Json | null
          reply_to_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean | null
          link: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      pay_reports: {
        Row: {
          company_id: string | null
          contract_duration_months: number | null
          created_at: string
          flag_state: string | null
          id: string
          is_verified: boolean | null
          leave_pay: boolean | null
          monthly_base_usd: number | null
          overtime_structure: string | null
          profile_id: string | null
          rank: string
          vessel_type: Database["public"]["Enums"]["vessel_type"]
          year: number
        }
        Insert: {
          company_id?: string | null
          contract_duration_months?: number | null
          created_at?: string | null
          flag_state?: string | null
          id?: string
          is_verified?: boolean | null
          leave_pay?: boolean | null
          monthly_base_usd?: number | null
          overtime_structure?: string | null
          profile_id?: string | null
          rank: string
          vessel_type: Database["public"]["Enums"]["vessel_type"]
          year: number
        }
        Update: {
          company_id?: string | null
          contract_duration_months?: number | null
          created_at?: string | null
          flag_state?: string | null
          id?: string
          is_verified?: boolean | null
          leave_pay?: boolean | null
          monthly_base_usd?: number | null
          overtime_structure?: string | null
          profile_id?: string | null
          rank?: string
          vessel_type?: Database["public"]["Enums"]["vessel_type"]
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "pay_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pay_reports_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_votes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          profile_id: string
          value: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          profile_id: string
          value: number
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          profile_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "post_votes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_votes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          auth_user_id: string
          available_for: string[] | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          current_port: string | null
          department_tag: Database["public"]["Enums"]["department_type"] | null
          display_name: string
          experience_band: Database["public"]["Enums"]["experience_band"] | null
          home_port: string | null
          id: string
          is_admin: boolean | null
          is_verified: boolean | null
          last_seen_at: string | null
          rank_range: Database["public"]["Enums"]["rank_category"] | null
          reputation_score: number | null
          subscription_tier:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          updated_at: string
          vessel_type_tags: Database["public"]["Enums"]["vessel_type"][] | null
        }
        Insert: {
          auth_user_id: string
          available_for?: string[] | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          current_port?: string | null
          department_tag?: Database["public"]["Enums"]["department_type"] | null
          display_name: string
          experience_band?:
            | Database["public"]["Enums"]["experience_band"]
            | null
          home_port?: string | null
          id?: string
          is_admin?: boolean | null
          is_verified?: boolean | null
          last_seen_at?: string | null
          rank_range?: Database["public"]["Enums"]["rank_category"] | null
          reputation_score?: number | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          updated_at?: string | null
          vessel_type_tags?: Database["public"]["Enums"]["vessel_type"][] | null
        }
        Update: {
          auth_user_id?: string
          available_for?: string[] | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          current_port?: string | null
          department_tag?: Database["public"]["Enums"]["department_type"] | null
          display_name?: string
          experience_band?:
            | Database["public"]["Enums"]["experience_band"]
            | null
          home_port?: string | null
          id?: string
          is_admin?: boolean | null
          is_verified?: boolean | null
          last_seen_at?: string | null
          rank_range?: Database["public"]["Enums"]["rank_category"] | null
          reputation_score?: number | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          updated_at?: string | null
          vessel_type_tags?: Database["public"]["Enums"]["vessel_type"][] | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          profile_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          profile_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reported_content: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_id: string
          reviewed_by: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string | null
          details?: string | null
          id?: string
          reason: string
          reporter_id: string
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string | null
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reported_content_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          batch_release_at: string | null
          company_id: string | null
          contract_period: string | null
          created_at: string
          id: string
          is_anonymous: boolean | null
          narrative: string | null
          profile_id: string | null
          ratings: Json
          report_count: number | null
          review_type: Database["public"]["Enums"]["review_type"]
          status: Database["public"]["Enums"]["review_status"] | null
          updated_at: string
          upvote_count: number | null
          vessel_id: string | null
        }
        Insert: {
          batch_release_at?: string | null
          company_id?: string | null
          contract_period?: string | null
          created_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          narrative?: string | null
          profile_id?: string | null
          ratings?: Json
          report_count?: number | null
          review_type: Database["public"]["Enums"]["review_type"]
          status?: Database["public"]["Enums"]["review_status"] | null
          updated_at?: string | null
          upvote_count?: number | null
          vessel_id?: string | null
        }
        Update: {
          batch_release_at?: string | null
          company_id?: string | null
          contract_period?: string | null
          created_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          narrative?: string | null
          profile_id?: string | null
          ratings?: Json
          report_count?: number | null
          review_type?: Database["public"]["Enums"]["review_type"]
          status?: Database["public"]["Enums"]["review_status"] | null
          updated_at?: string | null
          upvote_count?: number | null
          vessel_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_vessel_id_fkey"
            columns: ["vessel_id"]
            isOneToOne: false
            referencedRelation: "vessels"
            referencedColumns: ["id"]
          },
        ]
      }
      sea_time_records: {
        Row: {
          company_id: string | null
          created_at: string
          days: number
          end_date: string | null
          id: string
          notes: string | null
          profile_id: string
          rank_held: string
          start_date: string | null
          vessel_id: string | null
          vessel_type: Database["public"]["Enums"]["vessel_type"]
          year: number
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          days: number
          end_date?: string | null
          id?: string
          notes?: string | null
          profile_id: string
          rank_held: string
          start_date?: string | null
          vessel_id?: string | null
          vessel_type: Database["public"]["Enums"]["vessel_type"]
          year: number
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          days?: number
          end_date?: string | null
          id?: string
          notes?: string | null
          profile_id?: string
          rank_held?: string
          start_date?: string | null
          vessel_id?: string | null
          vessel_type?: Database["public"]["Enums"]["vessel_type"]
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "sea_time_records_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sea_time_records_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sea_time_records_vessel_id_fkey"
            columns: ["vessel_id"]
            isOneToOne: false
            referencedRelation: "vessels"
            referencedColumns: ["id"]
          },
        ]
      }
      search_analytics: {
        Row: {
          created_at: string
          filters: Json | null
          id: string
          result_count: number | null
          search_query: string
          search_type: string
        }
        Insert: {
          created_at?: string | null
          filters?: Json | null
          id?: string
          result_count?: number | null
          search_query: string
          search_type: string
        }
        Update: {
          created_at?: string | null
          filters?: Json | null
          id?: string
          result_count?: number | null
          search_query?: string
          search_type?: string
        }
        Relationships: []
      }
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          allow_reconnect: boolean
          created_at: string
          email_cert_expiry: boolean
          email_messages: boolean
          font_size: string
          id: string
          profile_id: string
          push_notifications: boolean
          show_online: boolean
          show_profile: boolean
          updated_at: string
        }
        Insert: {
          allow_reconnect?: boolean
          created_at?: string
          email_cert_expiry?: boolean
          email_messages?: boolean
          font_size?: string
          id?: string
          profile_id: string
          push_notifications?: boolean
          show_online?: boolean
          show_profile?: boolean
          updated_at?: string
        }
        Update: {
          allow_reconnect?: boolean
          created_at?: string
          email_cert_expiry?: boolean
          email_messages?: boolean
          font_size?: string
          id?: string
          profile_id?: string
          push_notifications?: boolean
          show_online?: boolean
          show_profile?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_access_log: {
        Row: {
          access_reason: string
          accessed_at: string | null
          accessed_by: string
          id: string
          identity_id: string | null
        }
        Insert: {
          access_reason: string
          accessed_at?: string | null
          accessed_by: string
          id?: string
          identity_id?: string | null
        }
        Update: {
          access_reason?: string
          accessed_at?: string | null
          accessed_by?: string
          id?: string
          identity_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vault_access_log_identity_id_fkey"
            columns: ["identity_id"]
            isOneToOne: false
            referencedRelation: "vault_verified_identities"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_verified_identities: {
        Row: {
          coc_number_hash: string | null
          created_at: string
          department: Database["public"]["Enums"]["department_type"] | null
          document_refs: Json | null
          flag_state: string | null
          full_name_encrypted: string
          id: string
          notes: string | null
          platform_token: string
          rank_category: Database["public"]["Enums"]["rank_category"] | null
          updated_at: string
          verification_method:
            | Database["public"]["Enums"]["verification_method"]
            | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at: string | null
        }
        Insert: {
          coc_number_hash?: string | null
          created_at?: string | null
          department?: Database["public"]["Enums"]["department_type"] | null
          document_refs?: Json | null
          flag_state?: string | null
          full_name_encrypted: string
          id?: string
          notes?: string | null
          platform_token: string
          rank_category?: Database["public"]["Enums"]["rank_category"] | null
          updated_at?: string | null
          verification_method?:
            | Database["public"]["Enums"]["verification_method"]
            | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at?: string | null
        }
        Update: {
          coc_number_hash?: string | null
          created_at?: string | null
          department?: Database["public"]["Enums"]["department_type"] | null
          document_refs?: Json | null
          flag_state?: string | null
          full_name_encrypted?: string
          id?: string
          notes?: string | null
          platform_token?: string
          rank_category?: Database["public"]["Enums"]["rank_category"] | null
          updated_at?: string | null
          verification_method?:
            | Database["public"]["Enums"]["verification_method"]
            | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at?: string | null
        }
        Relationships: []
      }
      vessels: {
        Row: {
          avg_rating: number | null
          built_year: number | null
          created_at: string
          dwt: number | null
          flag_state: string | null
          id: string
          imo_number: string | null
          manager_company_id: string | null
          name: string
          operator_company_id: string | null
          owner_company_id: string | null
          review_count: number | null
          updated_at: string
          vessel_type: Database["public"]["Enums"]["vessel_type"] | null
        }
        Insert: {
          avg_rating?: number | null
          built_year?: number | null
          created_at?: string | null
          dwt?: number | null
          flag_state?: string | null
          id?: string
          imo_number?: string | null
          manager_company_id?: string | null
          name: string
          operator_company_id?: string | null
          owner_company_id?: string | null
          review_count?: number | null
          updated_at?: string | null
          vessel_type?: Database["public"]["Enums"]["vessel_type"] | null
        }
        Update: {
          avg_rating?: number | null
          built_year?: number | null
          created_at?: string | null
          dwt?: number | null
          flag_state?: string | null
          id?: string
          imo_number?: string | null
          manager_company_id?: string | null
          name?: string
          operator_company_id?: string | null
          owner_company_id?: string | null
          review_count?: number | null
          updated_at?: string | null
          vessel_type?: Database["public"]["Enums"]["vessel_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "vessels_manager_company_id_fkey"
            columns: ["manager_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vessels_operator_company_id_fkey"
            columns: ["operator_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vessels_owner_company_id_fkey"
            columns: ["owner_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_messages: { Args: never; Returns: undefined }
      find_mutual_crew: {
        Args: { p_profile_id: string }
        Returns: {
          avatar_url: string
          display_name: string
          profile_id: string
          shared_vessel_count: number
          shared_vessels: Json
        }[]
      }
      get_pay_percentiles: {
        Args: {
          p_flag_state?: string
          p_rank: string
          p_vessel_type?: Database["public"]["Enums"]["vessel_type"]
        }
        Returns: Json
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      cert_status: "valid" | "expiring" | "expired"
      cert_type:
        | "coc"
        | "stcw"
        | "medical"
        | "visa"
        | "endorsement"
        | "short_course"
        | "flag_state"
        | "gmdss"
        | "other"
      company_type: "owner" | "operator" | "manager" | "manning_agency"
      conversation_type:
        | "dm"
        | "group"
        | "vessel_channel"
        | "company_channel"
        | "port_channel"
        | "channel"
      department_type: "deck" | "engine" | "electro" | "catering"
      experience_band: "0_2y" | "3_5y" | "6_10y" | "10y_plus"
      incident_category:
        | "safety"
        | "maintenance"
        | "wages"
        | "harassment"
        | "contract"
        | "other"
      message_type: "text" | "image" | "file" | "system"
      rank_category: "officer" | "rating" | "cadet"
      review_status: "pending" | "published" | "flagged" | "removed"
      review_type: "company" | "vessel" | "manning_agency"
      subscription_tier: "free" | "premium"
      verification_method: "document" | "peer" | "cross_check"
      verification_status: "pending" | "verified" | "rejected"
      vessel_type:
        | "tanker"
        | "bulk_carrier"
        | "container"
        | "general_cargo"
        | "offshore"
        | "passenger"
        | "roro"
        | "lng"
        | "lpg"
        | "chemical"
        | "reefer"
        | "tug"
        | "fishing"
        | "other"
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
      cert_status: ["valid", "expiring", "expired"],
      cert_type: [
        "coc",
        "stcw",
        "medical",
        "visa",
        "endorsement",
        "short_course",
        "flag_state",
        "gmdss",
        "other",
      ],
      company_type: ["owner", "operator", "manager", "manning_agency"],
      conversation_type: [
        "dm",
        "group",
        "vessel_channel",
        "company_channel",
        "port_channel",
        "channel",
      ],
      department_type: ["deck", "engine", "electro", "catering"],
      experience_band: ["0_2y", "3_5y", "6_10y", "10y_plus"],
      incident_category: [
        "safety",
        "maintenance",
        "wages",
        "harassment",
        "contract",
        "other",
      ],
      message_type: ["text", "image", "file", "system"],
      rank_category: ["officer", "rating", "cadet"],
      review_status: ["pending", "published", "flagged", "removed"],
      review_type: ["company", "vessel", "manning_agency"],
      subscription_tier: ["free", "premium"],
      verification_method: ["document", "peer", "cross_check"],
      verification_status: ["pending", "verified", "rejected"],
      vessel_type: [
        "tanker",
        "bulk_carrier",
        "container",
        "general_cargo",
        "offshore",
        "passenger",
        "roro",
        "lng",
        "lpg",
        "chemical",
        "reefer",
        "tug",
        "fishing",
        "other",
      ],
    },
  },
} as const
