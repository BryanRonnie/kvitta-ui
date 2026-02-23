"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useAuth } from "@/contexts/AuthContext";
import { logout } from "@/api/auth.api";
import { listFolders, createFolder } from "@/api/folder.api";
import { listReceipts, createReceipt, deleteReceipt } from "@/api/receipt.api";
import { Folder } from "@/types/folder";
import { Receipt } from "@/types/receipt";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { ReceiptCard } from "@/components/dashboard/ReceiptCard";
import { AddReceiptCard } from "@/components/dashboard/AddReceiptCard";
import { CreateFolderModal } from "@/components/dashboard/CreateFolderModal";
import { CreateReceiptModal } from "@/components/dashboard/CreateReceiptModal";

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout: clearAuth } = useAuth();

  const [folders, setFolders] = useState<Folder[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Get folder ID from URL params
  const selectedFolderId = searchParams.get("folder");

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [foldersData, receiptsData] = await Promise.all([
        listFolders(),
        listReceipts(),
      ]);
      setFolders(foldersData.filter((f) => !f.is_deleted));
      setReceipts(receiptsData);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate receipt counts per folder
  const receiptCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    receipts.forEach((receipt) => {
      if (receipt.folder_id) {
        counts[receipt.folder_id] = (counts[receipt.folder_id] || 0) + 1;
      }
    });
    return counts;
  }, [receipts]);

  // Filter receipts based on selected folder and search
  const filteredReceipts = useMemo(() => {
    let filtered = receipts;

    // Filter by folder
    if (selectedFolderId) {
      filtered = filtered.filter((r) => r.folder_id === selectedFolderId);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(query) ||
          r.description?.toLowerCase().includes(query) ||
          r.items?.some((item: any) => item.name.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [receipts, selectedFolderId, searchQuery]);

  // Get current folder
  const currentFolder = selectedFolderId
    ? folders.find((f) => f.id === selectedFolderId)
    : null;
  
  const currentFolderName = currentFolder?.name || "All Receipts";

  // Breadcrumb items
  const breadcrumbItems = currentFolder
    ? [{ label: currentFolder.name }]
    : [];

  // Handle folder selection via URL
  const handleFolderSelect = (folderId: string | null) => {
    if (folderId) {
      router.push(`/dashboard?folder=${folderId}`);
    } else {
      router.push("/dashboard");
    }
  };

  const handleCreateFolder = async (name: string, color: string) => {
    const newFolder = await createFolder({ name, color });
    setFolders([...folders, newFolder]);
  };

  const handleCreateReceipt = async (
    title: string,
    description: string,
    folderId: string | null
  ) => {
    const newReceipt = await createReceipt({
      title,
      description: description || undefined,
      folder_id: folderId,
    });
    setReceipts([newReceipt, ...receipts]);
  };

  const handleDeleteReceipt = async (id: string) => {
    if (!confirm("Are you sure you want to delete this receipt?")) return;
    try {
      await deleteReceipt(id);
      setReceipts(receipts.filter((r) => r.id !== id));
    } catch (err) {
      console.error("Failed to delete receipt:", err);
      alert("Failed to delete receipt");
    }
  };

  const handleViewReceipt = (id: string) => {
    router.push(`/receipts/${id}`);
  };

  const handleEditReceipt = (id: string) => {
    router.push(`/receipts/${id}/edit`);
  };

  return (
    <SidebarProvider>
      <DashboardSidebar
        folders={folders}
        selectedFolderId={selectedFolderId}
        onFolderSelect={handleFolderSelect}
        onCreateFolder={() => setShowFolderModal(true)}
        receiptCounts={receiptCounts}
      />
      
      <SidebarInset>
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="px-6 py-4 space-y-3">
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <Breadcrumb items={breadcrumbItems} />
              </div>
              <Button onClick={() => setShowReceiptModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Receipt
              </Button>
            </div>
            
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-baseline gap-4">
                <h1 className="text-2xl font-bold text-slate-900">
                  {currentFolderName}
                </h1>
                <span className="text-sm text-slate-500">
                  {filteredReceipts.length}{" "}
                  {filteredReceipts.length === 1 ? "receipt" : "receipts"}
                </span>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search receipts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-[280px] pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Receipts Grid */}
        <div className="flex-1 p-8 bg-slate-50">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                <p className="mt-4 text-slate-500">Loading receipts...</p>
              </div>
            </div>
          ) : filteredReceipts.length === 0 && searchQuery === "" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AddReceiptCard key="add-new-empty" onAdd={() => setShowReceiptModal(true)} />
            </div>
          ) : filteredReceipts.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <p className="text-lg text-slate-500">No receipts found</p>
                <p className="text-sm text-slate-400 mt-2">
                  Try adjusting your search
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredReceipts.map((receipt) => (
                <ReceiptCard
                  key={receipt.id}
                  receipt={receipt}
                  onView={handleViewReceipt}
                  onEdit={handleEditReceipt}
                  onDelete={handleDeleteReceipt}
                />
              ))}
              <AddReceiptCard key="add-new" onAdd={() => setShowReceiptModal(true)} />
            </div>
          )}
        </div>
      </SidebarInset>

      {/* Modals */}
      <CreateFolderModal
        isOpen={showFolderModal}
        onClose={() => setShowFolderModal(false)}
        onSubmit={handleCreateFolder}
      />

      <CreateReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        onSubmit={handleCreateReceipt}
        folders={folders}
      />
    </SidebarProvider>
  );
}
