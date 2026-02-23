"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Users,
  ChevronDown,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import {
  getReceipt,
  updateReceipt,
  addMember,
  removeMember,
} from "@/api/receipt.api";
import { listFolders } from "@/api/folder.api";
import { Receipt, ReceiptUpdate, ItemInput, PaymentInput } from "@/types/receipt";
import { Folder } from "@/types/folder";

export default function ReceiptEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [comments, setComments] = useState("");
  const [taxCents, setTaxCents] = useState(0);
  const [tipCents, setTipCents] = useState(0);
  const [items, setItems] = useState<ItemInput[]>([]);
  const [payments, setPayments] = useState<PaymentInput[]>([]);

  // Member management
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [memberError, setMemberError] = useState("");

  // Item form
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    unit_price_cents: 0,
    quantity: 1,
    splits: [],
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [receiptData, foldersData] = await Promise.all([
        getReceipt(id),
        listFolders(),
      ]);
      setReceipt(receiptData);
      setFolders(foldersData.filter((f) => !f.is_deleted));

      // Populate form
      setTitle(receiptData.title);
      setDescription(receiptData.description || "");
      setComments(receiptData.comments || "");
      setTaxCents(receiptData.tax_cents || 0);
      setTipCents(receiptData.tip_cents || 0);
      setItems(receiptData.items || []);
      setPayments(receiptData.payments || []);
    } catch (err) {
      console.error("Failed to load receipt:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = () => {
    if (!newItem.name.trim()) {
      alert("Item name is required");
      return;
    }
    if (newItem.unit_price_cents < 0 || newItem.quantity < 1) {
      alert("Price and quantity must be valid");
      return;
    }

    setItems([...items, newItem]);
    setNewItem({ name: "", unit_price_cents: 0, quantity: 1, splits: [] });
    setShowAddItem(false);
  };

  const handleRemoveItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleAddMember = async () => {
    setMemberError("");
    if (!newMemberEmail.trim()) {
      setMemberError("Email is required");
      return;
    }

    setIsAddingMember(true);
    try {
      await addMember(id, newMemberEmail.trim());
      setNewMemberEmail("");
      // Reload receipt to get updated members
      const updatedReceipt = await getReceipt(id);
      setReceipt(updatedReceipt);
    } catch (err: any) {
      setMemberError(
        err.response?.data?.detail ||
          "Failed to add member. User may not exist."
      );
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (
      !confirm(`Remove ${userId} from this receipt?`)
    )
      return;

    try {
      await removeMember(id, userId);
      // Reload receipt to get updated members
      const updatedReceipt = await getReceipt(id);
      setReceipt(updatedReceipt);
    } catch (err) {
      console.error("Failed to remove member:", err);
      alert("Failed to remove member");
    }
  };

  const handleSave = async () => {
    if (!receipt) return;

    if (!title.trim()) {
      alert("Receipt title is required");
      return;
    }

    setIsSaving(true);
    try {
      const updateData: ReceiptUpdate = {
        version: receipt.version,
        title: title.trim(),
        description: description.trim() || undefined,
        comments: comments.trim() || undefined,
        tax_cents: taxCents,
        tip_cents: tipCents,
        items,
        payments,
      };

      await updateReceipt(id, updateData);
      router.push(`/receipts/${id}`);
    } catch (err: any) {
      console.error("Failed to save receipt:", err);
      alert(
        err.message ||
          "Failed to save receipt. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const calculateSubtotal = () => {
    return items.reduce((total, item) => {
      return total + item.unit_price_cents * item.quantity;
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const total = subtotal + taxCents + tipCents;

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
    { label: receipt.title, href: `/receipts/${id}` },
    { label: "Edit" },
  ];

  const receiptCounts = {};

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
                    onClick={() => router.back()}
                    disabled={isSaving}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="p-8 max-w-4xl mx-auto space-y-6">
            {/* Receipt Details */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Receipt Details</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Team Lunch"
                    disabled={isSaving}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional description"
                    disabled={isSaving}
                  />
                </div>

                <div>
                  <Label htmlFor="comments">Comments</Label>
                  <textarea
                    id="comments"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Any additional notes..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    rows={3}
                    disabled={isSaving}
                  />
                </div>
              </div>
            </Card>

            {/* Items */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Items</h2>

              {items.length > 0 && (
                <div className="mb-4 space-y-2 max-h-75 overflow-y-auto">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-slate-500">
                          {item.quantity} × {formatCurrency(item.unit_price_cents)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">
                          {formatCurrency(item.unit_price_cents * item.quantity)}
                        </span>
                        <button
                          onClick={() => handleRemoveItem(idx)}
                          className="p-2 hover:bg-red-100 text-red-600 rounded"
                          disabled={isSaving}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {showAddItem ? (
                <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="item-name">Item Name *</Label>
                      <Input
                        id="item-name"
                        value={newItem.name}
                        onChange={(e) =>
                          setNewItem({ ...newItem, name: e.target.value })
                        }
                        placeholder="e.g., Coffee"
                        disabled={isSaving}
                      />
                    </div>
                    <div>
                      <Label htmlFor="item-price">Unit Price ($) *</Label>
                      <Input
                        id="item-price"
                        type="number"
                        step="0.01"
                        value={(newItem.unit_price_cents / 100).toFixed(2)}
                        onChange={(e) =>
                          setNewItem({
                            ...newItem,
                            unit_price_cents: Math.round(
                              parseFloat(e.target.value) * 100
                            ),
                          })
                        }
                        placeholder="0.00"
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="item-qty">Quantity</Label>
                    <Input
                      id="item-qty"
                      type="number"
                      min="1"
                      value={newItem.quantity}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          quantity: parseInt(e.target.value) || 1,
                        })
                      }
                      disabled={isSaving}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleAddItem}
                      disabled={isSaving}
                    >
                      Add Item
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowAddItem(false)}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setShowAddItem(true)}
                  disabled={isSaving}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              )}
            </Card>

            {/* Totals */}
            <Card className="p-6 bg-slate-50">
              <h2 className="text-lg font-semibold mb-4">Totals</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <Label htmlFor="tax" className="text-slate-600">
                    Tax
                  </Label>
                  <div className="flex items-center gap-2">
                    <span>$</span>
                    <input
                      id="tax"
                      type="number"
                      step="0.01"
                      value={(taxCents / 100).toFixed(2)}
                      onChange={(e) =>
                        setTaxCents(Math.round(parseFloat(e.target.value) * 100))
                      }
                      className="w-24 px-2 py-1 border border-slate-300 rounded text-right"
                      disabled={isSaving}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <Label htmlFor="tip" className="text-slate-600">
                    Tip
                  </Label>
                  <div className="flex items-center gap-2">
                    <span>$</span>
                    <input
                      id="tip"
                      type="number"
                      step="0.01"
                      value={(tipCents / 100).toFixed(2)}
                      onChange={(e) =>
                        setTipCents(Math.round(parseFloat(e.target.value) * 100))
                      }
                      className="w-24 px-2 py-1 border border-slate-300 rounded text-right"
                      disabled={isSaving}
                    />
                  </div>
                </div>

                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </Card>

            {/* Members Management */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Members
              </h2>

              {/* Current Members */}
              {receipt.participants && receipt.participants.length > 0 && (
                <div className="mb-6 space-y-2 max-h-62.5 overflow-y-auto">
                  {receipt.participants.map((p) => (
                    <div
                      key={p.user_id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-linear-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                          {p.user_id.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{p.user_id}</p>
                          <p className="text-xs text-slate-500">{p.role}</p>
                        </div>
                      </div>
                      {p.role !== "owner" && (
                        <button
                          onClick={() => handleRemoveMember(p.user_id)}
                          className="p-2 hover:bg-red-100 text-red-600 rounded"
                          disabled={isSaving}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add Member Form */}
              <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
                <div>
                  <Label htmlFor="member-email">Add Member by Email</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="member-email"
                      type="email"
                      value={newMemberEmail}
                      onChange={(e) => {
                        setNewMemberEmail(e.target.value);
                        setMemberError("");
                      }}
                      placeholder="member@example.com"
                      disabled={isAddingMember || isSaving}
                    />
                    <Button
                      onClick={handleAddMember}
                      disabled={isAddingMember || isSaving}
                    >
                      Add
                    </Button>
                  </div>
                  {memberError && (
                    <p className="text-sm text-red-600 mt-2">{memberError}</p>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
