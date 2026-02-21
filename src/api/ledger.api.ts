import { api } from "./axios";
import { LedgerEntry, UserBalance, SettleRequest } from "../types/ledger";

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
  const response = await api.get<LedgerEntry[]>(
    `/ledger/receipt/${receiptId}`
  );
  return response.data;
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

  const response = await api.post<LedgerEntry>(
    `/ledger/${entryId}/settle`,
    payload
  );
  return response.data;
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
