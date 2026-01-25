export interface Outcome {
  index: number;
  name: string;
  description?: string;
}

export interface Event {
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
  outcomes: Outcome[];
  prize_pool: string;
  volume: string;
  created_at: string;
  updated_at: string;
  settled_at: string | null;
}

export interface EventWithPrices extends Event {
  outcomePrices: number[]; // Best ask prices for each outcome
}
