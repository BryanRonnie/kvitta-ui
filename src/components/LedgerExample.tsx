"use client";

import { useState } from "react";
import {
  getLedgerByReceipt,
  getUserBalance,
  settleLedgerEntry,
  deleteLedgerForReceipt,
} from "@/api";
import { LedgerEntry, UserBalance } from "@/types/ledger";

/**
 * Example component demonstrating Ledger API usage
 *
 * Best practices:
 * - Always fetch user balance for dashboard UI
 * - Never calculate balances on frontend
 * - Keep financial logic server-side only
 * - Use ledger entries to render transaction history
 */

export function LedgerExample() {
  const [receiptId, setReceiptId] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [balance, setBalance] = useState<UserBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get ledger entries for a receipt
  const handleGetLedgerByReceipt = async () => {
    if (!receiptId.trim()) {
      setError("Please enter a receipt ID");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const ledgerEntries = await getLedgerByReceipt(receiptId);
      setEntries(ledgerEntries);
      console.log("Ledger entries:", ledgerEntries);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch ledger";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Get user balance
  const handleGetUserBalance = async () => {
    if (!userId.trim()) {
      setError("Please enter a user ID");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userBalance = await getUserBalance(userId);
      setBalance(userBalance);
      console.log("User balance:", userBalance);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch balance";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Settle a ledger entry
  const handleSettleEntry = async (entryId: string, amount_cents: number) => {
    setLoading(true);
    setError(null);

    try {
      const updatedEntry = await settleLedgerEntry(entryId, amount_cents);
      console.log("Entry settled:", updatedEntry);

      // Update entries list
      setEntries(
        entries.map((e) => (e._id === entryId ? updatedEntry : e))
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to settle entry";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Delete ledger for receipt (unfinalize)
  const handleDeleteLedger = async () => {
    if (!receiptId.trim()) {
      setError("Please enter a receipt ID");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await deleteLedgerForReceipt(receiptId);
      console.log(`Deleted ${result.deleted_count} ledger entries`);
      setEntries([]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete ledger";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "system-ui" }}>
      <h1>Ledger API Examples</h1>

      {/* Receipt Ledger Section */}
      <section style={{ marginBottom: "30px" }}>
        <h2>Receipt Ledger</h2>
        <div style={{ marginBottom: "15px" }}>
          <input
            type="text"
            placeholder="Enter receipt ID"
            value={receiptId}
            onChange={(e) => setReceiptId(e.target.value)}
            style={{ padding: "8px", marginRight: "10px", width: "200px" }}
          />
          <button onClick={handleGetLedgerByReceipt} disabled={loading}>
            {loading ? "Loading..." : "Get Ledger"}
          </button>
          <button
            onClick={handleDeleteLedger}
            disabled={loading}
            style={{ marginLeft: "10px" }}
          >
            Delete Ledger
          </button>
        </div>

        {entries.length > 0 && (
          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: "4px",
              padding: "15px",
            }}
          >
            <h3>Entries ({entries.length})</h3>
            {entries.map((entry) => (
              <div
                key={entry._id}
                style={{
                  marginBottom: "12px",
                  padding: "10px",
                  backgroundColor: "#f5f5f5",
                  borderRadius: "4px",
                }}
              >
                <div>
                  <strong>
                    {entry.debtor_id} owes {entry.creditor_id}
                  </strong>
                </div>
                <div>
                  Amount: ${(entry.amount_cents / 100).toFixed(2)}
                </div>
                <div>
                  Settled: ${(entry.settled_amount_cents / 100).toFixed(2)} /
                  ${(entry.amount_cents / 100).toFixed(2)}
                </div>
                <div style={{ color: "#666", fontSize: "0.9em" }}>
                  Status: <span style={{ fontWeight: "bold" }}>{entry.status}</span>
                </div>
                <button
                  onClick={() =>
                    handleSettleEntry(entry._id, entry.amount_cents / 2)
                  }
                  disabled={loading || entry.status === "settled"}
                  style={{ marginTop: "8px", fontSize: "0.85em" }}
                >
                  Settle Half
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* User Balance Section */}
      <section style={{ marginBottom: "30px" }}>
        <h2>User Balance</h2>
        <div style={{ marginBottom: "15px" }}>
          <input
            type="text"
            placeholder="Enter user ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            style={{ padding: "8px", marginRight: "10px", width: "200px" }}
          />
          <button onClick={handleGetUserBalance} disabled={loading}>
            {loading ? "Loading..." : "Get Balance"}
          </button>
        </div>

        {balance && (
          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: "4px",
              padding: "15px",
              backgroundColor: balance.net_cents > 0 ? "#e8f5e9" : "#ffebee",
            }}
          >
            <h3>Balance Summary</h3>
            <div style={{ marginBottom: "10px" }}>
              <strong>Owes:</strong> ${(balance.owes_cents / 100).toFixed(2)}
            </div>
            <div style={{ marginBottom: "10px" }}>
              <strong>Is Owed:</strong> $
              {(balance.is_owed_cents / 100).toFixed(2)}
            </div>
            <div
              style={{
                marginTop: "15px",
                padding: "10px",
                backgroundColor: "#fff",
                borderRadius: "4px",
              }}
            >
              <strong>Net Balance: </strong>
              <span
                style={{
                  fontSize: "1.2em",
                  fontWeight: "bold",
                  color: balance.net_cents > 0 ? "#4caf50" : "#f44336",
                }}
              >
                {balance.net_cents > 0 ? "+" : ""}
                ${(balance.net_cents / 100).toFixed(2)}
              </span>
              <div style={{ fontSize: "0.85em", color: "#666", marginTop: "5px" }}>
                {balance.net_cents > 0
                  ? "Net creditor (others owe you)"
                  : "Net debtor (you owe others)"}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Error Display */}
      {error && (
        <div
          style={{
            color: "#d32f2f",
            marginTop: "15px",
            padding: "10px",
            backgroundColor: "#ffebee",
            borderRadius: "4px",
          }}
        >
          Error: {error}
        </div>
      )}
    </div>
  );
}
