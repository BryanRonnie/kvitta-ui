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

import { useState, useCallback } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { Button } from '@/components/Button';
import { Card, CardHeader, CardContent } from '@/components/Card';
import { extractReceiptText } from '@/lib/api';
import { OcrResponse, ItemsAnalysis, ChargesAnalysis } from '@/types';

export default function UploadPage() {
  // State management using React hooks
  const [itemsImages, setItemsImages] = useState<File[]>([]);
  const [chargesImage, setChargesImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OcrResponse | null>(null);

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
      
      // Append multiple items images
      itemsImages.forEach(file => {
        formData.append('items_images', file);
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
   */
  const parseItemsAnalysis = useCallback((): ItemsAnalysis | null => {
    if (!result?.items_analysis?.response) return null;
    
    try {
      return JSON.parse(result.items_analysis.response);
    } catch {
      return null;
    }
  }, [result]);

  const parseChargesAnalysis = useCallback((): ChargesAnalysis | null => {
    if (!result?.charges_analysis?.response) return null;
    
    try {
      return JSON.parse(result.charges_analysis.response);
    } catch {
      return null;
    }
  }, [result]);

  const itemsData = parseItemsAnalysis();
  const chargesData = parseChargesAnalysis();

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
                <h3 className="font-semibold mb-2">Raw OCR Text</h3>
                <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
                  {result.full_text}
                </pre>
              </CardContent>
            </Card>

            {itemsData && (
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-bold">Parsed Items</h2>
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
                        </tr>
                      </thead>
                      <tbody>
                        {itemsData.line_items.map((item, idx) => (
                          <tr key={idx} className="border-b">
                            <td className="py-2">{item.name_raw}</td>
                            <td>{item.quantity}</td>
                            <td>${item.unit_price?.toFixed(2) ?? 'N/A'}</td>
                            <td>${item.line_subtotal?.toFixed(2) ?? 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
                  {chargesData.fees.map((fee, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{fee.type}:</span>
                      <span>${fee.amount.toFixed(2)}</span>
                    </div>
                  ))}
                  {chargesData.discounts.map((discount, idx) => (
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
      </div>
    </div>
  );
}
