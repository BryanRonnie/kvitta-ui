/**
 * Split Page
 *
 * Allows selecting a receipt group and managing members for splitting.
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { getGroupReceipts, saveSplit, listGroups } from '@/lib/api';
import type { Group, Receipt } from '@/types';
import { ReceiptSplitter } from '@/components/ReceiptSplitter';

function SplitContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [groups, setGroups] = useState<Group[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [receiptsLoading, setReceiptsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedGroupId = searchParams.get('groupId') || '';

  // Load Groups
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await listGroups();
        setGroups(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load groups');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Load Receipts when Group Changes
  useEffect(() => {
    if (!selectedGroupId) return;

    // Auto-select receipt if passed in URL
    const urlReceiptId = searchParams.get('receiptId');
    if (urlReceiptId) setSelectedReceiptId(urlReceiptId);

    const fetchReceipts = async () => {
      setReceiptsLoading(true);
      try {
        const data = await getGroupReceipts(selectedGroupId);
        setReceipts(data);

        // If we have a receipt ID from URL but we just loaded receipts, ensure it exists
        if (urlReceiptId && !data.find(r => r._id === urlReceiptId)) {
          // Check if URL receiptId was actually a groupID (legacy logic in previous file)
          // The previous logic used 'receiptId' param to store GROUP ID.
          // We should respect 'groupId' param now.
        }
      } catch (err) {
        console.error("Failed to load receipts", err);
      } finally {
        setReceiptsLoading(false);
      }
    };
    fetchReceipts();
  }, [selectedGroupId, searchParams]);

  const handleSelectGroup = (groupId: string) => {
    // Update URL to reflect group
    router.push(`/split?groupId=${groupId}`);
  };

  const activeGroup = groups.find(g => g.id === selectedGroupId);
  const activeReceipt = receipts.find(r => r._id === selectedReceiptId);

  const handleSaveSplit = async (splitMap: Record<string, string[]>) => {
    if (!selectedReceiptId) return;
    try {
      await saveSplit(selectedReceiptId, splitMap);
      // Optional: show success toast
      alert("Split saved successfully!");
    } catch (err) {
      alert("Failed to save split");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Split Receipt</h1>
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>

        {/* Group Selector */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <h2 className="text-lg font-semibold">1. Select Expense Group</h2>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {groups.map(group => (
                <Button
                  key={group.id}
                  variant={group.id === selectedGroupId ? 'default' : 'outline'}
                  onClick={() => handleSelectGroup(group.id)}
                >
                  {group.name}
                </Button>
              ))}
              {groups.length === 0 && !loading && (
                <p className="text-gray-500">No groups found.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {selectedGroupId && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar: Receipts List */}
            <div className="lg:col-span-1 space-y-4">
              <Card className="h-full">
                <CardHeader>
                  <h2 className="text-lg font-semibold">2. Select Receipt</h2>
                </CardHeader>
                <CardContent className="space-y-2">
                  {receiptsLoading && <p className="text-sm">Loading receipts...</p>}
                  {!receiptsLoading && receipts.length === 0 && (
                    <p className="text-sm text-gray-500">No receipts in this group.</p>
                  )}
                  {receipts.map(receipt => (
                    <button
                      key={receipt._id}
                      onClick={() => setSelectedReceiptId(receipt._id)}
                      className={cn(
                        "w-full text-left p-3 rounded border text-sm transition-colors",
                        selectedReceiptId === receipt._id
                          ? "bg-blue-50 border-blue-500 ring-1 ring-blue-500"
                          : "hover:bg-gray-50"
                      )}
                    >
                      <div className="font-medium truncate">
                        {new Date(receipt.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {receipt.items_analysis?.merchant_name || 'Unknown Merchant'}
                      </div>
                      <div className="text-xs font-semibold mt-1">
                        ${receipt.items_analysis?.total_amount?.toFixed(2) || '???'}
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Main Content: Splitter */}
            <div className="lg:col-span-3">
              {activeReceipt && activeGroup ? (
                <ReceiptSplitter
                  receipt={activeReceipt}
                  members={activeGroup.members}
                  onSave={handleSaveSplit}
                />
              ) : (
                <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg text-gray-400">
                  Select a receipt to start splitting
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SplitPage() {
  return (
    <ProtectedRoute>
      <SplitContent />
    </ProtectedRoute>
  );
}
