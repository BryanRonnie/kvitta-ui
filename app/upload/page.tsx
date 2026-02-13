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
import { FileUpload } from '@/components/FileUpload';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { extractReceiptText } from '@/lib/api';
import { OcrResponse, ItemsAnalysis, ChargesAnalysis } from '@/types';

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
  const [itemsImages, setItemsImages] = useState<File[]>([]);
  const [chargesImage, setChargesImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OcrResponse | null>(null);
  const [itemsPreviewUrls, setItemsPreviewUrls] = useState<string[]>([]);
  const [chargesPreviewUrl, setChargesPreviewUrl] = useState<string | null>(null);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const [editableItems, setEditableItems] = useState<EditableLineItem[] | null>(null);

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
    // Validation
    if (itemsImages.length === 0 || !chargesImage) {
      setError('Please upload both items and charges images');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Build FormData for multipart/form-data request
      const formData = new FormData();
      
      // Append multiple receipt items images (backend expects "receipt_items")
      itemsImages.forEach(file => {
        formData.append('receipt_items', file);
      });
      
      // Append single charges image
      formData.append('charges_image', chargesImage);

      // Call API
      const response = await extractReceiptText(formData);
      setResult(response);
      
      // Success! You could navigate to a results page here
      // router.push('/results');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsLoading(false);
    }
  }, [itemsImages, chargesImage]);

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

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Upload Receipt
        </h1>

        {/* Upload Section */}
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
                          <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2"/>
                          <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2"/>
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
                      <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2"/>
                      <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2"/>
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

        {/* Results Section */}
        {result && (
          <div className="mt-8 space-y-6">
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
                    <h3 className="font-semibold mt-4 mb-2">Items Analysis (Raw JSON)</h3>
                    <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
                      {typeof result.items_analysis === 'string'
                        ? result.items_analysis
                        : JSON.stringify(result.items_analysis, null, 2)}
                    </pre>
                  </>
                )}
                {result.charges_analysis && (
                  <>
                    <h3 className="font-semibold mt-4 mb-2">Charges Analysis (Raw JSON)</h3>
                    <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
                      {typeof result.charges_analysis === 'string'
                        ? result.charges_analysis
                        : JSON.stringify(result.charges_analysis, null, 2)}
                    </pre>
                  </>
                )}
              </CardContent>
            </Card>

            {itemsData && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Parsed Items</h2>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={addEditableItem}
                    >
                      Add Item
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  
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
                                    <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2"/>
                                    <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2"/>
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
                  <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2"/>
                  <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2"/>
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
