"use client";

import { Receipt } from "@/types/receipt";
import { Eye, Edit, Trash2 } from "lucide-react";
import { useState } from "react";

interface ReceiptCardProps {
  receipt: Receipt;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ReceiptCard({ receipt, onView, onEdit, onDelete }: ReceiptCardProps) {
  const [rotation] = useState((Math.random() - 0.5) * 4); // -2 to 2 degrees
  const [isHovered, setIsHovered] = useState(false);

  const formattedDate = new Date(receipt.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const itemCount = receipt.items?.length || 0;
  const displayItems = receipt.items?.slice(0, 5) || [];
  const hasMore = itemCount > 5;

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "finalized":
        return "bg-green-100 text-green-700";
      case "draft":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div
      className="perspective-1000 relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="transition-all duration-300 ease-out"
        style={{
          transform: isHovered
            ? "translateY(-8px) scale(1.02) rotate(0deg)"
            : `rotate(${rotation}deg)`,
        }}
      >
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow relative min-h-70 flex flex-col">
          {/* Paper effect - perforations at top */}
          <div className="absolute top-0 left-0 right-0 h-2 flex justify-around">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="w-0.5 h-2 bg-slate-200" />
            ))}
          </div>

          {/* Header */}
          <div className="flex justify-between items-start mb-5 mt-2">
            <h3 className="font-bold text-lg text-slate-900 truncate flex-1">
              {receipt.title}
            </h3>
            <span className="text-sm text-slate-500 ml-2">{formattedDate}</span>
          </div>

          {/* Items */}
          <div className="flex-1 mb-4 pb-4 border-b border-dashed border-slate-300 max-h-[180px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
            {displayItems.length > 0 ? (
              <div className="space-y-2.5">
                {displayItems.map((item: any, idx: number) => (
                  <div key={`${item.name}-${idx}`} className="flex justify-between text-sm">
                    <span className="text-slate-700 truncate flex-1">
                      {item.name}
                    </span>
                    <span className="text-slate-600 font-medium ml-2">
                      {formatCurrency(item.unit_price_cents * item.quantity)}
                    </span>
                  </div>
                ))}
                {hasMore && (
                  <div className="flex items-center justify-center mt-2">
                    <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                      +{itemCount - 5} more items
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-slate-400 italic">No items yet</div>
            )}
          </div>

          {/* Total */}
          <div className="mb-5 p-3 bg-slate-50 rounded-lg">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Total</span>
                {itemCount > 0 && (
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200 font-semibold">
                    {itemCount} {itemCount === 1 ? "item" : "items"}
                  </span>
                )}
              </div>
              <span className="text-xl font-bold text-slate-900">
                {formatCurrency(receipt.total_cents)}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              {receipt.participants?.slice(0, 3).map((p, idx) => (
                <div
                  key={p.user_id}
                  className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold border-2 border-white"
                  style={{ marginLeft: idx > 0 ? "-8px" : "0" }}
                >
                  {p.user_id.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
            <span
              className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(
                receipt.status
              )}`}
            >
              {receipt.status === "finalized" ? "Finalized" : "Draft"}
            </span>
          </div>

          {/* Actions - Show on hover */}
          <div
            className={`flex justify-center gap-2 mt-4 transition-all duration-300 ${
              isHovered ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
            }`}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView(receipt.id);
              }}
              className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 rounded-lg hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(receipt.id);
              }}
              className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 rounded-lg hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(receipt.id);
              }}
              className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
