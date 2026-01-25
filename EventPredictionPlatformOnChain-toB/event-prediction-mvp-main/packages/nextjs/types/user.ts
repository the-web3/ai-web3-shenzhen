export interface UserBalance {
  id: number;
  vendor_id: number;
  user_address: string;
  token_address: string;
  available_balance: string;
  locked_balance: string;
  updated_at: string;
}

export interface Position {
  id: number;
  vendor_id: number;
  user_address: string;
  event_id: number;
  outcome_index: number;
  token_address: string;
  amount: string;
  avg_cost: string | null;
  updated_at: string;
}

export interface VendorApplication {
  id: number;
  applicant_address: string;
  vendor_name: string;
  description: string | null;
  status: number;
  reviewed_by: string | null;
  reviewed_at: string | null;
  reject_reason: string | null;
  created_at: string;
}

export interface AdminUser {
  id: number;
  admin_address: string;
  role: string;
  created_at: string;
}
