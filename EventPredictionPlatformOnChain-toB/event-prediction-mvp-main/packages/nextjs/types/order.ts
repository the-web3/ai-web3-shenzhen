export interface Order {
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
}

export interface Trade {
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
}
