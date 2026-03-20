export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: "user" | "admin";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: "user" | "admin";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: "user" | "admin";
          created_at?: string;
          updated_at?: string;
        };
      };
      credits: {
        Row: {
          id: string;
          user_id: string;
          balance: number;
          lifetime_purchased: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          balance?: number;
          lifetime_purchased?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          balance?: number;
          lifetime_purchased?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          type: "purchase" | "usage" | "refund" | "bonus";
          amount: number;
          description: string | null;
          stripe_payment_intent_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: "purchase" | "usage" | "refund" | "bonus";
          amount: number;
          description?: string | null;
          stripe_payment_intent_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: "purchase" | "usage" | "refund" | "bonus";
          amount?: number;
          description?: string | null;
          stripe_payment_intent_id?: string | null;
          created_at?: string;
        };
      };
      conversions: {
        Row: {
          id: string;
          user_id: string;
          original_url: string;
          result_url: string | null;
          original_filename: string;
          status: "pending" | "processing" | "completed" | "failed";
          error_message: string | null;
          model_used: string;
          api_cost: number | null;
          processing_time_ms: number | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          original_url: string;
          result_url?: string | null;
          original_filename: string;
          status?: "pending" | "processing" | "completed" | "failed";
          error_message?: string | null;
          model_used?: string;
          api_cost?: number | null;
          processing_time_ms?: number | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          original_url?: string;
          result_url?: string | null;
          original_filename?: string;
          status?: "pending" | "processing" | "completed" | "failed";
          error_message?: string | null;
          model_used?: string;
          api_cost?: number | null;
          processing_time_ms?: number | null;
          created_at?: string;
          completed_at?: string | null;
        };
      };
      api_logs: {
        Row: {
          id: string;
          user_id: string | null;
          endpoint: string;
          method: string;
          model: string;
          input_tokens: number | null;
          output_tokens: number | null;
          cost_usd: number | null;
          latency_ms: number | null;
          status_code: number;
          error: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          endpoint: string;
          method: string;
          model: string;
          input_tokens?: number | null;
          output_tokens?: number | null;
          cost_usd?: number | null;
          latency_ms?: number | null;
          status_code: number;
          error?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          endpoint?: string;
          method?: string;
          model?: string;
          input_tokens?: number | null;
          output_tokens?: number | null;
          cost_usd?: number | null;
          latency_ms?: number | null;
          status_code?: number;
          error?: string | null;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: "user" | "admin";
      transaction_type: "purchase" | "usage" | "refund" | "bonus";
      conversion_status: "pending" | "processing" | "completed" | "failed";
    };
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Credits = Database["public"]["Tables"]["credits"]["Row"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
export type Conversion = Database["public"]["Tables"]["conversions"]["Row"];
export type ApiLog = Database["public"]["Tables"]["api_logs"]["Row"];
