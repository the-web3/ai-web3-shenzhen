export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      vendors: {
        Row: {
          id: number;
          vendor_id: number;
          vendor_name: string;
          vendor_address: string;
          fee_recipient: string;
          is_active: boolean;
          event_pod: string;
          orderbook_pod: string;
          funding_pod: string;
          feevault_pod: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          vendor_id: number;
          vendor_name: string;
          vendor_address: string;
          fee_recipient: string;
          is_active?: boolean;
          event_pod: string;
          orderbook_pod: string;
          funding_pod: string;
          feevault_pod: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          vendor_id?: number;
          vendor_name?: string;
          vendor_address?: string;
          fee_recipient?: string;
          is_active?: boolean;
          event_pod?: string;
          orderbook_pod?: string;
          funding_pod?: string;
          feevault_pod?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      vendor_invite_codes: {
        Row: {
          id: number;
          vendor_id: number;
          code: string;
          status: number;
          max_uses: number;
          used_count: number;
          expires_at: string | null;
          created_by: string;
          created_at: string;
          revoked_at: string | null;
        };
        Insert: {
          id?: number;
          vendor_id: number;
          code: string;
          status?: number;
          max_uses?: number;
          used_count?: number;
          expires_at?: string | null;
          created_by: string;
          created_at?: string;
          revoked_at?: string | null;
        };
        Update: {
          id?: number;
          vendor_id?: number;
          code?: string;
          status?: number;
          max_uses?: number;
          used_count?: number;
          expires_at?: string | null;
          created_by?: string;
          created_at?: string;
          revoked_at?: string | null;
        };
      };
      user_vendors: {
        Row: {
          id: number;
          user_address: string;
          vendor_id: number;
          joined_at: string;
          joined_via_invite_id: number | null;
          status: number;
        };
        Insert: {
          id?: number;
          user_address: string;
          vendor_id: number;
          joined_at?: string;
          joined_via_invite_id?: number | null;
          status?: number;
        };
        Update: {
          id?: number;
          user_address?: string;
          vendor_id?: number;
          joined_at?: string;
          joined_via_invite_id?: number | null;
          status?: number;
        };
      };
      events: {
        Row: {
          id: number;
          vendor_id: number;
          event_id: number;
          title: string;
          description: string | null;
          deadline: string;
          settlement_time: string;
          status: number;
          creator_address: string;
          winning_outcome_index: number | null;
          outcome_count: number;
          outcomes: Json;
          prize_pool: string;
          volume: string;
          created_at: string;
          updated_at: string;
          settled_at: string | null;
        };
        Insert: {
          id?: number;
          vendor_id: number;
          event_id: number;
          title: string;
          description?: string | null;
          deadline: string;
          settlement_time: string;
          status: number;
          creator_address: string;
          winning_outcome_index?: number | null;
          outcome_count: number;
          outcomes: Json;
          prize_pool?: string;
          volume?: string;
          created_at?: string;
          updated_at?: string;
          settled_at?: string | null;
        };
        Update: {
          id?: number;
          vendor_id?: number;
          event_id?: number;
          title?: string;
          description?: string | null;
          deadline?: string;
          settlement_time?: string;
          status?: number;
          creator_address?: string;
          winning_outcome_index?: number | null;
          outcome_count?: number;
          outcomes?: Json;
          prize_pool?: string;
          volume?: string;
          created_at?: string;
          updated_at?: string;
          settled_at?: string | null;
        };
      };
      orders: {
        Row: {
          id: number;
          vendor_id: number;
          order_id: number;
          user_address: string;
          event_id: number;
          outcome_index: number;
          side: number;
          price: number;
          amount: string;
          filled_amount: string;
          remaining_amount: string;
          status: number;
          token_address: string;
          tx_hash: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          vendor_id: number;
          order_id: number;
          user_address: string;
          event_id: number;
          outcome_index: number;
          side: number;
          price: number;
          amount: string;
          filled_amount?: string;
          remaining_amount: string;
          status: number;
          token_address: string;
          tx_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          vendor_id?: number;
          order_id?: number;
          user_address?: string;
          event_id?: number;
          outcome_index?: number;
          side?: number;
          price?: number;
          amount?: string;
          filled_amount?: string;
          remaining_amount?: string;
          status?: number;
          token_address?: string;
          tx_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_balances: {
        Row: {
          id: number;
          vendor_id: number;
          user_address: string;
          token_address: string;
          available_balance: string;
          locked_balance: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          vendor_id: number;
          user_address: string;
          token_address: string;
          available_balance?: string;
          locked_balance?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          vendor_id?: number;
          user_address?: string;
          token_address?: string;
          available_balance?: string;
          locked_balance?: string;
          updated_at?: string;
        };
      };
      positions: {
        Row: {
          id: number;
          vendor_id: number;
          user_address: string;
          event_id: number;
          outcome_index: number;
          token_address: string;
          amount: string;
          avg_cost: string | null;
          updated_at: string;
        };
        Insert: {
          id?: number;
          vendor_id: number;
          user_address: string;
          event_id: number;
          outcome_index: number;
          token_address: string;
          amount: string;
          avg_cost?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: number;
          vendor_id?: number;
          user_address?: string;
          event_id?: number;
          outcome_index?: number;
          token_address?: string;
          amount?: string;
          avg_cost?: string | null;
          updated_at?: string;
        };
      };
      trades: {
        Row: {
          id: number;
          vendor_id: number;
          buy_order_id: number;
          sell_order_id: number;
          event_id: number;
          outcome_index: number;
          buyer_address: string;
          seller_address: string;
          price: number;
          amount: string;
          token_address: string;
          tx_hash: string | null;
          traded_at: string;
        };
        Insert: {
          id?: number;
          vendor_id: number;
          buy_order_id: number;
          sell_order_id: number;
          event_id: number;
          outcome_index: number;
          buyer_address: string;
          seller_address: string;
          price: number;
          amount: string;
          token_address: string;
          tx_hash?: string | null;
          traded_at?: string;
        };
        Update: {
          id?: number;
          vendor_id?: number;
          buy_order_id?: number;
          sell_order_id?: number;
          event_id?: number;
          outcome_index?: number;
          buyer_address?: string;
          seller_address?: string;
          price?: number;
          amount?: string;
          token_address?: string;
          tx_hash?: string | null;
          traded_at?: string;
        };
      };
      vendor_applications: {
        Row: {
          id: number;
          applicant_address: string;
          vendor_name: string;
          description: string | null;
          status: number;
          reviewed_by: string | null;
          reviewed_at: string | null;
          reject_reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          applicant_address: string;
          vendor_name: string;
          description?: string | null;
          status?: number;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          reject_reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          applicant_address?: string;
          vendor_name?: string;
          description?: string | null;
          status?: number;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          reject_reason?: string | null;
          created_at?: string;
        };
      };
      admin_users: {
        Row: {
          id: number;
          admin_address: string;
          role: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          admin_address: string;
          role?: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          admin_address?: string;
          role?: string;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
