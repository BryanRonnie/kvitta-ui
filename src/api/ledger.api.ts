import { api } from "./axios";
import { LedgerEntry, UserBalance, SettleRequest, LedgerEntryApi } from "../types/ledger";

const mapLedgerEntry = (f: LedgerEntryApi): LedgerEntry => ({
  id: f._id,
  receipt_id: f.receipt_id,
  debtor_id: f.debtor_id,
  creditor_id: f.creditor_id,
  amount_cents: f.amount_cents,
  settled_amount_cents: f.settled_amount_cents,
  status: f.status,
  description: f.description,
  created_at: f.created_at,
  updated_at: f.updated_at
});

const mapLedgerEntries = (fs: LedgerEntryApi[]): LedgerEntry[] => (fs.map((f: LedgerEntryApi) => {
  return {
    id: f._id,
    receipt_id: f.receipt_id,
    debtor_id: f.debtor_id,
    creditor_id: f.creditor_id,
    amount_cents: f.amount_cents,
    settled_amount_cents: f.settled_amount_cents,
    status: f.status,
    description: f.description,
    created_at: f.created_at,
    updated_at: f.updated_at
  }
}));

/* --------------------------
   Get ledger entries by receipt
   GET /ledger/receipt/{receiptId}
-------------------------- */

/**
 * Get all ledger entries for a specific receipt
 * Returns entries showing who owes whom and settlement status
 */
export const getLedgerByReceipt = async (
  receiptId: string
): Promise<LedgerEntry[]> => {
  const response = await api.get<LedgerEntryApi[]>(
    `/ledger/receipt/${receiptId}`
  );
  return mapLedgerEntries(response.data);
};

/* --------------------------
   Get aggregated user balance
   GET /ledger/user/{userId}/balance
-------------------------- */

/**
 * Get aggregated balance for a user across all receipts
 * Shows total amounts owed and total amounts others owe them
 *
 * @returns UserBalance
 *   - owes_cents: Total amount user owes others
 *   - is_owed_cents: Total amount others owe user
 *   - net_cents: Positive = net creditor, Negative = net debtor
 */
export const getUserBalance = async (userId: string): Promise<UserBalance> => {
  const response = await api.get<UserBalance>(
    `/ledger/user/${userId}/balance`
  );
  return response.data;
};

/* --------------------------
   Settle ledger entry (partial or full)
   POST /ledger/{entryId}/settle
-------------------------- */

/**
 * Settle a ledger entry (partially or fully)
 * Multiple calls can settle one entry in installments
 *
 * @param entryId - ID of the ledger entry
 * @param amount_cents - Amount to settle (partial or full)
 * @returns Updated ledger entry with new settled_amount_cents
 */
export const settleLedgerEntry = async (
  entryId: string,
  amount_cents: number
): Promise<LedgerEntry> => {
  const payload: SettleRequest = { amount_cents };

  const response = await api.post<LedgerEntryApi>(
    `/ledger/${entryId}/settle`,
    payload
  );
  return mapLedgerEntry(response.data);
};

/* --------------------------
   Delete all entries for receipt (unfinalize)
   DELETE /ledger/receipt/{receiptId}
-------------------------- */

/**
 * Delete all ledger entries for a receipt
 * Used when unfinalizng a receipt to recalculate balances
 *
 * @returns Object with count of deleted entries
 */
export const deleteLedgerForReceipt = async (
  receiptId: string
): Promise<{ deleted_count: number }> => {
  const response = await api.delete<{ deleted_count: number }>(
    `/ledger/receipt/${receiptId}`
  );
  return response.data;
};



// import { api } from "./axios";

/* --------------------------
   Types
-------------------------- */

export interface CounterpartyApi {
  user_id: string;
  name: string;
  they_owe_me_cents: number;
  i_owe_them_cents: number;
  net_cents: number;
}

export interface MeSummaryApi {
  user_id: string;
  total_i_owe_cents: number;
  total_owed_to_me_cents: number;
  net_cents: number;
  counterparties: CounterpartyApi[];
}

// Mapped (camelCase) versions for use in components
export interface Counterparty {
  userId: string;
  name: string;
  theyOweMeCents: number;
  iOweThem: number;
  netCents: number;
}

export interface MeSummary {
  userId: string;
  totalIOweCents: number;
  totalOwedToMeCents: number;
  netCents: number;
  counterparties: Counterparty[];
}

/* --------------------------
   Mappers
-------------------------- */

const mapCounterparty = (c: CounterpartyApi): Counterparty => ({
  userId: c.user_id,
  name: c.name,
  theyOweMeCents: c.they_owe_me_cents,
  iOweThem: c.i_owe_them_cents,
  netCents: c.net_cents,
});

const mapMeSummary = (raw: MeSummaryApi): MeSummary => ({
  userId: raw.user_id,
  totalIOweCents: raw.total_i_owe_cents,
  totalOwedToMeCents: raw.total_owed_to_me_cents,
  netCents: raw.net_cents,
  counterparties: raw.counterparties.map(mapCounterparty),
});

/* --------------------------
   Get my ledger summary
   GET /ledger/me
-------------------------- */

/**
 * Get the current user's full financial picture across all receipts.
 *
 * @returns MeSummary
 *   - totalIOweCents:      Sum of everything I owe across all counterparties
 *   - totalOwedToMeCents:  Sum of everything owed to me
 *   - netCents:            Positive = net creditor, Negative = net debtor
 *   - counterparties:      Per-person breakdown with individual net amounts
 */
export const getMyLedgerSummary = async (): Promise<MeSummary> => {
  const response = await api.get<MeSummaryApi>("/ledger/me");
  return mapMeSummary(response.data);
};