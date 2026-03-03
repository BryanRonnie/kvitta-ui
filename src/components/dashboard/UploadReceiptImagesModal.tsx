"use client";

import { useState } from "react";
import { X, Upload, Image as ImageIcon, Trash2, Loader, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface UploadReceiptImagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (data: any) => void;
}

interface ImagePreview {
  file: File;
  url: string;
}

export function UploadReceiptImagesModal({
  isOpen,
  onClose,
  onSuccess,
}: UploadReceiptImagesModalProps) {
  const [itemImages, setItemImages] = useState<ImagePreview[]>([]);
  const [chargeImage, setChargeImage] = useState<ImagePreview | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleItemImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPreviews: ImagePreview[] = [];
    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/")) {
        newPreviews.push({
          file,
          url: URL.createObjectURL(file),
        });
      }
    });

    setItemImages((prev) => [...prev, ...newPreviews]);
  };

  const handleChargeImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    // Revoke old URL if exists
    if (chargeImage) {
      URL.revokeObjectURL(chargeImage.url);
    }

    setChargeImage({
      file,
      url: URL.createObjectURL(file),
    });
  };

  const removeItemImage = (index: number) => {
    setItemImages((prev) => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].url);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const removeChargeImage = () => {
    if (chargeImage) {
      URL.revokeObjectURL(chargeImage.url);
      setChargeImage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (itemImages.length === 0) {
      setError("Please upload at least one receipt item image");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();

      // Add all item images
      itemImages.forEach((img) => {
        formData.append("receipt_items", img.file);
      });

      // Add charge image if provided
      if (chargeImage) {
        formData.append("charges_image", chargeImage.file);
      }

      const workerUrl = process.env.NEXT_PUBLIC_WORKER_API_URL;
      if (!workerUrl) {
        throw new Error("Worker API URL not configured");
      }

      const response = await fetch(`${workerUrl}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      setSuccess(true);
      
      if (onSuccess) {
        onSuccess(data);
      }

      // Auto-close after success
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload images");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    // Cleanup object URLs
    itemImages.forEach((img) => URL.revokeObjectURL(img.url));
    if (chargeImage) {
      URL.revokeObjectURL(chargeImage.url);
    }

    setItemImages([]);
    setChargeImage(null);
    setError("");
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold">Extract Receipt Data</h2>
            <p className="text-sm text-slate-500 mt-1">
              Upload receipt images to automatically extract items and charges
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
            disabled={isUploading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Receipt Items Upload */}
          <div className="space-y-3">
            <Label htmlFor="itemImages" className="text-base font-semibold">
              Receipt Item Images *
            </Label>
            <p className="text-sm text-slate-500">
              Upload images showing the itemized list on your receipt
            </p>

            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 hover:border-indigo-400 transition-colors">
              <label
                htmlFor="itemImages"
                className="flex flex-col items-center justify-center cursor-pointer"
              >
                <Upload className="w-10 h-10 text-slate-400 mb-3" />
                <span className="text-sm font-medium text-slate-700">
                  Click to upload receipt item images
                </span>
                <span className="text-xs text-slate-500 mt-1">
                  PNG, JPG up to 10MB each
                </span>
              </label>
              <input
                id="itemImages"
                type="file"
                accept="image/*"
                multiple
                onChange={handleItemImagesChange}
                className="hidden"
                disabled={isUploading}
              />
            </div>

            {/* Item Images Preview */}
            {itemImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                {itemImages.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={img.url}
                      alt={`Item ${idx + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeItemImage(idx)}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={isUploading}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                      Item {idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Charges Image Upload */}
          <div className="space-y-3">
            <Label htmlFor="chargeImage" className="text-base font-semibold">
              Charges/Totals Image (Optional)
            </Label>
            <p className="text-sm text-slate-500">
              Upload image showing tax, tip, and total amounts
            </p>

            {!chargeImage ? (
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 hover:border-indigo-400 transition-colors">
                <label
                  htmlFor="chargeImage"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <ImageIcon className="w-10 h-10 text-slate-400 mb-3" />
                  <span className="text-sm font-medium text-slate-700">
                    Click to upload charges image
                  </span>
                  <span className="text-xs text-slate-500 mt-1">
                    PNG, JPG up to 10MB
                  </span>
                </label>
                <input
                  id="chargeImage"
                  type="file"
                  accept="image/*"
                  onChange={handleChargeImageChange}
                  className="hidden"
                  disabled={isUploading}
                />
              </div>
            ) : (
              <div className="relative group">
                <img
                  src={chargeImage.url}
                  alt="Charges"
                  className="w-full h-48 object-cover rounded-lg border border-slate-200"
                />
                <button
                  type="button"
                  onClick={removeChargeImage}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={isUploading}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                  Charges Image
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Successfully extracted receipt data!</span>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUploading || itemImages.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isUploading ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Extract Data
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
