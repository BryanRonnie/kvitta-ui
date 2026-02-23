"use client";

import { Plus } from "lucide-react";

interface AddReceiptCardProps {
  onAdd: () => void;
}

export function AddReceiptCard({ onAdd }: AddReceiptCardProps) {
  return (
    <div className="min-h-[300px]">
      <button
        onClick={onAdd}
        className="w-full h-full min-h-[300px] flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50/50 hover:bg-indigo-50/50 hover:border-indigo-400 text-slate-400 hover:text-indigo-600 transition-all duration-300 hover:scale-105"
      >
        <Plus className="w-12 h-12 stroke-2" />
        <span className="text-lg font-semibold">Add Receipt</span>
      </button>
    </div>
  );
}
