/**
 * Example: Receipt Upload Page
 * 
 * This component demonstrates:
 * - Client-side file handling
 * - API integration with error handling
 * - Loading states
 * - Displaying results
 * 
 * This is a CLIENT component because it uses:
 * - useState, useCallback (React hooks)
 * - User interactions (file upload, button clicks)
 */

'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FileUpload } from '@/components/FileUpload';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { extractReceiptText, getReceipt, listGroups, addGroupMember } from '@/lib/api';
import { OcrResponse, ItemsAnalysis, ChargesAnalysis } from '@/types';
import type { Group } from '@/types';
import { Users, X } from 'lucide-react';
import { toast } from 'sonner';

interface EditableLineItem {
  name_raw: string;
  quantity: number | null;
  unit_price: number | null;
  line_subtotal: number | null;
  taxable: boolean;
}

const HST_RATE = 0.13;

export default function UploadPage() {
  // State management using React hooks
  const router = useRouter();
  const searchParams = useSearchParams();
  const [inputMethod, setInputMethod] = useState<'upload' | 'csv'>('csv');
  const [bulkCsvInput, setBulkCsvInput] = useState('');
  const [itemsImages, setItemsImages] = useState<File[]>([]);
  const [chargesImage, setChargesImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OcrResponse | null>(null);
  const [itemsPreviewUrls, setItemsPreviewUrls] = useState<string[]>([]);
  const [chargesPreviewUrl, setChargesPreviewUrl] = useState<string | null>(null);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const [editableItems, setEditableItems] = useState<EditableLineItem[] | null>(null);
  const [showItemsJson, setShowItemsJson] = useState(false);
  const [showChargesJson, setShowChargesJson] = useState(false);
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [csvInput, setCsvInput] = useState('');
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const [addMemberError, setAddMemberError] = useState<string | null>(null);

  // Load existing receipt data if receiptId is provided in URL
  useEffect(() => {
    const receiptId = searchParams.get('receiptId');
    if (receiptId) {
      const loadExistingReceipt = async () => {
        try {
          setError(null);
          setIsLoading(true);
          const receipt = await getReceipt(receiptId);

          // If receipt is already processed, display the results
          if (receipt.status === 'completed' || (receipt.status as string) === 'PROCESSED') {
            setResult({
              total_items_processed: receipt.items_analysis?.line_items?.length || 0,
              items_analysis: receipt.items_analysis,
              charges_analysis: receipt.charges_analysis,
              full_text: "Processing complete.",
              success: true
            });

            if (receipt.items_analysis?.line_items) {
              const items = receipt.items_analysis.line_items.map((item: any) => ({
                ...item,
                name_raw: item.name_raw ?? '',
                quantity: item.quantity ?? null,
                unit_price: item.unit_price ?? null,
                line_subtotal: item.line_subtotal ?? null,
                taxable: item.taxable ?? false
              }));
              setEditableItems(items);
            }
          }
          // If still processing, let user wait for completion or refresh
          // If not started, show upload form (default state)
        } catch (err) {
          console.error('Error loading receipt:', err);
          // If receipt not found or error, show upload form
        } finally {
          setIsLoading(false);
        }
      };

      loadExistingReceipt();
    }
  }, [searchParams]);

  // Load group members if groupId is provided in URL
  useEffect(() => {
    const groupId = searchParams.get('groupId');
    const loadGroup = async () => {
      try {
        const groups = await listGroups();
        const group = groups.find((g: Group) => g.id === groupId);
        if (group) {
          setCurrentGroup(group);
        }
      } catch (err) {
        console.error('Error loading group:', err);
      }
    };

    if (groupId) {
      loadGroup();
    }
  }, [searchParams]);

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };
  const removeItemImage = (index: number) => {
    setItemsImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeChargesImage = () => {
    setChargesImage(null);
  };

  useEffect(() => {
    const itemUrls = itemsImages.map((file) => URL.createObjectURL(file));
    setItemsPreviewUrls(itemUrls);

    const chargesUrl = chargesImage ? URL.createObjectURL(chargesImage) : null;
    setChargesPreviewUrl(chargesUrl);

    return () => {
      itemUrls.forEach((url) => URL.revokeObjectURL(url));
      if (chargesUrl) URL.revokeObjectURL(chargesUrl);
    };
  }, [itemsImages, chargesImage]);

  // Close modal on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setEnlargedImage(null);
    };
    if (enlargedImage) {
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }
  }, [enlargedImage]);

  /**
   * Handle file upload submission
   * Uses useCallback to prevent unnecessary re-renders
   */
  const handleSubmit = useCallback(async () => {
    if (itemsImages.length === 0 || !chargesImage) {
      setError('Please select both item images and a charges image.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    itemsImages.forEach((file) => {
      formData.append('receipt_items', file);
    });
    formData.append('charges_image', chargesImage);

    // Append group_id if present
    const groupIdParam = searchParams.get('groupId');
    if (groupIdParam) {
      formData.append('group_id', groupIdParam);
    }

    try {
      // 1. Start Upload
      const uploadResp = await extractReceiptText(formData);
      const receiptId = uploadResp.receipt_id;

      // Update URL with receiptId so user can refresh or bookmark
      router.push(`/upload?receiptId=${receiptId}`, { scroll: false });

      // 2. Poll for Completion
      const pollInterval = 2000;
      const maxAttempts = 30;
      let attempts = 0;

      const poll = async () => {
        if (attempts >= maxAttempts) {
          setError("Processing timed out. Please check your dashboard later.");
          setIsLoading(false);
          return;
        }
        attempts++;

        try {
          const receipt = await getReceipt(receiptId);

          // Check for various success statuses based on backend observation
          if (receipt.status === 'completed' || (receipt.status as string) === 'PROCESSED') {
            // Success!
            setResult({
              total_items_processed: receipt.items_analysis?.line_items?.length || 0,
              items_analysis: receipt.items_analysis,
              charges_analysis: receipt.charges_analysis,
              full_text: "Processing complete.",
              success: true
            });

            // Initialize editable items if items analysis exists
            if (receipt.items_analysis?.line_items) {
              const items = receipt.items_analysis.line_items.map((item: any, idx: number) => ({
                ...item,
                name_raw: item.name_raw ?? '',
                quantity: item.quantity ?? null,
                unit_price: item.unit_price ?? null,
                line_subtotal: item.line_subtotal ?? null,
                taxable: item.taxable ?? false
              }));
              setEditableItems(items);
            }

            setIsLoading(false);
          } else if (receipt.status === 'error') {
            throw new Error("Receipt processing failed on the server.");
          } else {
            // Still processing, wait and retry
            setTimeout(poll, pollInterval);
          }
        } catch (err) {
          console.warn("Polling error:", err);
          setTimeout(poll, pollInterval);
        }
      };

      // Start polling
      setTimeout(poll, 1000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setIsLoading(false);
    }
  }, [itemsImages, chargesImage, searchParams]);

  /**
   * Parse the JSON response from LLM
   * The backend now returns parsed JSON directly, not as a string
   */
  const parseItemsAnalysis = useCallback((): ItemsAnalysis | null => {
    if (!result?.items_analysis) return null;

    try {
      // Check if it's already parsed (object) or if it's a string
      if (typeof result.items_analysis === 'string') {
        const parsed = JSON.parse(result.items_analysis);

        // Handle backwards compatibility: convert total_price to line_subtotal if needed
        if (parsed.line_items) {
          parsed.line_items = parsed.line_items.map((item: any) => ({
            ...item,
            line_subtotal: item.line_subtotal ?? item.total_price ?? null
          }));
        }

        return parsed;
      } else {
        // Already parsed object from backend
        return result.items_analysis as ItemsAnalysis;
      }
    } catch {
      return null;
    }
  }, [result]);

  const parseChargesAnalysis = useCallback((): ChargesAnalysis | null => {
    if (!result?.charges_analysis) return null;

    try {
      // Check if it's already parsed (object) or if it's a string
      if (typeof result.charges_analysis === 'string') {
        return JSON.parse(result.charges_analysis);
      } else {
        // Already parsed object from backend
        return result.charges_analysis as ChargesAnalysis;
      }
    } catch {
      return null;
    }
  }, [result]);

  const itemsData = useMemo(() => parseItemsAnalysis(), [parseItemsAnalysis]);
  const chargesData = useMemo(() => parseChargesAnalysis(), [parseChargesAnalysis]);

  useEffect(() => {
    if (!itemsData?.line_items) {
      setEditableItems(null);
      return;
    }

    setEditableItems(
      itemsData.line_items.map((item) => ({
        name_raw: item.name_raw ?? '',
        quantity: item.quantity ?? null,
        unit_price: item.unit_price ?? null,
        line_subtotal: item.line_subtotal ?? null,
        taxable: item.taxable ?? false
      }))
    );
  }, [itemsData]);

  const updateEditableItem = (
    index: number,
    updates: Partial<EditableLineItem>
  ) => {
    setEditableItems((prev) => {
      if (!prev) return prev;
      return prev.map((item, idx) => (idx === index ? { ...item, ...updates } : item));
    });
  };

  const addEditableItem = () => {
    setEditableItems((prev) => {
      const next = prev ?? [];
      return [
        ...next,
        {
          name_raw: '',
          quantity: 1,
          unit_price: null,
          line_subtotal: null,
          taxable: false
        }
      ];
    });
  };

  const importFromCsv = () => {
    if (!csvInput.trim()) return;

    const lines = csvInput.trim().split('\n');
    const newItems: EditableLineItem[] = [];

    lines.forEach((line, index) => {
      // Skip empty lines
      if (!line.trim()) return;

      // Skip header if first line looks like a header
      if (index === 0 && (line.toLowerCase().includes('name') || line.toLowerCase().includes('item'))) {
        return;
      }

      // Parse CSV line (handle quoted values)
      const values = line.match(/(?:"([^"]*)"|([^,]+))(?:,|$)/g)?.map(v =>
        v.replace(/,$/, '').replace(/^"/, '').replace(/"$/, '').trim()
      ) || [];

      if (values.length >= 1) {
        const item: EditableLineItem = {
          name_raw: values[0] || '',
          quantity: values[1] ? parseFloat(values[1]) : 1,
          unit_price: values[2] ? parseFloat(values[2]) : null,
          line_subtotal: null,
          taxable: values[3] ? (values[3].toLowerCase() === 'true' || values[3] === '1') : false
        };
        newItems.push(item);
      }
    });

    if (newItems.length > 0) {
      setEditableItems((prev) => {
        const existing = prev ?? [];
        return [...existing, ...newItems];
      });
      setCsvInput('');
      setShowCsvImport(false);
    }
  };

  const processBulkCsv = () => {
    if (!bulkCsvInput.trim()) {
      setError('Please enter CSV data');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const lines = bulkCsvInput.trim().split('\n');
      const items: EditableLineItem[] = [];
      const fees: { type: string; amount: number; taxable: boolean }[] = [];
      const discounts: { description: string; amount: number }[] = [];

      // Determine delimiter (Tab for TSV, Comma for CSV)
      // We check the first few lines to see which delimiter is more common
      const sampleLines = lines.slice(0, 5).join('\n');
      const tabCount = (sampleLines.match(/\t/g) || []).length;
      const commaCount = (sampleLines.match(/,/g) || []).length;
      const delimiter = tabCount > commaCount ? '\t' : ','; // Default to comma if unsure

      // Keywords that indicate charges/fees instead of items
      const chargeKeywords = [
        'discount', 'coupon', 'promo',
        'fee', 'charge', 'surcharge',
        'delivery', 'shipping', 'handling',
        'bag', 'checkout bag', 'carrier bag',
        'tip', 'gratuity', 'service charge',
        'tax', 'hst', 'gst', 'pst', 'vat'
      ];

      lines.forEach((line, index) => {
        if (!line.trim()) return;

        // Skip header row
        if (index === 0 && (line.toLowerCase().includes('name') || line.toLowerCase().includes('item'))) {
          return;
        }

        // Parse CSV/TSV line
        // Regex to handle quoted values (only for comma delimiter usually, but good to have)
        // For TSV, we can usually just split by tab as quotes are less common, but let's be robust
        let values: string[] = [];

        if (delimiter === ',') {
          // CSV regex for quoted values
          values = line.match(/(?:"([^"]*)"|([^,]+))(?:,|$)/g)?.map(v =>
            v.replace(/,$/, '').replace(/^"/, '').replace(/"$/, '').trim()
          ) || [];
        } else {
          // TSV split
          values = line.split('\t').map(v => v.trim());
        }

        if (values.length < 1) return;

        const name = values[0] || '';
        const quantity = values[1] ? parseFloat(values[1]) : 1;
        const totalPrice = values[2] ? parseFloat(values[2]) : 0;
        const taxable = values[3] ? (values[3].toLowerCase() === 'true' || values[3] === '1') : false;

        const nameLower = name.toLowerCase();
        const isCharge = chargeKeywords.some(keyword => nameLower.includes(keyword));
        const isDiscount = nameLower.includes('discount') || nameLower.includes('coupon') || nameLower.includes('promo') || totalPrice < 0;

        if (isDiscount) {
          discounts.push({
            description: name,
            amount: Math.abs(totalPrice)
          });
        } else if (isCharge) {
          fees.push({
            type: name,
            amount: totalPrice,
            taxable
          });
        } else {
          items.push({
            name_raw: name,
            quantity,
            unit_price: quantity > 0 ? totalPrice / quantity : totalPrice,
            line_subtotal: totalPrice,
            taxable
          });
        }
      });

      // Calculate totals
      const itemsSubtotal = items.reduce((sum, item) => sum + (item.line_subtotal || 0), 0);
      const feesTotal = fees.reduce((sum, fee) => sum + fee.amount, 0);
      const discountsTotal = discounts.reduce((sum, d) => sum + d.amount, 0);
      const taxableAmount = items.filter(i => i.taxable).reduce((sum, i) => sum + (i.line_subtotal || 0), 0) +
        fees.filter(f => f.taxable).reduce((sum, f) => sum + f.amount, 0);
      const totalTax = taxableAmount * HST_RATE;
      const grandTotal = itemsSubtotal + feesTotal - discountsTotal + totalTax;

      // Set results
      setResult({
        total_items_processed: items.length,
        items_analysis: { line_items: items as any },
        charges_analysis: {
          subtotal_items: itemsSubtotal,
          fees,
          discounts,
          total_tax_reported: totalTax,
          grand_total: grandTotal
        },
        full_text: 'Imported from CSV',
        success: true
      });

      setEditableItems(items);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process CSV');
      setIsLoading(false);
    }
  };

  const removeEditableItem = (index: number) => {
    setEditableItems((prev) => {
      if (!prev) return prev;
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const computeLineSubtotal = (item: EditableLineItem) => {
    if (item.quantity == null || item.unit_price == null) return null;
    return item.quantity * item.unit_price;
  };

  const computedTotals = useMemo(() => {
    if (!editableItems) return null;

    let itemsSubtotal = 0;
    let hstTotal = 0;

    editableItems.forEach((item) => {
      const lineSubtotal = computeLineSubtotal(item);
      if (lineSubtotal == null) return;

      itemsSubtotal += lineSubtotal;

      if (item.taxable) hstTotal += lineSubtotal * HST_RATE;
    });

    return {
      itemsSubtotal,
      hstTotal,
      totalWithTax: itemsSubtotal + hstTotal
    };
  }, [editableItems]);

  const handleGoToSplit = useCallback(() => {
    const receiptId = searchParams.get('receiptId');
    const target = receiptId
      ? `/split?receiptId=${encodeURIComponent(receiptId)}`
      : '/split';
    router.push(target);
  }, [router, searchParams]);

  const handleRefreshReceipt = useCallback(async () => {
    const receiptId = searchParams.get('receiptId');
    if (!receiptId) return;

    setIsLoading(true);
    setError(null);

    try {
      const receipt = await getReceipt(receiptId);

      if (receipt.status === 'completed' || (receipt.status as string) === 'PROCESSED') {

        setResult({
          total_items_processed: receipt.items_analysis?.line_items?.length || 0,
          items_analysis: receipt.items_analysis,
          charges_analysis: receipt.charges_analysis,
          full_text: "Processing complete.",
          success: true
        });

        if (receipt.items_analysis?.line_items) {
          const items = receipt.items_analysis.line_items.map((item: any) => ({
            ...item,
            name_raw: item.name_raw ?? '',
            quantity: item.quantity ?? null,
            unit_price: item.unit_price ?? null,
            line_subtotal: item.line_subtotal ?? null,
            taxable: item.taxable ?? false
          }));
          setEditableItems(items);
        }
      } else {
        setError('Receipt is still processing. Please try again in a moment.');
      }
    } catch (err) {
      setError('Failed to load receipt: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="text-gray-500 hover:text-gray-900"
          >
            ← Back to Dashboard
          </Button>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          {result ? 'Receipt Results' : 'Upload Receipt'}
        </h1>

        {/* Group Members Card */}
        {currentGroup && (
          <Card className="mb-6 bg-white border border-gray-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold">Group: {currentGroup.name}</h2>
                </div>
                <button
                  onClick={() => setShowMembersModal(true)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Manage Members
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {currentGroup.members.map((member) => (
                  <div
                    key={member.email}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-full text-sm"
                  >
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold">
                      {getInitials(member.email)}
                    </div>
                    <span className="text-gray-700">{member.email}</span>
                    {member.role === 'admin' && (
                      <span className="text-xs text-blue-600 font-medium ml-1">Owner</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Members Modal */}
        {showMembersModal && currentGroup && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setShowMembersModal(false)}>
            <div
              className="bg-white border border-gray-300 rounded-2xl w-[90%] max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold">Group Members</h2>
                <button
                  onClick={() => setShowMembersModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-3">
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {currentGroup.members.map((member) => (
                    <div key={member.email} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold">
                          {getInitials(member.email)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">{member.email}</span>
                          {member.role === 'admin' && (
                            <span className="text-xs text-gray-500">Owner</span>
                          )}
                        </div>
                      </div>
                      {member.role === 'admin' && (
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          Owner
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Member Section */}
                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <h3 className="font-semibold text-sm">Add Member</h3>
                  <div className="space-y-2">
                    <Label htmlFor="upload-member-email">Email Address</Label>
                    <Input
                      id="upload-member-email"
                      type="email"
                      placeholder="Enter member's email"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                    />
                  </div>

                  {addMemberError && (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                      {addMemberError}
                    </div>
                  )}

                  <Button
                    onClick={async () => {
                      if (!newMemberEmail.trim()) {
                        setAddMemberError('Please enter an email address');
                        return;
                      }
                      
                      setAddMemberLoading(true);
                      setAddMemberError(null);
                      try {
                        await addGroupMember(currentGroup.id, newMemberEmail);
                        
                        // Reload groups to update the member list
                        const groups = await listGroups();
                        const updatedGroup = groups.find((g: Group) => g.id === currentGroup.id);
                        if (updatedGroup) {
                          setCurrentGroup(updatedGroup);
                        }
                        
                        setNewMemberEmail('');
                        toast.success('Member added successfully');
                      } catch (err) {
                        const errorMsg = err instanceof Error ? err.message : 'Failed to add member';
                        setAddMemberError(errorMsg);
                        toast.error(errorMsg);
                      } finally {
                        setAddMemberLoading(false);
                      }
                    }}
                    isLoading={addMemberLoading}
                    className="w-full"
                  >
                    {addMemberLoading ? 'Adding...' : 'Add Member'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        {searchParams.get('receiptId') && result && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              This is a previously uploaded receipt. You can review and modify the extracted data below, or <button onClick={() => router.push('/dashboard')} className="underline font-semibold">return to dashboard</button>.
            </p>
          </div>
        )}

        {/* Show loading state for existing receipts */}
        {searchParams.get('receiptId') && isLoading && !result && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              Loading receipt data...
            </p>
          </div>
        )}

        {/* Input Method Tabs */}
        {!result && (
          <div className="mb-6">
            <div className="flex gap-2 border-b border-gray-200">
              <button
                disabled
                className="px-4 py-2 font-medium transition-colors text-gray-400 cursor-not-allowed relative"
                title="Image upload coming soon"
              >
                <span className="flex items-center gap-2">
                  Upload Images
                  <span className="inline-block px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded">
                    Coming Soon
                  </span>
                </span>
              </button>
              <button
                onClick={() => setInputMethod('csv')}
                className={`px-4 py-2 font-medium transition-colors ${inputMethod === 'csv'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                Import CSV
              </button>
            </div>
          </div>
        )}

        {/* CSV Import Section */}
        {!result && inputMethod === 'csv' && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <h2 className="text-lg font-semibold">Import Receipt from CSV</h2>
                <p className="text-sm text-gray-600">
                  Paste your receipt data in CSV or TSV (Excel/Sheets) format. Items with keywords like 'discount', 'fee', 'delivery', 'bag', 'tip' will be automatically categorized as charges.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CSV Data
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      Format: item_name, quantity, total_price, taxable (true/false)
                    </p>
                    <textarea
                      value={bulkCsvInput}
                      onChange={(e) => setBulkCsvInput(e.target.value)}
                      placeholder={`Apple,2,3.98,true\nBanana,5,2.95,false\nDelivery Fee,1,3.99,false\nDiscount,1,-2.00,false`}
                      className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={processBulkCsv}
                      isLoading={isLoading}
                      disabled={!bulkCsvInput.trim()}
                    >
                      {isLoading ? 'Processing...' : 'Process CSV'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setBulkCsvInput('')}
                      disabled={!bulkCsvInput.trim()}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Upload Section - Disabled for now */}
        {!result && inputMethod === 'upload' && (
          <>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold">Items Images</h2>
                  <p className="text-sm text-gray-600">
                    Upload images showing purchased items
                  </p>
                </CardHeader>
                <CardContent>
                  <FileUpload
                    onFilesSelected={setItemsImages}
                    multiple
                    maxFiles={5}
                    accept="image/*"
                  />
                  {itemsImages.length > 0 && (
                    <p className="mt-2 text-sm text-gray-600">
                      {itemsImages.length} file(s) selected
                    </p>
                  )}
                  {itemsPreviewUrls.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      {itemsPreviewUrls.map((url, index) => (
                        <div
                          key={`${url}-${index}`}
                          className="relative overflow-hidden rounded-md border group"
                        >
                          <img
                            src={url}
                            alt={`Item preview ${index + 1}`}
                            className="h-24 w-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setEnlargedImage(url)}
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeItemImage(index);
                            }}
                            className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Remove image"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2" />
                              <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold">Charges Image</h2>
                  <p className="text-sm text-gray-600">
                    Upload image showing totals and fees
                  </p>
                </CardHeader>
                <CardContent>
                  <FileUpload
                    onFilesSelected={(files) => setChargesImage(files[0] || null)}
                    accept="image/*"
                  />
                  {chargesImage && (
                    <p className="mt-2 text-sm text-gray-600">
                      {chargesImage.name}
                    </p>
                  )}
                  {chargesPreviewUrl && (
                    <div className="mt-4 relative overflow-hidden rounded-md border group">
                      <img
                        src={chargesPreviewUrl}
                        alt="Charges preview"
                        className="h-40 w-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setEnlargedImage(chargesPreviewUrl)}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeChargesImage();
                        }}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Remove image"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2" />
                          <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2" />
                        </svg>
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              isLoading={isLoading}
              disabled={itemsImages.length === 0 || !chargesImage}
              size="lg"
              className="w-full md:w-auto"
            >
              {isLoading ? 'Processing...' : 'Extract Receipt Data'}
            </Button>
          </>
        )}

        {/* Results Section */}
        {result && (
          <div className="mt-8 space-y-6">
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setResult(null);
                  setEditableItems(null);
                  setItemsImages([]);
                  setChargesImage(null);
                  setBulkCsvInput('');
                  setError(null);
                  // Optional: clear URL receiptId if you want to fully detach from the current receipt context
                  // router.push('/upload'); 
                }}
              >
                Start Over
              </Button>
              {searchParams.get('receiptId') && (
                <Button
                  variant="outline"
                  onClick={handleRefreshReceipt}
                  isLoading={isLoading}
                >
                  Refresh
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleGoToSplit}
              >
                Split
              </Button>
            </div>
            <Card>
              <CardHeader>
                <h2 className="text-2xl font-bold">Extraction Results</h2>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-center justify-between text-sm">
                  <span className="text-gray-600">Items Processed:</span>
                  <span className="font-semibold">
                    {result.total_items_processed ?? 'N/A'}
                  </span>
                </div>
                <h3 className="font-semibold mb-2">Raw OCR Text</h3>
                <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
                  {result.full_text ?? 'No raw OCR text in this response.'}
                </pre>
                {result.items_analysis && (
                  <>
                    <div className="mt-4 flex items-center justify-between">
                      <h3 className="font-semibold">Items Analysis (Raw JSON)</h3>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowItemsJson((prev) => !prev)}
                      >
                        {showItemsJson ? 'Hide' : 'Show'}
                      </Button>
                    </div>
                    {showItemsJson && (
                      <pre className="mt-2 bg-gray-100 p-4 rounded overflow-x-auto text-sm">
                        {typeof result.items_analysis === 'string'
                          ? result.items_analysis
                          : JSON.stringify(result.items_analysis, null, 2)}
                      </pre>
                    )}
                  </>
                )}
                {result.charges_analysis && (
                  <>
                    <div className="mt-4 flex items-center justify-between">
                      <h3 className="font-semibold">Charges Analysis (Raw JSON)</h3>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowChargesJson((prev) => !prev)}
                      >
                        {showChargesJson ? 'Hide' : 'Show'}
                      </Button>
                    </div>
                    {showChargesJson && (
                      <pre className="mt-2 bg-gray-100 p-4 rounded overflow-x-auto text-sm">
                        {typeof result.charges_analysis === 'string'
                          ? result.charges_analysis
                          : JSON.stringify(result.charges_analysis, null, 2)}
                      </pre>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {itemsData && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Parsed Items</h2>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowCsvImport(!showCsvImport)}
                      >
                        Import CSV
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={addEditableItem}
                      >
                        Add Item
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {showCsvImport && (
                    <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <h3 className="text-sm font-semibold mb-2">Paste CSV Data</h3>
                      <p className="text-xs text-gray-600 mb-2">
                        Format: name, quantity, unit_price, taxable (true/false)
                      </p>
                      <textarea
                        value={csvInput}
                        onChange={(e) => setCsvInput(e.target.value)}
                        placeholder="Apple,2,1.99,true&#13;&#10;Banana,5,0.59,false&#13;&#10;Orange,3,1.29,true"
                        className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
                      />
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          onClick={importFromCsv}
                        >
                          Import
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setShowCsvImport(false);
                            setCsvInput('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="border-b">
                        <tr>
                          <th className="pb-2">Item</th>
                          <th className="pb-2">Qty</th>
                          <th className="pb-2">Unit Price</th>
                          <th className="pb-2">Subtotal</th>
                          <th className="pb-2">Taxable</th>
                          <th className="pb-2">HST</th>
                          <th className="pb-2 w-8"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {(editableItems ?? itemsData.line_items).map((item, idx) => {
                          const editableItem = editableItems?.[idx];
                          const lineSubtotal = editableItem
                            ? computeLineSubtotal(editableItem)
                            : item.line_subtotal;
                          const lineTax = editableItem && editableItem.taxable && lineSubtotal != null
                            ? lineSubtotal * HST_RATE
                            : 0;

                          return (
                            <tr key={idx} className="border-b">
                              <td className="py-2">
                                {editableItem ? (
                                  <input
                                    type="text"
                                    value={editableItem.name_raw}
                                    onChange={(e) =>
                                      updateEditableItem(idx, { name_raw: e.target.value })
                                    }
                                    className="w-full rounded-md border border-gray-200 px-2 py-1 text-sm"
                                  />
                                ) : (
                                  item.name_raw
                                )}
                              </td>
                              <td>
                                {editableItem ? (
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={editableItem.quantity ?? ''}
                                    onChange={(e) =>
                                      updateEditableItem(idx, {
                                        quantity: e.target.value === '' ? null : Number(e.target.value)
                                      })
                                    }
                                    className="w-20 rounded-md border border-gray-200 px-2 py-1 text-sm"
                                  />
                                ) : (
                                  item.quantity
                                )}
                              </td>
                              <td>
                                {editableItem ? (
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={editableItem.unit_price ?? ''}
                                    onChange={(e) =>
                                      updateEditableItem(idx, {
                                        unit_price: e.target.value === '' ? null : Number(e.target.value)
                                      })
                                    }
                                    className="w-24 rounded-md border border-gray-200 px-2 py-1 text-sm"
                                  />
                                ) : (
                                  `$${item.unit_price?.toFixed(2) ?? 'N/A'}`
                                )}
                              </td>
                              <td>
                                ${lineSubtotal?.toFixed(2) ?? 'N/A'}
                              </td>
                              <td className="text-center">
                                {editableItem ? (
                                  <input
                                    type="checkbox"
                                    checked={editableItem.taxable}
                                    onChange={(e) =>
                                      updateEditableItem(idx, {
                                        taxable: e.target.checked
                                      })
                                    }
                                    className="h-4 w-4"
                                  />
                                ) : (
                                  '-'
                                )}
                              </td>
                              <td className="text-center">
                                ${lineTax.toFixed(2)}
                              </td>
                              <td className="text-right">
                                {editableItem ? (
                                  <button
                                    type="button"
                                    onClick={() => removeEditableItem(idx)}
                                    className="group relative inline-flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-gray-400 hover:text-red-600 hover:bg-red-50"
                                    aria-label={`Remove ${editableItem.name_raw || 'item'}`}
                                  >
                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                      <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2" />
                                      <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2" />
                                    </svg>
                                    <span className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                                      Remove {editableItem.name_raw || 'item'}
                                    </span>
                                  </button>
                                ) : (
                                  '-'
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {computedTotals && (
                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Items Subtotal:</span>
                        <span className="font-semibold">${computedTotals.itemsSubtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>HST (13%):</span>
                        <span className="font-semibold">${computedTotals.hstTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-base font-semibold pt-2 border-t">
                        <span>Total with Tax:</span>
                        <span>${computedTotals.totalWithTax.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {chargesData && (
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-bold">Charges & Totals</h2>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Items Subtotal:</span>
                    <span className="font-semibold">
                      ${chargesData.subtotal_items?.toFixed(2) ?? 'N/A'}
                    </span>
                  </div>
                  {(chargesData.fees || []).map((fee, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{fee.type}:</span>
                      <span>${fee.amount.toFixed(2)}</span>
                    </div>
                  ))}
                  {(chargesData.discounts || []).map((discount, idx) => (
                    <div key={idx} className="flex justify-between text-green-600">
                      <span>{discount.description}:</span>
                      <span>-${discount.amount.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 border-t">
                    <span>Tax:</span>
                    <span>${chargesData.total_tax_reported?.toFixed(2) ?? 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t-2">
                    <span>Grand Total:</span>
                    <span>${chargesData.grand_total?.toFixed(2) ?? 'N/A'}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Image Enlarge Modal */}
        {enlargedImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setEnlargedImage(null)}
          >
            <div className="relative flex items-center justify-center">
              <button
                onClick={() => setEnlargedImage(null)}
                className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
                aria-label="Close"
              >
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2" />
                  <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2" />
                </svg>
              </button>
              <img
                src={enlargedImage}
                alt="Enlarged preview"
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
