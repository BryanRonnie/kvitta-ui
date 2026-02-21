export interface SplitInput {
  user_id: string;
  share_quantity: number;
}

export interface ItemInput {
  name: string;
  unit_price_cents: number;
  quantity: number;
  splits: SplitInput[];
}

export interface PaymentInput {
  user_id: string;
  amount_paid_cents: number;
}

export interface ReceiptCreate {
  title: string;
  description?: string;
  comments?: string;
  folder_id?: string | null;
}

export interface ReceiptUpdate {
  version: number;
  title?: string;
  description?: string;
  comments?: string;
  folder_id?: string | null;
  items?: ItemInput[];
  payments?: PaymentInput[];
  tax_cents?: number;
  tip_cents?: number;
}

export interface Participant {
  user_id: string;
  role: "owner" | "member";
  joined_at: string;
}

export interface Receipt {
  _id: string;
  owner_id: string;
  title: string;
  description?: string;
  comments?: string;
  folder_id?: string | null;
  status: "draft" | "finalized";
  participants: Participant[];
  items: any[];
  payments: any[];
  subtotal_cents: number;
  tax_cents: number;
  tip_cents: number;
  total_cents: number;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface FinalizeResponse {
  receipt: Receipt;
  ledger_entries: any[];
}

/**
 * Custom error for version conflicts during updates
 * Occurs when optimistic locking detects concurrent modifications (409)
 */
export class ReceiptVersionConflictError extends Error {
  constructor(public previousVersion: number, public currentVersion: number) {
    super(
      `Version conflict: expected ${previousVersion}, got ${currentVersion}`
    );
    this.name = "ReceiptVersionConflictError";
  }
}
