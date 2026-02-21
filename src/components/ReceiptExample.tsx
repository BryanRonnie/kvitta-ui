"use client";

import { useState } from "react";
import {
  createReceipt,
  getReceipt,
  updateReceipt,
  listReceipts,
  addMember,
  removeMember,
  getMembers,
  finalizeReceipt,
} from "@/api";
import { Receipt, ReceiptCreate, ReceiptUpdate, ReceiptVersionConflictError } from "@/types/receipt";

/**
 * Example component demonstrating Receipt API usage
 *
 * Best practices:
 * - Always import from @/api
 * - Handle version conflicts gracefully
 * - Refetch on 409 and retry with new version
 * - Fetch before updating to get latest version
 */

export function ReceiptExample() {
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a new receipt
  const handleCreateReceipt = async () => {
    setLoading(true);
    setError(null);

    try {
      const newReceipt = await createReceipt({
        title: "Dinner at Italian Place",
        description: "Group dinner",
        folder_id: null,
      } as ReceiptCreate);

      setReceipt(newReceipt);
      console.log("Receipt created:", newReceipt);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create receipt";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Get all receipts
  const handleListReceipts = async () => {
    setLoading(true);
    setError(null);

    try {
      const receipts = await listReceipts();
      console.log("Receipts:", receipts);
      if (receipts.length > 0) {
        setReceipt(receipts[0]);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to list receipts";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Get single receipt
  const handleGetReceipt = async (receiptId: string) => {
    setLoading(true);
    setError(null);

    try {
      const fetchedReceipt = await getReceipt(receiptId);
      setReceipt(fetchedReceipt);
      console.log("Receipt fetched:", fetchedReceipt);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch receipt";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Update receipt (with version conflict handling)
  const handleUpdateReceipt = async (newTitle: string) => {
    if (!receipt) {
      setError("No receipt selected");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Update with current version
      const updated = await updateReceipt(receipt._id, {
        version: receipt.version,
        title: newTitle,
      } as ReceiptUpdate);

      setReceipt(updated);
      console.log("Receipt updated:", updated);
    } catch (err) {
      // 2. Handle version conflict
      if (err instanceof ReceiptVersionConflictError) {
        console.warn("Version conflict detected, refetching...", err.message);

        try {
          // 3. Refetch latest version
          const latest = await getReceipt(receipt._id);
          setReceipt(latest);

          // 4. Retry with new version
          const retried = await updateReceipt(receipt._id, {
            version: latest.version,
            title: newTitle,
          } as ReceiptUpdate);

          setReceipt(retried);
          console.log("Receipt updated after retry:", retried);
        } catch (retryErr) {
          const message =
            retryErr instanceof Error
              ? retryErr.message
              : "Failed to update receipt after retry";
          setError(message);
        }
      } else {
        const message =
          err instanceof Error ? err.message : "Failed to update receipt";
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Add member to receipt
  const handleAddMember = async (userId: string) => {
    if (!receipt) {
      setError("No receipt selected");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updated = await addMember(receipt._id, userId);
      setReceipt(updated);
      console.log("Member added:", userId);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to add member";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Get members
  const handleGetMembers = async () => {
    if (!receipt) {
      setError("No receipt selected");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const members = await getMembers(receipt._id);
      console.log("Members:", members);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to get members";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Finalize receipt
  const handleFinalizeReceipt = async () => {
    if (!receipt) {
      setError("No receipt selected");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await finalizeReceipt(receipt._id);
      setReceipt(result.receipt);
      console.log("Receipt finalized. Ledger entries:", result.ledger_entries);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to finalize receipt";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Receipt API Examples</h1>

      <div style={{ marginBottom: "20px" }}>
        <button onClick={handleCreateReceipt} disabled={loading}>
          {loading ? "Loading..." : "Create Receipt"}
        </button>
        <button onClick={handleListReceipts} disabled={loading} style={{ marginLeft: "10px" }}>
          List Receipts
        </button>
      </div>

      {receipt && (
        <div style={{ marginBottom: "20px", padding: "10px", border: "1px solid #ccc" }}>
          <h2>{receipt.title}</h2>
          <p>ID: {receipt._id}</p>
          <p>Status: {receipt.status}</p>
          <p>Total: ${(receipt.total_cents / 100).toFixed(2)}</p>
          <p>Version: {receipt.version}</p>

          <div style={{ marginTop: "10px" }}>
            <button
              onClick={() =>
                handleUpdateReceipt("Updated Title - " + new Date().getTime())
              }
              disabled={loading}
            >
              Update Title
            </button>
            <button
              onClick={() => handleAddMember("user123")}
              disabled={loading}
              style={{ marginLeft: "10px" }}
            >
              Add Member
            </button>
            <button
              onClick={handleGetMembers}
              disabled={loading}
              style={{ marginLeft: "10px" }}
            >
              Get Members
            </button>
            <button
              onClick={handleFinalizeReceipt}
              disabled={loading}
              style={{ marginLeft: "10px" }}
            >
              Finalize
            </button>
          </div>
        </div>
      )}

      {error && (
        <div style={{ color: "red", marginTop: "10px", padding: "10px", backgroundColor: "#fee" }}>
          Error: {error}
        </div>
      )}
    </div>
  );
}
