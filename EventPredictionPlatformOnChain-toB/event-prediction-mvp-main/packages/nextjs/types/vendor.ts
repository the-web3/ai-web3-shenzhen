export interface Vendor {
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
}

export interface VendorInviteCode {
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
}

export interface UserVendor {
  id: number;
  user_address: string;
  vendor_id: number;
  joined_at: string;
  joined_via_invite_id: number | null;
  status: number;
}
