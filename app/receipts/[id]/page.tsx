"use client";

import { useState, useEffect, useMemo } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit, Trash2, Users, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { getReceipt, deleteReceipt } from "@/api/receipt.api";
import { listFolders } from "@/api/folder.api";
import { Receipt } from "@/types/receipt";
import { Folder } from "@/types/folder";

export default function ReceiptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);



  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [receiptData, foldersData] = await Promise.all([
        getReceipt(id),
        listFolders(true),
      ]);
      setReceipt(receiptData);
      setFolders(foldersData.filter((f) => !f.is_deleted));
    } catch (err) {
      console.error("Failed to load receipt:", err);
    } finally {
      setIsLoading(false);
    }
  };

    const receiptCounts = useMemo(() => {
      const counts: Record<string, number> = {};
      folders.forEach((folder) => {
        counts[folder.id] = folder.receipt_count || 0;
      });
      return counts;
    }, [folders]);


  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this receipt?")) return;
    try {
      await deleteReceipt(id);
      router.push("/dashboard");
    } catch (err) {
      console.error("Failed to delete receipt:", err);
      alert("Failed to delete receipt");
    }
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-slate-500">Loading receipt...</p>
        </div>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-slate-500">Receipt not found</p>
          <Button onClick={() => router.push("/dashboard")} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const currentFolder = receipt.folder_id
    ? folders.find((f) => f.id === receipt.folder_id)
    : null;

  const breadcrumbItems = [
    ...(currentFolder
      ? [
          {
            label: currentFolder.name,
            href: `/dashboard?folder=${currentFolder.id}`,
          },
        ]
      : []),
    { label: receipt.title },
  ];

  return (
    <SidebarProvider>
      <DashboardSidebar
        folders={folders}
        selectedFolderId={receipt.folder_id || null}
        onFolderSelect={(folderId) => {
          if (folderId) {
            router.push(`/dashboard?folder=${folderId}`);
          } else {
            router.push("/dashboard");
          }
        }}
        onCreateFolder={() => {}}
        receiptCounts={receiptCounts}
      />

      <SidebarInset>
        <div className="min-h-screen bg-slate-50">
          {/* Header */}
          <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
            <div className="px-6 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <SidebarTrigger />
                  <Breadcrumb items={breadcrumbItems} />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/receipts/${id}/edit`)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" onClick={handleDelete}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="p-8 max-w-4xl mx-auto">
            <div className="space-y-6">
              {/* Receipt Header */}
              <Card className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">
                      {receipt.title}
                    </h1>
                    {receipt.description && (
                      <p className="text-slate-600">{receipt.description}</p>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
                      receipt.status === "finalized"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {receipt.status === "finalized" ? "Finalized" : "Draft"}
                  </span>
                </div>
                <p className="text-sm text-slate-500">
                  Created {formatDate(receipt.created_at)}
                </p>
              </Card>

              {/* Items */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Items
                </h2>
                {receipt.items && receipt.items.length > 0 ? (
                  <div className="space-y-3">
                    {receipt.items.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center py-2 border-b last:border-0"
                      >
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-slate-500">
                            Qty: {item.quantity} × {formatCurrency(item.unit_price_cents)}
                          </p>
                        </div>
                        <p className="font-semibold">
                          {formatCurrency(item.unit_price_cents * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No items added yet</p>
                )}
              </Card>

              {/* Totals */}
              <Card className="p-6 bg-slate-50">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Subtotal</span>
                    <span>{formatCurrency(receipt.subtotal_cents)}</span>
                  </div>
                  {receipt.tax_cents > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Tax</span>
                      <span>{formatCurrency(receipt.tax_cents)}</span>
                    </div>
                  )}
                  {receipt.tip_cents > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Tip</span>
                      <span>{formatCurrency(receipt.tip_cents)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total</span>
                    <span>{formatCurrency(receipt.total_cents)}</span>
                  </div>
                </div>
              </Card>

              {/* Participants */}
              {receipt.participants && receipt.participants.length > 0 && (
                <Card className="p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Participants
                  </h2>
                  <div className="space-y-2">
                    {receipt.participants.map((p, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-2"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-linear-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {p.name
                            .trim()
                            .split(/\s+/)
                            .slice(0, 2)
                            .map(word => word[0])
                            .join("")
                            .toUpperCase()}
                          </div>
                          <span className="font-medium">{p.name}</span>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            p.role === "owner"
                              ? "bg-indigo-100 text-indigo-700"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {p.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Comments */}
              {receipt.comments && (
                <Card className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Comments</h2>
                  <p className="text-slate-700 whitespace-pre-wrap">
                    {receipt.comments}
                  </p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
