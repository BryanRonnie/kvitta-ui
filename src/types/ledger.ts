export type LedgerStatus = "pending" | "partially_settled" | "settled";

export interface LedgerEntry {
  _id: string;
  receipt_id: string;
  debtor_id: string;
  creditor_id: string;
  amount_cents: number;
  settled_amount_cents: number;
  status: LedgerStatus;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface UserBalance {
  owes_cents: number;
  is_owed_cents: number;
  net_cents: number; // positive = net creditor, negative = net debtor
}

export interface SettleRequest {
  amount_cents: number;
}
