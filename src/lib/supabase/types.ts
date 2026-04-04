export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          auth_user_id: string;
          display_name: string;
          avatar_url: string | null;
          is_verified: boolean;
          department_tag: Database["public"]["Enums"]["department_type"] | null;
          rank_range: Database["public"]["Enums"]["rank_category"] | null;
          experience_band: Database["public"]["Enums"]["experience_band"] | null;
          vessel_type_tags: Database["public"]["Enums"]["vessel_type"][] | null;
          reputation_score: number;
          subscription_tier: Database["public"]["Enums"]["subscription_tier"];
          bio: string | null;
          current_port: string | null;
          available_for: string[];
          home_port: string | null;
          last_seen_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id: string;
          display_name: string;
          avatar_url?: string | null;
          is_verified?: boolean;
          department_tag?: Database["public"]["Enums"]["department_type"] | null;
          rank_range?: Database["public"]["Enums"]["rank_category"] | null;
          experience_band?: Database["public"]["Enums"]["experience_band"] | null;
          vessel_type_tags?: Database["public"]["Enums"]["vessel_type"][] | null;
          reputation_score?: number;
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"];
          bio?: string | null;
          current_port?: string | null;
          available_for?: string[];
          home_port?: string | null;
          last_seen_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          auth_user_id?: string;
          display_name?: string;
          avatar_url?: string | null;
          is_verified?: boolean;
          department_tag?: Database["public"]["Enums"]["department_type"] | null;
          rank_range?: Database["public"]["Enums"]["rank_category"] | null;
          experience_band?: Database["public"]["Enums"]["experience_band"] | null;
          vessel_type_tags?: Database["public"]["Enums"]["vessel_type"][] | null;
          reputation_score?: number;
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"];
          bio?: string | null;
          current_port?: string | null;
          available_for?: string[];
          home_port?: string | null;
          last_seen_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      companies: {
        Row: {
          id: string;
          name: string;
          company_type: Database["public"]["Enums"]["company_type"];
          country: string | null;
          avg_rating: number | null;
          review_count: number;
          pay_reliability_score: number | null;
          safety_culture_score: number | null;
          contract_accuracy_score: number | null;
          pattern_flags: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          company_type: Database["public"]["Enums"]["company_type"];
          country?: string | null;
          avg_rating?: number | null;
          review_count?: number;
          pay_reliability_score?: number | null;
          safety_culture_score?: number | null;
          contract_accuracy_score?: number | null;
          pattern_flags?: Json | null;
        };
        Update: {
          name?: string;
          company_type?: Database["public"]["Enums"]["company_type"];
          country?: string | null;
          avg_rating?: number | null;
          review_count?: number;
          pay_reliability_score?: number | null;
          safety_culture_score?: number | null;
          contract_accuracy_score?: number | null;
          pattern_flags?: Json | null;
        };
        Relationships: [];
      };
      vessels: {
        Row: {
          id: string;
          imo_number: string;
          name: string;
          vessel_type: Database["public"]["Enums"]["vessel_type"];
          flag_state: string | null;
          dwt: number | null;
          built_year: number | null;
          owner_company_id: string | null;
          operator_company_id: string | null;
          manager_company_id: string | null;
          avg_rating: number | null;
          review_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          imo_number: string;
          name: string;
          vessel_type: Database["public"]["Enums"]["vessel_type"];
          flag_state?: string | null;
          dwt?: number | null;
          built_year?: number | null;
          owner_company_id?: string | null;
          operator_company_id?: string | null;
          manager_company_id?: string | null;
        };
        Update: {
          imo_number?: string;
          name?: string;
          vessel_type?: Database["public"]["Enums"]["vessel_type"];
          flag_state?: string | null;
          dwt?: number | null;
          built_year?: number | null;
          owner_company_id?: string | null;
          operator_company_id?: string | null;
          manager_company_id?: string | null;
          avg_rating?: number | null;
          review_count?: number;
        };
        Relationships: [];
      };
      crew_history: {
        Row: {
          id: string;
          profile_id: string;
          vessel_id: string;
          company_id: string | null;
          rank_held: string;
          joined_at: string | null;
          left_at: string | null;
          is_current: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          vessel_id: string;
          company_id?: string | null;
          rank_held: string;
          joined_at?: string | null;
          left_at?: string | null;
          is_current?: boolean;
        };
        Update: {
          profile_id?: string;
          vessel_id?: string;
          company_id?: string | null;
          rank_held?: string;
          joined_at?: string | null;
          left_at?: string | null;
          is_current?: boolean;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          profile_id: string;
          company_id: string | null;
          vessel_id: string | null;
          review_type: Database["public"]["Enums"]["review_type"];
          contract_period: string | null;
          ratings: Json;
          narrative: string | null;
          is_anonymous: boolean;
          batch_release_at: string | null;
          status: Database["public"]["Enums"]["review_status"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          company_id?: string | null;
          vessel_id?: string | null;
          review_type: Database["public"]["Enums"]["review_type"];
          contract_period?: string | null;
          ratings: Json;
          narrative?: string | null;
          is_anonymous?: boolean;
          batch_release_at?: string | null;
          status?: Database["public"]["Enums"]["review_status"];
        };
        Update: {
          company_id?: string | null;
          vessel_id?: string | null;
          review_type?: Database["public"]["Enums"]["review_type"];
          contract_period?: string | null;
          ratings?: Json;
          narrative?: string | null;
          is_anonymous?: boolean;
          batch_release_at?: string | null;
          status?: Database["public"]["Enums"]["review_status"];
        };
        Relationships: [];
      };
      pay_reports: {
        Row: {
          id: string;
          profile_id: string;
          rank: string;
          vessel_type: Database["public"]["Enums"]["vessel_type"];
          flag_state: string | null;
          company_id: string | null;
          monthly_base_usd: number;
          overtime_structure: string | null;
          leave_pay: string | null;
          contract_duration_months: number | null;
          year: number;
          is_verified: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          rank: string;
          vessel_type: Database["public"]["Enums"]["vessel_type"];
          flag_state?: string | null;
          company_id?: string | null;
          monthly_base_usd: number;
          overtime_structure?: string | null;
          leave_pay?: string | null;
          contract_duration_months?: number | null;
          year: number;
          is_verified?: boolean;
        };
        Update: {
          rank?: string;
          vessel_type?: Database["public"]["Enums"]["vessel_type"];
          flag_state?: string | null;
          company_id?: string | null;
          monthly_base_usd?: number;
          overtime_structure?: string | null;
          leave_pay?: string | null;
          contract_duration_months?: number | null;
          year?: number;
          is_verified?: boolean;
        };
        Relationships: [];
      };
      certificates: {
        Row: {
          id: string;
          profile_id: string;
          cert_type: Database["public"]["Enums"]["cert_type"];
          title: string;
          cert_number: string | null;
          issuing_authority: string | null;
          flag_state: string | null;
          issue_date: string | null;
          expiry_date: string | null;
          document_url: string | null;
          alert_days: number[];
          status: Database["public"]["Enums"]["cert_status"];
          offline_cached: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          cert_type: Database["public"]["Enums"]["cert_type"];
          title: string;
          cert_number?: string | null;
          issuing_authority?: string | null;
          flag_state?: string | null;
          issue_date?: string | null;
          expiry_date?: string | null;
          document_url?: string | null;
          alert_days?: number[];
          offline_cached?: boolean;
        };
        Update: {
          cert_type?: Database["public"]["Enums"]["cert_type"];
          title?: string;
          cert_number?: string | null;
          issuing_authority?: string | null;
          flag_state?: string | null;
          issue_date?: string | null;
          expiry_date?: string | null;
          document_url?: string | null;
          alert_days?: number[];
          offline_cached?: boolean;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          type: Database["public"]["Enums"]["conversation_type"];
          name: string | null;
          description: string | null;
          context_vessel_id: string | null;
          context_company_id: string | null;
          context_port: string | null;
          is_encrypted: boolean;
          auto_expire_hours: number | null;
          max_members: number | null;
          created_by: string | null;
          last_message_preview: string | null;
          last_message_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: Database["public"]["Enums"]["conversation_type"];
          name?: string | null;
          description?: string | null;
          context_vessel_id?: string | null;
          context_company_id?: string | null;
          context_port?: string | null;
          is_encrypted?: boolean;
          auto_expire_hours?: number | null;
          max_members?: number | null;
          created_by?: string | null;
          last_message_preview?: string | null;
          last_message_at?: string | null;
        };
        Update: {
          type?: Database["public"]["Enums"]["conversation_type"];
          name?: string | null;
          description?: string | null;
          context_vessel_id?: string | null;
          context_company_id?: string | null;
          context_port?: string | null;
          is_encrypted?: boolean;
          auto_expire_hours?: number | null;
          max_members?: number | null;
          created_by?: string | null;
          last_message_preview?: string | null;
          last_message_at?: string | null;
        };
        Relationships: [];
      };
      conversation_members: {
        Row: {
          id: string;
          conversation_id: string;
          profile_id: string;
          role: string;
          last_read_at: string | null;
          is_muted: boolean;
          is_pinned: boolean;
          is_archived: boolean;
          joined_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          profile_id: string;
          role?: string;
          last_read_at?: string | null;
          is_muted?: boolean;
          is_pinned?: boolean;
          is_archived?: boolean;
        };
        Update: {
          role?: string;
          last_read_at?: string | null;
          is_muted?: boolean;
          is_pinned?: boolean;
          is_archived?: boolean;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          ciphertext: string | null;
          plaintext: string | null;
          message_type: Database["public"]["Enums"]["message_type"];
          reply_to_id: string | null;
          reactions: Json;
          attachments: Json;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          ciphertext?: string | null;
          plaintext?: string | null;
          message_type?: Database["public"]["Enums"]["message_type"];
          reply_to_id?: string | null;
          reactions?: Json;
          attachments?: Json;
          expires_at?: string | null;
        };
        Update: {
          ciphertext?: string | null;
          plaintext?: string | null;
          message_type?: Database["public"]["Enums"]["message_type"];
          reply_to_id?: string | null;
          reactions?: Json;
          attachments?: Json;
          expires_at?: string | null;
        };
        Relationships: [];
      };
      incident_logs: {
        Row: {
          id: string;
          profile_id: string;
          title: string;
          description_encrypted: string | null;
          category: Database["public"]["Enums"]["incident_category"];
          attachments: Json | null;
          vessel_id: string | null;
          company_id: string | null;
          incident_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          title: string;
          description_encrypted?: string | null;
          category: Database["public"]["Enums"]["incident_category"];
          attachments?: Json | null;
          vessel_id?: string | null;
          company_id?: string | null;
          incident_date?: string | null;
        };
        Update: {
          title?: string;
          description_encrypted?: string | null;
          category?: Database["public"]["Enums"]["incident_category"];
          attachments?: Json | null;
          vessel_id?: string | null;
          company_id?: string | null;
          incident_date?: string | null;
        };
        Relationships: [];
      };
      forum_categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          post_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          post_count?: number;
        };
        Update: {
          name?: string;
          slug?: string;
          description?: string | null;
          post_count?: number;
        };
        Relationships: [];
      };
      forum_posts: {
        Row: {
          id: string;
          category_id: string;
          profile_id: string;
          title: string | null;
          body: string;
          parent_id: string | null;
          is_anonymous: boolean;
          is_pinned: boolean;
          upvote_count: number;
          reply_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          profile_id: string;
          title?: string | null;
          body: string;
          parent_id?: string | null;
          is_anonymous?: boolean;
          is_pinned?: boolean;
          upvote_count?: number;
          reply_count?: number;
        };
        Update: {
          category_id?: string;
          title?: string | null;
          body?: string;
          parent_id?: string | null;
          is_anonymous?: boolean;
          is_pinned?: boolean;
          upvote_count?: number;
          reply_count?: number;
        };
        Relationships: [];
      };
      post_votes: {
        Row: {
          id: string;
          post_id: string;
          profile_id: string;
          value: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          profile_id: string;
          value: number;
        };
        Update: {
          value?: number;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          body: string | null;
          link: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          body?: string | null;
          link?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          type?: string;
          title?: string;
          body?: string | null;
          link?: string | null;
          is_read?: boolean;
        };
        Relationships: [];
      };
      job_listings: {
        Row: {
          id: string;
          posted_by: string;
          company_id: string | null;
          title: string;
          description: string;
          vessel_type: string | null;
          department: string | null;
          rank_required: string | null;
          contract_months: number | null;
          salary_min: number | null;
          salary_max: number | null;
          currency: string;
          embarkation_port: string | null;
          embarkation_date: string | null;
          requirements: string[] | null;
          benefits: string[] | null;
          status: string;
          applications_count: number;
          created_at: string;
          updated_at: string;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          posted_by: string;
          company_id?: string | null;
          title: string;
          description: string;
          vessel_type?: string | null;
          department?: string | null;
          rank_required?: string | null;
          contract_months?: number | null;
          salary_min?: number | null;
          salary_max?: number | null;
          currency?: string;
          embarkation_port?: string | null;
          embarkation_date?: string | null;
          requirements?: string[] | null;
          benefits?: string[] | null;
          status?: string;
          applications_count?: number;
          expires_at?: string | null;
        };
        Update: {
          posted_by?: string;
          company_id?: string | null;
          title?: string;
          description?: string;
          vessel_type?: string | null;
          department?: string | null;
          rank_required?: string | null;
          contract_months?: number | null;
          salary_min?: number | null;
          salary_max?: number | null;
          currency?: string;
          embarkation_port?: string | null;
          embarkation_date?: string | null;
          requirements?: string[] | null;
          benefits?: string[] | null;
          status?: string;
          applications_count?: number;
          expires_at?: string | null;
        };
        Relationships: [];
      };
      job_applications: {
        Row: {
          id: string;
          job_id: string;
          applicant_id: string;
          cover_message: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          applicant_id: string;
          cover_message?: string | null;
          status?: string;
        };
        Update: {
          cover_message?: string | null;
          status?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Enums: {
      verification_status: "unverified" | "pending" | "verified" | "rejected";
      verification_method: "manual" | "document" | "api";
      rank_category: "officer" | "rating" | "cadet";
      department_type: "deck" | "engine" | "electro" | "catering";
      company_type: "owner" | "operator" | "manager" | "manning_agency";
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
        | "other";
      cert_type:
        | "coc"
        | "stcw"
        | "medical"
        | "visa"
        | "endorsement"
        | "short_course"
        | "flag_state"
        | "gmdss"
        | "other";
      cert_status: "valid" | "expiring" | "expired";
      review_type: "company" | "vessel" | "manning_agency";
      review_status: "pending" | "published" | "flagged" | "removed";
      conversation_type: "dm" | "group" | "vessel_channel" | "company_channel" | "port_channel" | "channel";
      message_type: "text" | "image" | "file" | "system";
      incident_category: "safety" | "maintenance" | "wages" | "harassment" | "contract" | "other";
      subscription_tier: "free" | "premium";
      experience_band: "0_2y" | "3_5y" | "6_10y" | "10y_plus";
    };
    Functions: {
      get_pay_percentiles: {
        Args: {
          p_rank: string;
          p_vessel_type?: Database["public"]["Enums"]["vessel_type"];
          p_flag_state?: string;
        };
        Returns: Json;
      };
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
