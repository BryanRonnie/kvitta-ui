"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Folder } from "@/types/folder";
import { FolderIcon, LayoutGrid, Plus } from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";

interface DashboardSidebarProps {
    folders: Folder[];
    selectedFolderId: string | null;
    onFolderSelect: (folderId: string | null) => void;
    onCreateFolder: () => void;
    receiptCounts: Record<string, number>;
}

export function DashboardSidebar({
    folders,
    selectedFolderId,
    onFolderSelect,
    onCreateFolder,
    receiptCounts,
}: DashboardSidebarProps) {
    const { user } = useAuth();

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <div className="flex items-center gap-3 px-2 py-2">
                    <div className="w-8 h-8 bg-linear-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <LayoutGrid className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold group-data-[collapsible=icon]:hidden">Kvitta</span>
                </div>
            </SidebarHeader>

            <SidebarContent>
                {/* All Receipts */}
                <SidebarGroup>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                onClick={() => onFolderSelect(null)}
                                isActive={selectedFolderId === null}
                                className="font-medium"
                            >
                                <LayoutGrid className="w-5 h-5" />
                                <span>All Receipts</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>

                {/* Folders */}
                <SidebarGroup>
                    <SidebarGroupLabel className="flex items-center justify-between">
                        <span>Folders</span>
                        <button
                            onClick={onCreateFolder}
                            className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors group-data-[collapsible=icon]:hidden"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {folders && folders.length > 0 ? (
                                <>
                                    {folders.map((folder) => (
                                        <SidebarMenuItem key={folder.id}>
                                            <SidebarMenuButton
                                                onClick={() => onFolderSelect(folder.id)}
                                                isActive={selectedFolderId === folder.id}
                                            >
                                                <FolderIcon
                                                    className="w-5 h-5 shrink-0"
                                                    style={{ color: folder.color }}
                                                />
                                                <span className="flex-1 truncate">{folder.name}</span>
                                                <span className="text-xs text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full group-data-[collapsible=icon]:hidden">
                                                    {receiptCounts[folder.id] || 0}
                                                </span>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                                </>
                            ) : (
                                <p className="text-sm text-slate-400 text-center py-4 px-2 group-data-[collapsible=icon]:hidden">
                                    No folders yet
                                </p>
                            )}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton className="hover:bg-slate-50">
                            <div className="w-8 h-8 bg-linear-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0">
                                {user?.name?.charAt(0).toUpperCase() ||
                                    user?.email?.charAt(0).toUpperCase() ||
                                    "U"}
                            </div>
                            <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                                <div className="font-semibold text-sm truncate">
                                    {user?.name || "User"}
                                </div>
                                <div className="text-xs text-slate-500 truncate">
                                    {user?.email}
                                </div>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
