"use client";

import { Fragment } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Folder } from "@/types/folder";
import { FolderIcon, LayoutGrid, Clock, Star, Plus } from "lucide-react";

interface SidebarProps {
  folders: Folder[];
  selectedFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
  onCreateFolder: () => void;
  receiptCounts: Record<string, number>;
}

export function Sidebar({
  folders,
  selectedFolderId,
  onFolderSelect,
  onCreateFolder,
  receiptCounts,
}: SidebarProps) {
  const { user, logout } = useAuth();

  return (
    <aside className="w-[280px] h-screen fixed left-0 top-0 bg-white border-r border-slate-200 flex flex-col z-40">
      {/* Header */}
      <div className="p-6 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <LayoutGrid className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold">Kvitta</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="px-3 py-4 border-b border-slate-200">
        <button
          onClick={() => onFolderSelect(null)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            selectedFolderId === null
              ? "bg-indigo-600 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <LayoutGrid className="w-5 h-5" />
          <span>All Receipts</span>
        </button>
      </nav>

      {/* Folders Section */}
      <div className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-3 px-2">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Folders
          </h3>
          <button
            onClick={onCreateFolder}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1">
          {folders && folders.length > 0 ? (
            <>
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => onFolderSelect(folder.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative ${
                    selectedFolderId === folder.id
                      ? "bg-slate-100"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {selectedFolderId === folder.id && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3/5 bg-indigo-600 rounded-r" />
                  )}
                  <FolderIcon
                    className="w-5 h-5 flex-shrink-0"
                    style={{ color: folder.color }}
                  />
                  <span className="flex-1 text-left truncate">{folder.name}</span>
                  <span className="text-xs text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                    {folder.receipt_count || 0}
                  </span>
                </button>
              ))}
            </>
          ) : (
            <p className="text-sm text-slate-400 text-center py-4">No folders yet</p>
          )}
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate">
              {user?.name || "User"}
            </div>
            <div className="text-xs text-slate-500 truncate">{user?.email}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
