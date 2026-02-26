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
  AlertCircle,
  Upload,
  Check,
  CloudCheck
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
  const [showSaved, setShowSaved] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [comments, setComments] = useState("");
  const [folderId, setFolderId] = useState<string | null>(null);
  const [status, setStatus] = useState<"draft" | "finalized">("draft");
  const [taxCents, setTaxCents] = useState(0);
  const [tipCents, setTipCents] = useState(0);
  const [items, setItems] = useState<ItemInput[]>([]);
  const [charges, setCharges] = useState<any[]>([]);
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
    taxable: true,
    splits: [],
  });

  // Charge form
  const [showAddCharge, setShowAddCharge] = useState(false);
  const [newCharge, setNewCharge] = useState({
    name: "",
    unit_price_cents: 0,
    taxable: false,
    splits: [],
  });

  // Split editor
  const [itemSplits, setItemSplits] = useState<{ [key: string]: boolean }>({});

  // CSV Import state
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [csvInput, setCsvInput] = useState("");
  const [parsedItems, setParsedItems] = useState<ItemInput[]>([]);
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState(false);

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
      setFolderId(receiptData.folder_id || null);
      setStatus((receiptData.status as "draft" | "finalized") || "draft");
      setTaxCents(receiptData.tax_cents || 0);
      setTipCents(receiptData.tip_cents || 0);
      setItems(receiptData.items || []);
      setCharges(receiptData.charges || []);
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
    setNewItem({ name: "", unit_price_cents: 0, quantity: 1, taxable: true, splits: [] });
    setShowAddItem(false);
  };

  const handleRemoveItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleAddCharge = () => {
    if (!newCharge.name.trim()) {
      alert("Charge name is required");
      return;
    }
    if (newCharge.unit_price_cents < 0) {
      alert("Charge amount must be valid");
      return;
    }

    setCharges([...charges, newCharge]);
    setNewCharge({ name: "", unit_price_cents: 0, taxable: false, splits: [] });
    setShowAddCharge(false);
  };

  const handleRemoveCharge = (idx: number) => {
    setCharges(charges.filter((_, i) => i !== idx));
  };

  const toggleItemSplit = (itemIdx: number, userId: string) => {
    const key = `${itemIdx}-${userId}`;
    setItemSplits((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleChargeSplit = (chargeIdx: number, userId: string) => {
    const key = `charge-${chargeIdx}-${userId}`;
    setItemSplits((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const parseCSVInput = () => {
    setImportError("");
    setImportSuccess(false);
    setParsedItems([]);

    if (!csvInput.trim()) {
      setImportError("Please paste CSV/TSV data");
      return;
    }

    try {
      const lines = csvInput
        .trim()
        .split("\n")
        .filter((line) => line.trim());

      if (lines.length === 0) {
        setImportError("No valid rows found");
        return;
      }

      const parsed: ItemInput[] = [];
      const errors: string[] = [];

      lines.forEach((line, idx) => {
        // Handle both CSV (comma) and TSV (tab) delimiters
        const values = line
          .split(",")
          .map((v) => v.trim());

        if (values.length < 4) {
          errors.push(
            `Row ${idx + 1}: Expected 4 fields (name, qty, price, taxable), got ${values.length}`
          );
          return;
        }

        const [name, qtyStr, priceStr, taxableStr] = values;

        // Validate name
        if (!name) {
          errors.push(`Row ${idx + 1}: Item name is required`);
          return;
        }

        // Parse quantity
        const qty = parseInt(qtyStr, 10);
        if (isNaN(qty) || qty < 0) {
          errors.push(
            `Row ${idx + 1}: Quantity must be a positive number, got "${qtyStr}"`
          );
          return;
        }

        // Parse price (line total)
        const lineTotal = parseFloat(priceStr);
        if (isNaN(lineTotal) || lineTotal < 0) {
          errors.push(
            `Row ${idx + 1}: Price must be a valid number, got "${priceStr}"`
          );
          return;
        }

        // Calculate unit price from line total
        const unitPriceCents = Math.round((lineTotal / qty) * 100);

        // Parse taxable
        const taxableStr_Upper = taxableStr.toUpperCase();
        const taxable =
          taxableStr_Upper === "TRUE" ||
          taxableStr_Upper === "1" ||
          taxableStr_Upper === "YES";

        parsed.push({
          name: name,
          quantity: qty,
          unit_price_cents: unitPriceCents,
          taxable: taxable,
          splits: [],
        });
      });

      if (errors.length > 0) {
        setImportError(errors.join("\n"));
        return;
      }

      if (parsed.length === 0) {
        setImportError("No valid items to import");
        return;
      }

      setParsedItems(parsed);
      setImportSuccess(true);
    } catch (err) {
      setImportError(`Parse error: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleAddBulkItems = () => {
    setItems([...items, ...parsedItems]);
    setCsvInput("");
    setParsedItems([]);
    setImportSuccess(false);
    setShowBulkImport(false);
    handleAutoSave();
  };

  const resetBulkImport = () => {
    setCsvInput("");
    setParsedItems([]);
    setImportError("");
    setImportSuccess(false);
    setShowBulkImport(false);
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

  const handleRemoveMember = async (userId: string, name: string) => {
    if (
      !confirm(`Remove ${name} from this receipt?`)
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

  const handleAutoSave = async () => {
    if (!receipt) return;

    if (!title.trim()) {
      alert("Receipt title is required");
      return;
    }

    // Build items with splits - share_quantity is the ratio of qty divided by number of splits
    const itemsWithSplits = items.map((item, idx) => {
      const selectedParticipants = receipt.participants?.filter((p) => {
        const key = `${idx}-${p.user_id}`;
        return itemSplits[key];
      }) || [];

      const splitCount = selectedParticipants.length;
      const shareQty = splitCount > 0 ? item.quantity / splitCount : item.quantity;

      return {
        ...item,
        splits: selectedParticipants.map((p) => ({
          user_id: p.user_id,
          share_quantity: shareQty,
        })),
      };
    });

    // Build charges with splits
    const chargesWithSplits = charges.map((charge, idx) => {
      const selectedParticipants = receipt.participants?.filter((p) => {
        const key = `charge-${idx}-${p.user_id}`;
        return itemSplits[key];
      }) || [];

      return {
        ...charge,
        splits: selectedParticipants.map((p) => ({
          user_id: p.user_id,
          share_quantity: 1,
        })),
      };
    });

    setIsSaving(true);
    try {
      const updateData: ReceiptUpdate = {
        version: receipt.version,
        title: title.trim(),
        description: description.trim() || undefined,
        comments: comments.trim() || undefined,
        folder_id: folderId || undefined,
        status,
        tax_cents: taxCents,
        tip_cents: tipCents,
        items: itemsWithSplits,
        charges: chargesWithSplits,
        payments,
      };

      await updateReceipt(id, updateData);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
      // router.push(`/receipts/${id}`);
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


  const handleSave = async () => {
    if (!receipt) return;

    if (!title.trim()) {
      alert("Receipt title is required");
      return;
    }

    // Build items with splits - share_quantity is the ratio of qty divided by number of splits
    const itemsWithSplits = items.map((item, idx) => {
      const selectedParticipants = receipt.participants?.filter((p) => {
        const key = `${idx}-${p.user_id}`;
        return itemSplits[key];
      }) || [];

      const splitCount = selectedParticipants.length;
      const shareQty = splitCount > 0 ? item.quantity / splitCount : item.quantity;

      return {
        ...item,
        splits: selectedParticipants.map((p) => ({
          user_id: p.user_id,
          share_quantity: shareQty,
        })),
      };
    });

    // Build charges with splits
    const chargesWithSplits = charges.map((charge, idx) => {
      const selectedParticipants = receipt.participants?.filter((p) => {
        const key = `charge-${idx}-${p.user_id}`;
        return itemSplits[key];
      }) || [];

      return {
        ...charge,
        splits: selectedParticipants.map((p) => ({
          user_id: p.user_id,
          share_quantity: 1,
        })),
      };
    });

    setIsSaving(true);
    try {
      const updateData: ReceiptUpdate = {
        version: receipt.version,
        title: title.trim(),
        description: description.trim() || undefined,
        comments: comments.trim() || undefined,
        folder_id: folderId || undefined,
        status,
        tax_cents: taxCents,
        tip_cents: tipCents,
        items: itemsWithSplits,
        charges: chargesWithSplits,
        payments,
      };

      await updateReceipt(id, updateData);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
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
    const itemsSubtotal = items.reduce((total, item) => {
      return total + item.unit_price_cents * item.quantity;
    }, 0);

    const chargesSubtotal = charges.reduce((total, charge) => {
      return total + charge.unit_price_cents;
    }, 0);

    return itemsSubtotal + chargesSubtotal;
  };

  const isFinalized = status === "finalized";

  // Calculate totals
  const subtotal = calculateSubtotal();
  const total = subtotal + taxCents + tipCents;

  // Calculate settlement summary (who owes what)
  const calculateSettlement = () => {
    if (!receipt?.participants) return [];

    return receipt.participants.map((p) => {
      // Calculate this person's share of items
      let owesCents = 0;

      items.forEach((item, idx) => {
        const key = `${idx}-${p.user_id}`;
        if (itemSplits[key]) {
          const selectedCount = receipt.participants?.filter((p2) => {
            const k = `${idx}-${p2.user_id}`;
            return itemSplits[k];
          }).length || 1;
          const sharePrice = (item.unit_price_cents * item.quantity) / selectedCount;
          owesCents += sharePrice;
        }
      });

      // Add their share of charges
      charges.forEach((charge, idx) => {
        const key = `charge-${idx}-${p.user_id}`;
        if (itemSplits[key]) {
          const selectedCount = receipt.participants?.filter((p2) => {
            const k = `charge-${idx}-${p2.user_id}`;
            return itemSplits[k];
          }).length || 1;
          const sharePrice = charge.unit_price_cents / selectedCount;
          owesCents += sharePrice;
        }
      });

      // Calculate their share of tax (proportional to items they're assigned to)
      if (owesCents > 0 && taxCents > 0) {
        const taxShare = (owesCents / (subtotal - taxCents - tipCents)) * taxCents;
        owesCents += taxShare;
      }

      // Add their share of tip (equally distributed among all)
      if (receipt.participants.length > 0) {
        owesCents += tipCents / receipt.participants.length;
      }

      // Calculate amount they've paid
      const paidCents = payments
        .filter((p_) => p_.user_id === p.user_id)
        .reduce((sum, p_) => sum + p_.amount_paid_cents, 0);

      return {
        user_id: p.user_id,
        name: p.name,
        owes: Math.round(owesCents),
        paid: paidCents,
        net: Math.round(owesCents) - paidCents,
      };
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
        onCreateFolder={() => { }}
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
                <div className="flex items-center gap-2 min-h-[32px]">
                  {!showSaved && (
                    <span className="flex items-center text-green-700 font-semibold animate-fade-in mr-1">
                      <CloudCheck className="w-4 h-4 mr-1" /> Saved!
                    </span>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isSaving}
                  >
                    <ArrowLeft className="w-4 h-4 mr-0.5" />
                    Cancel
                  </Button>
                  {/* Save/Finalize Button */}
                  <Button
                    onClick={handleSave}
                    disabled={isSaving || isFinalized}
                    className={isFinalized ? "opacity-50 cursor-not-allowed" : ""}
                  >
                    {isSaving ? "Saving..." : isFinalized ? "Locked" : "Save Changes"}
                  </Button>
                </div>
              </div>
            </div>
          </header>

          {/* Finalized Banner */}
          {isFinalized && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <p className="text-sm font-semibold text-yellow-800">
                ⚠️ Receipt is finalized. Editing is locked.
              </p>
            </div>
          )}

          {/* Two-Column Layout */}
          <div className="grid grid-cols-3 gap-6 w-full px-6 pb-12">
            {/* LEFT COLUMN (70%) */}
            <div className="col-span-2 space-y-6">
              {/* Receipt Details */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Receipt Details</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="folder">Folder</Label>
                      <select
                        id="folder"
                        value={folderId || ""}
                        onChange={(e) => setFolderId(e.target.value || null)}
                        className="w-full px-3 py-2 mt-1 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        disabled={isSaving || isFinalized}
                      >
                        <option value="">No Folder</option>
                        {folders.map((folder) => (
                          <option key={folder.id} value={folder.id}>
                            {folder.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="status">Status</Label>
                      <select
                        id="status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value as "draft" | "finalized")}
                        className="w-full px-3 py-2 mt-1 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        disabled={isSaving}
                      >
                        <option value="draft">Draft</option>
                        <option value="finalized">Finalized</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Team Lunch"
                      disabled={isSaving || isFinalized}
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Optional description"
                      disabled={isSaving || isFinalized}
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
                      disabled={isSaving || isFinalized}
                    />
                  </div>
                </div>
              </Card>

              {/* Items */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Items</h2>

                {items.length > 0 && (
                  <div className="mb-4 overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b-2 border-slate-300">
                          <th className="text-left p-2 font-semibold text-slate-700 min-w-[100px]">
                            Item
                          </th>
                          <th className="text-center p-2 font-semibold text-slate-700 w-12">
                            Qty
                          </th>
                          <th className="text-center p-2 font-semibold text-slate-700 w-16">
                            Price
                          </th>
                          <th className="text-center p-2 font-semibold text-slate-700 w-10">
                            Tax
                          </th>
                          <th className="text-center p-2 font-semibold text-slate-700 w-16">
                            Total
                          </th>
                          {receipt?.participants?.map((p) => (
                            <th
                              key={p.user_id}
                              className="text-center p-2 font-semibold text-slate-700 w-12"
                            >
                              <div className="text-xs truncate" title={p.name}>
                                {p.name.split(" ")[0]}
                              </div>
                            </th>
                          ))}
                          <th className="text-center p-2 font-semibold text-slate-700 w-8" />
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, idx) => (
                          <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50">
                            <td className="p-2">
                              <div className="font-medium">{item.name}</div>
                            </td>
                            <td className="text-center p-2">{item.quantity}</td>
                            <td className="text-center p-2">
                              {formatCurrency(item.unit_price_cents)}
                            </td>
                            <td className="text-center p-2">
                              <span className="text-xs bg-slate-100 px-2 py-1 rounded">
                                {item.taxable ? "✓" : "—"}
                              </span>
                            </td>
                            <td className="text-center p-2 font-semibold">
                              {formatCurrency(item.unit_price_cents * item.quantity)}
                            </td>
                            {receipt?.participants?.length ? (
                              receipt.participants.map((p) => {
                                const key = `${idx}-${p.user_id}`;
                                const isChecked = itemSplits[key];
                                return (
                                  <td key={p.user_id} className="text-center p-2">
                                    <input
                                      type="checkbox"
                                      checked={isChecked || false}
                                      onChange={() => toggleItemSplit(idx, p.user_id)}
                                      disabled={isSaving || isFinalized}
                                      className="w-4 h-4"
                                    />
                                  </td>
                                );
                              })
                            ) : (
                              <td className="text-center p-2">
                                <span className="text-xs text-slate-500">No participants</span>
                              </td>
                            )}
                            <td className="p-2">
                              <button
                                onClick={() => handleRemoveItem(idx)}
                                className="p-1 hover:bg-red-100 text-red-600 rounded"
                                disabled={isFinalized || isSaving}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {!showAddItem && !isFinalized && (
                  <div className="flex gap-2 text-white">
                    <Button
                      variant="outline"
                      onClick={() => setShowAddItem(true)}
                      disabled={isSaving}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Item
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowBulkImport(!showBulkImport)}
                      disabled={isSaving}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Bulk Import
                    </Button>
                  </div>
                )}

                {/* Bulk Import Section */}
                {showBulkImport && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                    <div>
                      <Label htmlFor="csv-input" className="text-sm font-semibold">
                        Paste CSV or TSV Data
                      </Label>
                      <p className="text-xs text-slate-500 mb-2">
                        Format: Item Name, Qty, Line Total Price ($), Taxable (TRUE/FALSE)
                      </p>
                      <textarea
                        id="csv-input"
                        value={csvInput}
                        onChange={(e) => {
                          setCsvInput(e.target.value);
                          setImportError("");
                          setImportSuccess(false);
                        }}
                        placeholder="HUY FONG CHILI SAUCE,1,5.99,FALSE&#10;BREAKFAST COCONUT C,1,1.79,FALSE&#10;PRIMO PASTA SCE,2,1.68,FALSE"
                        className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
                        rows={5}
                        disabled={isSaving}
                      />
                    </div>

                    {/* Error Display */}
                    {importError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded">
                        <p className="text-xs font-semibold text-red-700 mb-1">Import Error</p>
                        <p className="text-xs text-red-600 whitespace-pre-wrap">{importError}</p>
                      </div>
                    )}

                    {/* Preview of Parsed Items */}
                    {importSuccess && parsedItems.length > 0 && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded space-y-2">
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-600" />
                          <p className="text-sm font-semibold text-green-700">
                            Ready to import {parsedItems.length} item{parsedItems.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {parsedItems.map((item, idx) => (
                            <div key={idx} className="text-xs text-green-700 bg-white/50 px-2 py-1 rounded">
                              <span className="font-medium">{item.name}</span>
                              <span className="text-slate-500"> · </span>
                              <span>{item.quantity}x</span>
                              <span className="text-slate-500"> @ </span>
                              <span>{formatCurrency(item.unit_price_cents)}</span>
                              {item.taxable && <span className="text-slate-500"> · Taxable</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      {!importSuccess ? (
                        <>
                          <Button
                            size="sm"
                            onClick={parseCSVInput}
                            disabled={isSaving || !csvInput.trim()}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Parse & Preview
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={resetBulkImport}
                            disabled={isSaving}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            onClick={handleAddBulkItems}
                            disabled={isSaving}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Add All Items
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={resetBulkImport}
                            disabled={isSaving}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </Card>

              {/* Charges */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Additional Charges</h2>

                {charges.length > 0 && (
                  <div className="mb-4 overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b-2 border-slate-300">
                          <th className="text-left p-2 font-semibold text-slate-700 min-w-[100px]">Charge</th>
                          <th className="text-center p-2 font-semibold text-slate-700 w-20">Amount</th>
                          <th className="text-center p-2 font-semibold text-slate-700 w-10">Tax</th>
                          {receipt?.participants?.map((p) => (
                            <th
                              key={p.user_id}
                              className="text-center p-2 font-semibold text-slate-700 w-12"
                            >
                              <div className="text-xs truncate" title={p.name}>
                                {p.name.split(" ")[0]}
                              </div>
                            </th>
                          ))}
                          <th className="text-center p-2 font-semibold text-slate-700 w-8" />
                        </tr>
                      </thead>
                      <tbody>
                        {charges.map((charge, idx) => (
                          <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50">
                            <td className="p-2">
                              <div className="font-medium">{charge.name}</div>
                            </td>
                            <td className="text-center p-2">
                              {formatCurrency(charge.unit_price_cents)}
                            </td>
                            <td className="text-center p-2">
                              <span className="text-xs bg-slate-100 px-2 py-1 rounded">
                                {charge.taxable ? "✓" : "—"}
                              </span>
                            </td>
                            {receipt?.participants?.length ? (
                              receipt.participants.map((p) => {
                                const key = `charge-${idx}-${p.user_id}`;
                                const isChecked = itemSplits[key];
                                return (
                                  <td key={p.user_id} className="text-center p-2">
                                    <input
                                      type="checkbox"
                                      checked={isChecked || false}
                                      onChange={() => toggleChargeSplit(idx, p.user_id)}
                                      disabled={isSaving || isFinalized}
                                      className="w-4 h-4"
                                    />
                                  </td>
                                );
                              })
                            ) : (
                              <td className="text-center p-2">
                                <span className="text-xs text-slate-500">No participants</span>
                              </td>
                            )}
                            <td className="p-2">
                              <button
                                onClick={() => handleRemoveCharge(idx)}
                                className="p-1 hover:bg-red-100 text-red-600 rounded"
                                disabled={isFinalized || isSaving}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {!showAddCharge && !isFinalized && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowAddCharge(true)}
                      disabled={isSaving}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Charge
                    </Button>
                  </div>
                )}

                {showAddCharge ? (
                  <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="charge-name">Charge Name *</Label>
                        <Input
                          id="charge-name"
                          value={newCharge.name}
                          onChange={(e) =>
                            setNewCharge({ ...newCharge, name: e.target.value })
                          }
                          placeholder="e.g., Delivery Fee"
                          disabled={isSaving}
                        />
                      </div>
                      <div>
                        <Label htmlFor="charge-price">Amount ($) *</Label>
                        <Input
                          id="charge-price"
                          type="number"
                          step="0.01"
                          value={(newCharge.unit_price_cents / 100).toFixed(2)}
                          onChange={(e) =>
                            setNewCharge({
                              ...newCharge,
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
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="charge-taxable"
                        checked={newCharge.taxable}
                        onChange={(e) =>
                          setNewCharge({
                            ...newCharge,
                            taxable: e.target.checked,
                          })
                        }
                        disabled={isSaving}
                      />
                      <Label htmlFor="charge-taxable" className="cursor-pointer">
                        Taxable
                      </Label>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleAddCharge}
                        disabled={isSaving}
                      >
                        Add Charge
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowAddCharge(false)}
                        disabled={isSaving}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setShowAddCharge(true)}
                    disabled={isSaving || isFinalized}
                    className="text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Charge
                  </Button>
                )}
              </Card>
            </div>

            {/* RIGHT COLUMN (30%) - STICKY */}
            <div className="sticky top-[120px] h-fit space-y-6">
              {/* Totals Card */}
              <Card className="p-6 bg-gradient-to-br from-slate-50 to-indigo-50">
                <h3 className="font-semibold text-lg mb-4 text-slate-900">Totals</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Subtotal</span>
                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Tax</span>
                    <div className="flex items-center gap-2">
                      <span>$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={(taxCents / 100).toFixed(2)}
                        onChange={(e) =>
                          setTaxCents(Math.round(parseFloat(e.target.value) * 100))
                        }
                        className="w-20 px-2 py-1 border border-slate-300 rounded text-right text-xs"
                        disabled={isSaving || isFinalized}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Tip</span>
                    <div className="flex items-center gap-2">
                      <span>$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={(tipCents / 100).toFixed(2)}
                        onChange={(e) =>
                          setTipCents(Math.round(parseFloat(e.target.value) * 100))
                        }
                        className="w-20 px-2 py-1 border border-slate-300 rounded text-right text-xs"
                        disabled={isSaving || isFinalized}
                      />
                    </div>
                  </div>

                  <div className="border-t border-slate-300 pt-3 flex justify-between">
                    <span className="font-bold">Total</span>
                    <span className="font-bold text-lg text-indigo-600">{formatCurrency(total)}</span>
                  </div>
                </div>
              </Card>

              {/* Settlement Summary Card */}
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4 text-slate-900">Settlement</h3>
                <div className="space-y-3">
                  {calculateSettlement().map((settlement) => (
                    <div key={settlement.user_id} className="p-3 bg-slate-50 rounded-lg space-y-1 text-sm">
                      <div className="font-medium text-slate-900">{settlement.name}</div>
                      <div className="text-xs space-y-1">
                        <div className="flex justify-between text-slate-600">
                          <span>Owes:</span>
                          <span className="font-medium">{formatCurrency(settlement.owes)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Paid:</span>
                          <span className="font-medium">{formatCurrency(settlement.paid)}</span>
                        </div>
                        <div className={`flex justify-between font-bold ${settlement.net > 0 ? 'text-red-600' : settlement.net < 0 ? 'text-green-600' : 'text-slate-600'
                          }`}>
                          <span>Balance:</span>
                          <span>{formatCurrency(settlement.net)}</span>
                        </div>
                      </div>
                      <div className="pt-1 flex justify-end">
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${settlement.net === 0 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                          {settlement.net === 0 ? 'Settled' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Payments Card */}
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4 text-slate-900">Payments</h3>
                <div className="space-y-3">
                  {/* Add Payment Form */}
                  <div className="space-y-2 p-3 bg-slate-50 rounded-lg">
                    <div className="text-xs font-semibold text-slate-700 mb-2">Record Payment</div>
                    <select
                      id="payment-user"
                      className="w-full px-2 py-1 border border-slate-300 rounded text-xs mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      disabled={isSaving || isFinalized}
                    >
                      <option value="">Select payer...</option>
                      {receipt?.participants?.map((p) => (
                        <option key={p.user_id} value={p.user_id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Amount"
                        className="flex-1 px-2 py-1 border border-slate-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        disabled={isSaving || isFinalized}
                      />
                      <Button
                        size="sm"
                        className="text-xs px-2"
                        disabled={isSaving || isFinalized}
                      >
                        Add
                      </Button>
                    </div>
                  </div>

                  {/* Payment List */}
                  {payments && payments.length > 0 ? (
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {payments.map((payment, idx) => {
                        const payer = receipt?.participants?.find((p) => p.user_id === payment.user_id);
                        return (
                          <div key={idx} className="flex justify-between items-center p-2 bg-white border border-slate-200 rounded text-xs">
                            <span>
                              <span className="font-medium">{payer?.name || 'Unknown'}</span>
                              <span className="text-slate-500"> paid </span>
                            </span>
                            <span className="font-semibold text-green-600">
                              {formatCurrency(payment.amount_paid_cents)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-2">No payments recorded yet</p>
                  )}
                </div>
              </Card>

              {/* Metadata Footer */}
              {receipt && (
                <div className="text-xs text-slate-500 space-y-1 p-3 bg-slate-50 rounded-lg">
                  <div>Created {new Date(receipt.created_at).toLocaleDateString()}</div>
                  <div>Last updated {new Date(receipt.updated_at || receipt.created_at).toLocaleDateString()}</div>
                  <div>Version {receipt.version}</div>
                  <div>Owner: {receipt.participants?.find((p) => p.role === 'owner')?.name || 'Unknown'}</div>
                </div>
              )}
            </div>
          </div>

          {/* Members Section in Left Column */}
          <div className="w-full px-6 pb-12">
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
                          {p.name
                            .trim()
                            .split(/\s+/)
                            .slice(0, 2)
                            .map(word => word[0])
                            .join("")
                            .toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{p.name}</p>
                          <p className="text-xs text-slate-500">{p.role}</p>
                        </div>
                      </div>
                      {p.role !== "owner" && (
                        <button
                          onClick={() => handleRemoveMember(p.user_id, p.name)}
                          className="p-2 hover:bg-red-100 text-red-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isSaving || isFinalized}
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
                      disabled={isAddingMember || isSaving || isFinalized}
                    />
                    <Button
                      onClick={handleAddMember}
                      disabled={isAddingMember || isSaving || isFinalized}
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
