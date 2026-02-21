import { api } from "./axios";
import {
  Receipt,
  ReceiptCreate,
  ReceiptUpdate,
  Participant,
  FinalizeResponse,
} from "../types/receipt";

/* --------------------------
   Create Receipt
-------------------------- */

/**
 * Create a new receipt
 * POST /receipts
 */
export const createReceipt = async (data: ReceiptCreate): Promise<Receipt> => {
  const response = await api.post<Receipt>("/receipts", data);
  return response.data;
};

/* --------------------------
   Get/List Receipts
-------------------------- */

/**
 * Get a single receipt by ID
 * GET /receipts/{id}
 */
export const getReceipt = async (id: string): Promise<Receipt> => {
  const response = await api.get<Receipt>(`/receipts/${id}`);
  return response.data;
};

/**
 * List all receipts for current user
 * GET /receipts
 */
export const listReceipts = async (): Promise<Receipt[]> => {
  const response = await api.get<Receipt[]>("/receipts");
  return response.data;
};

/* --------------------------
   Update Receipt (Draft Only)
   Supports optimistic locking via version field
-------------------------- */

/**
 * Update receipt (draft status only)
 * PATCH /receipts/{id}
 *
 * Supports optimistic locking:
 * - Must provide current version in data
 * - If 409 conflict: refetch receipt and retry with new version
 *
 * @throws ReceiptVersionConflictError on 409 status
 */
export const updateReceipt = async (
  id: string,
  data: ReceiptUpdate
): Promise<Receipt> => {
  const response = await api.patch<Receipt>(`/receipts/${id}`, data);
  return response.data;
};

/* --------------------------
   Member Management
-------------------------- */

/**
 * Add a member to receipt
 * POST /receipts/{id}/members
 */
export const addMember = async (
  receiptId: string,
  userId: string
): Promise<Receipt> => {
  const response = await api.post<Receipt>(
    `/receipts/${receiptId}/members`,
    { user_id: userId }
  );
  return response.data;
};

/**
 * Remove a member from receipt
 * DELETE /receipts/{id}/members/{userId}
 */
export const removeMember = async (
  receiptId: string,
  userId: string
): Promise<Receipt> => {
  const response = await api.delete<Receipt>(
    `/receipts/${receiptId}/members/${userId}`
  );
  return response.data;
};

/**
 * Get all members of a receipt
 * GET /receipts/{id}/members
 */
export const getMembers = async (
  receiptId: string
): Promise<Participant[]> => {
  const response = await api.get<Participant[]>(
    `/receipts/${receiptId}/members`
  );
  return response.data;
};

/* --------------------------
   Finalize Receipt
   Locks receipt to "finalized" state
   Generates ledger entries for settlements
-------------------------- */

/**
 * Finalize receipt and generate settlement ledger
 * POST /receipts/{id}/finalize
 *
 * Once finalized:
 * - Receipt cannot be edited
 * - Ledger entries are locked
 * - Used for settlement tracking
 */
export const finalizeReceipt = async (
  receiptId: string
): Promise<FinalizeResponse> => {
  const response = await api.post<FinalizeResponse>(
    `/receipts/${receiptId}/finalize`
  );
  return response.data;
};
