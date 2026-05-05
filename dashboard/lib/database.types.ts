/**
 * Auto-generated database types from Supabase
 * Generated from: https://supabase.com/docs/guides/api/rest/generating-types
 */

export interface Database {
  public: {
    Tables: {
      tools: {
        Row: {
          id: string;
          name: string;
          url: string;
          cookie_domain: string;
          cookies_json: string;
          icon_url: string | null;
          created_at: string;
          is_active: boolean;
          cookie_updated_at: string;
          max_concurrent_users: number | null;
        };
        Insert: {
          id?: string;
          name: string;
          url: string;
          cookie_domain: string;
          cookies_json: string;
          icon_url?: string | null;
          created_at?: string;
          is_active?: boolean;
          cookie_updated_at?: string;
          max_concurrent_users?: number | null;
        };
        Update: {
          id?: string;
          name?: string;
          url?: string;
          cookie_domain?: string;
          cookies_json?: string;
          icon_url?: string | null;
          created_at?: string;
          is_active?: boolean;
          cookie_updated_at?: string;
          max_concurrent_users?: number | null;
        };
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          created_at: string;
          is_active: boolean;
          password_set: boolean;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          created_at?: string;
          is_active?: boolean;
          password_set?: boolean;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          created_at?: string;
          is_active?: boolean;
          password_set?: boolean;
        };
        Relationships: [];
      };
      access_grants: {
        Row: {
          id: string;
          user_id: string;
          tool_id: string;
          granted_at: string;
          expires_at: string | null;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          tool_id: string;
          granted_at?: string;
          expires_at?: string | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          tool_id?: string;
          granted_at?: string;
          expires_at?: string | null;
          is_active?: boolean;
        };
        Relationships: [];
      };
      usage_logs: {
        Row: {
          id: string;
          user_id: string;
          tool_id: string;
          accessed_at: string;
          action: string;
          extension_version: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          tool_id: string;
          accessed_at?: string;
          action?: string;
          extension_version?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          tool_id?: string;
          accessed_at?: string;
          action?: string;
          extension_version?: string | null;
        };
        Relationships: [];
      };
      active_sessions: {
        Row: {
          id: string;
          user_id: string;
          tool_id: string;
          session_start: string;
          session_end: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          tool_id: string;
          session_start?: string;
          session_end?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          tool_id?: string;
          session_start?: string;
          session_end?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}
