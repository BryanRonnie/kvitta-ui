/**
 * Dashboard Page
 * 
 * Main dashboard view for authenticated users with receipt management and folder organization.
 * Protected route - requires login to access.
 * 
 * URL Structure:
 * - /dashboard                    → All receipts
 * - /dashboard?folder=uncategorized → Uncategorized receipts
 * - /dashboard?folder=[id]        → Specific folder
 * - /dashboard?search=term        → Search filter
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  LogOut,
  Users,
  Plus,
  Trash2,
  UserPlus,
  Layers,
  Clock,
  Star,
  X,
  Eye,
  Settings,
  Folder,
  Edit2
} from 'lucide-react';
import {
  createGroup,
  deleteGroup,
  leaveGroup,
  listGroups,
  updateGroupMemberRole,
  createFolder,
  listFolders,
  deleteFolder,
  updateFolder,
  moveReceipt,
  getReceipt
} from '@/lib/api';
import type { Group, Folder as FolderType } from '@/types';
import './dashboard.css';

function DashboardContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get folder and search parameters from URL
  const folderParam = searchParams.get('folder') || 'all';
  const searchParam = searchParams.get('search') || '';

  const [groups, setGroups] = useState<Group[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsError, setGroupsError] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string>(folderParam);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);

  const [folders, setFolders] = useState<FolderType[]>([]);
  const [foldersLoading, setFoldersLoading] = useState(false);

  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [receiptFolderId, setReceiptFolderId] = useState<string | null>(null);

  const [folderName, setFolderName] = useState('');
  const [folderColor, setFolderColor] = useState('#6366F1');
  const [createFolderLoading, setCreateFolderLoading] = useState(false);
  const [createFolderError, setCreateFolderError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [draggedReceiptId, setDraggedReceiptId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [receiptStatuses, setReceiptStatuses] = useState<Record<string, { label: string; color: string }>>({});

  const folderColors = [
    '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#6366F1',
    '#EC4899', '#14B8A6', '#F97316', '#EAB308'
  ];

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const loadGroups = async () => {
    setGroupsLoading(true);
    setGroupsError(null);

    try {
      const data = await listGroups();
      setGroups(data);
    } catch (err) {
      setGroupsError(err instanceof Error ? err.message : 'Failed to load receipts');
    } finally {
      setGroupsLoading(false);
    }
  };

  const loadFolders = async () => {
    setFoldersLoading(true);
    try {
      const data = await listFolders();
      setFolders(data);
    } catch (err) {
      console.error('Failed to load folders:', err);
    } finally {
      setFoldersLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
    loadFolders();
  }, []);

  // Sync state with URL parameters when they change
  useEffect(() => {
    setSelectedFolderId(folderParam);
    setSearchTerm(searchParam);
  }, [folderParam, searchParam]);

  // Helper functions to navigate and update URL
  const navigateToFolder = (folderId: string | null) => {
    const params = new URLSearchParams();
    if (folderId === 'all' || !folderId) {
      if (folderId === 'all') params.set('folder', 'all');
      else params.set('folder', 'uncategorized');
    } else {
      params.set('folder', folderId);
    }
    if (searchTerm) params.set('search', searchTerm);
    router.push(`/dashboard?${params.toString()}`);
  };

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    const params = new URLSearchParams();
    params.set('folder', selectedFolderId);
    if (term) params.set('search', term);
    router.push(`/dashboard?${params.toString()}`);
  };

  // Initialize receipt folder when opening the modal
  const handleOpenCreateModal = () => {
    // Pre-select current folder if in a specific folder (not 'all' or 'uncategorized')
    if (selectedFolderId && selectedFolderId !== 'all' && selectedFolderId !== 'uncategorized') {
      setReceiptFolderId(selectedFolderId);
    } else {
      setReceiptFolderId(null); // Default to uncategorized
    }
    setShowCreateModal(true);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setCreateError('Receipt name is required');
      return;
    }

    setCreateLoading(true);
    setCreateError(null);

    try {
      const payload: any = {
        name: groupName.trim(),
        description: groupDescription.trim() || undefined,
      };
      // Only include folder_id if a folder is selected (not uncategorized)
      if (receiptFolderId) {
        payload.folder_id = receiptFolderId;
      }
      const createdReceipt = await createGroup(payload);
      setGroupName('');
      setGroupDescription('');
      setReceiptFolderId(null);
      setShowCreateModal(false);
      await loadGroups();
      await loadFolders();

      // Show success toast with folder info
      if (receiptFolderId) {
        const folder = folders.find(f => f.id === receiptFolderId);
        const folderName = folder?.name || 'folder';
        toast.success(`Receipt created in ${folderName}`);
      } else {
        toast.success('Receipt created');
      }

      const params = new URLSearchParams();
      params.set('groupId', createdReceipt.id);
      router.push(`/upload?${params.toString()}`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create receipt';
      setCreateError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!folderName.trim()) {
      setCreateFolderError('Folder name is required');
      return;
    }

    setCreateFolderLoading(true);
    setCreateFolderError(null);

    try {
      const folderNameTrimmed = folderName.trim();
      await createFolder({
        name: folderNameTrimmed,
        color: folderColor,
      });
      setFolderName('');
      setFolderColor('#6366F1');
      setShowFolderModal(false);
      await loadFolders();
      toast.success(`Folder "${folderNameTrimmed}" created`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create folder';
      setCreateFolderError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setCreateFolderLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this receipt? This action cannot be undone.')) return;
    try {
      const receipt = groups.find(g => g.id === groupId);
      await deleteGroup(groupId);
      await loadGroups();
      await loadFolders();
      toast.success(`Receipt "${receipt?.name}" deleted`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete receipt';
      setGroupsError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm('Are you sure you want to delete this folder? Receipts will not be deleted.')) return;
    try {
      const folder = folders.find(f => f.id === folderId);
      await deleteFolder(folderId);
      if (selectedFolderId === folderId) {
        navigateToFolder('all');
      }
      await loadFolders();
      await loadGroups();
      toast.success(`Folder "${folder?.name}" deleted`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete folder';
      setGroupsError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleMakeAdmin = async (groupId: string, memberEmail: string) => {
    try {
      await updateGroupMemberRole(groupId, memberEmail, 'admin');
      await loadGroups();
    } catch (err) {
      setGroupsError(err instanceof Error ? err.message : 'Failed to update member role');
    }
  };

  const isUserAdmin = (group: Group) => {
    const userMember = group.members.find(m => m.email === user?.email);
    return userMember?.role === 'admin';
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, receiptId: string) => {
    const receipt = groups.find(g => g.id === receiptId);
    // Store both receipt ID and its current folder
    setDraggedReceiptId(receiptId);
    e.dataTransfer?.setData('receiptFolderId', receipt?.folder_id || '');
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedReceiptId(null);
    setDragOverFolderId(null);
  };

  const handleDragOver = (e: React.DragEvent, folderId: string | null) => {
    if (!draggedReceiptId) return;

    // Get the original folder of the dragged receipt
    const draggedReceipt = groups.find(g => g.id === draggedReceiptId);
    const sourceFolder = draggedReceipt?.folder_id || null;

    // Only allow drop if target is different from source
    const isDifferentFolder = sourceFolder !== folderId;

    if (isDifferentFolder) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDragOverFolderId(folderId);
    } else {
      e.dataTransfer.dropEffect = 'none';
    }
  };

  const handleDragLeave = () => {
    setDragOverFolderId(null);
  };

  const handleDrop = async (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    setDragOverFolderId(null);

    if (!draggedReceiptId) return;

    // Validate that we're moving to a different folder
    const draggedReceipt = groups.find(g => g.id === draggedReceiptId);
    const sourceFolder = draggedReceipt?.folder_id || null;

    if (sourceFolder === folderId) {
      // Can't drop in the same folder
      return;
    }

    try {
      await moveReceipt(draggedReceiptId, folderId);
      await loadGroups();
      await loadFolders();

      // Show success toast with folder name
      if (folderId) {
        const targetFolder = folders.find(f => f.id === folderId);
        const folderName = targetFolder?.name || 'folder';
        toast.success(`Moved "${draggedReceipt?.name}" to ${folderName}`);
      } else {
        toast.success(`Moved "${draggedReceipt?.name}" to Uncategorized`);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to move receipt';
      setGroupsError(errorMsg);
      toast.error(errorMsg);
    }

    setDraggedReceiptId(null);
  };

  const filteredGroups = useMemo(() => {
    let filtered = groups;

    // Filter by folder
    if (selectedFolderId === 'all') {
      // Show all receipts
      filtered = groups;
    } else if (selectedFolderId === 'uncategorized') {
      // Show receipts not in any folder
      filtered = filtered.filter(g => !g.folder_id);
    } else if (selectedFolderId) {
      // Show receipts in the selected folder
      filtered = filtered.filter(g => g.folder_id === selectedFolderId);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(group =>
        group.name.toLowerCase().includes(term) ||
        group.description?.toLowerCase().includes(term) ||
        group.members.some(m => m.email.toLowerCase().includes(term))
      );
    }

    return filtered;
  }, [groups, selectedFolderId, searchTerm]);

  const receiptCountLabel = useMemo(() => {
    if (groupsLoading) return 'Loading...';
    const count = filteredGroups.length;
    return `${count} receipt${count === 1 ? '' : 's'}`;
  }, [groupsLoading, filteredGroups.length]);

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getRandomRotation = (index: number) => {
    const rotations = [-2, -1, 0, 1, 1.5, 2];
    return rotations[index % rotations.length];
  };

  const getReceiptStatus = (group: Group): { label: string; color: string } => {
    // Check if group has any receipts
    if (!group.receipt_ids || group.receipt_ids.length === 0) {
      return { label: 'Empty', color: 'bg-gray-400' };
    }
    
    // Check if we have cached status for this group
    if (receiptStatuses[group.id]) {
      return receiptStatuses[group.id];
    }
    
    // Return loading state while fetching
    return { label: 'Loading', color: 'bg-gray-300' };
  };

  // Load receipt statuses for all groups with receipts
  useEffect(() => {
    const loadReceiptStatuses = async () => {
      const statusMap: Record<string, { label: string; color: string }> = {};
      let hasProcessing = false;
      
      for (const group of groups) {
        if (group.receipt_ids && group.receipt_ids.length > 0) {
          try {
            // Get the latest receipt for this group
            const latestReceiptId = group.receipt_ids[group.receipt_ids.length - 1];
            const receipt = await getReceipt(latestReceiptId);
            
            // Determine status based on receipt data
            if (receipt.split_details && Object.keys(receipt.split_details).length > 0) {
              statusMap[group.id] = { label: 'Split', color: 'bg-purple-500' };
            } else if (receipt.items_analysis && receipt.charges_analysis) {
              statusMap[group.id] = { label: 'Parsed', color: 'bg-blue-500' };
            } else if (receipt.items_analysis) {
              statusMap[group.id] = { label: 'Parsed', color: 'bg-blue-500' };
            } else if (receipt.status === 'pending' || receipt.status === 'processing') {
              statusMap[group.id] = { label: 'Processing', color: 'bg-yellow-500' };
              hasProcessing = true;
            } else {
              statusMap[group.id] = { label: 'Uploaded', color: 'bg-green-500' };
              hasProcessing = true;
            }
          } catch (error) {
            console.error(`Failed to load receipt status for group ${group.id}:`, error);
            statusMap[group.id] = { label: 'Unknown', color: 'bg-gray-400' };
          }
        }
      }
      
      setReceiptStatuses(statusMap);
      return hasProcessing;
    };

    if (groups.length > 0) {
      loadReceiptStatuses();
      
      // Poll every 10 seconds to refresh statuses for processing receipts
      const interval = setInterval(async () => {
        const shouldContinue = await loadReceiptStatuses();
        if (!shouldContinue) {
          clearInterval(interval);
        }
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [groups]);

  const getCurrentViewTitle = () => {
    if (selectedFolderId === 'all') return 'All Receipts';
    if (selectedFolderId === 'uncategorized') return 'Uncategorized';
    const folder = folders.find(f => f.id === selectedFolderId);
    return folder?.name || 'All Receipts';
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <Layers className="logo-icon" />
            <span className="logo-text">Kvitta</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div
            className={`nav-item ${selectedFolderId === 'all' ? 'active' : ''}`}
            onClick={() => navigateToFolder('all')}
          >
            <Layers className="nav-icon" />
            <span>All Receipts</span>
          </div>
          <div
            className={`nav-item ${selectedFolderId === 'uncategorized' ? 'active' : ''}`}
            onClick={() => navigateToFolder(null)}
            onDragOver={(e) => handleDragOver(e, null)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, null)}
          >
            <Clock className="nav-icon" />
            <span>Uncategorized</span>
          </div>

        </nav>

        <div className="sidebar-section">
          <div className="section-header">
            <h3 className="section-title">Folders</h3>
            <button
              className="btn-icon-small"
              onClick={() => setShowFolderModal(true)}
              title="Create Folder"
            >
              <Plus />
            </button>
          </div>

          <div className="group-list">
            {folders.map((folder) => (
              <div
                key={folder.id}
                className={`group-item ${selectedFolderId === folder.id ? 'active' : ''} ${dragOverFolderId === folder.id ? 'drag-over' : ''}`}
                onClick={() => navigateToFolder(folder.id)}
                onDragOver={(e) => handleDragOver(e, folder.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, folder.id)}
              >
                <Folder className="group-icon" style={{ color: folder.color }} />
                <span className="group-name">{folder.name}</span>
                <span className="group-count">{folder.receipt_count}</span>
                {selectedFolderId === folder.id && (
                  <button
                    className="btn-icon-small ml-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFolder(folder.id);
                    }}
                    title="Delete Folder"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
            {folders.length === 0 && !foldersLoading && (
              <div className="text-sm text-muted-foreground px-3 py-2">
                No folders yet
              </div>
            )}
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="user-profile" onClick={handleLogout} title="Logout">
            <div className="avatar">
              <span>{getInitials(user?.email || 'U')}</span>
            </div>
            <div className="user-info">
              <div className="user-name">{user?.name || 'User'}</div>
              <div className="user-email">{user?.email}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-left">
            <h1 className="page-title">{getCurrentViewTitle()}</h1>
            <span className="item-count">{receiptCountLabel}</span>
          </div>

          <div className="header-actions">
            <div className="search-bar">
              <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="11" cy="11" r="8" strokeWidth="2" />
                <path d="m21 21-4.35-4.35" strokeWidth="2" />
              </svg>
              <input
                type="text"
                placeholder="Search receipts..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>

            <Button onClick={handleOpenCreateModal}>
              <Plus className="w-4 h-4 mr-2" />
              New Receipt
            </Button>
          </div>
        </header>

        {/* Receipts Grid */}
        <div className="groups-container">
          {groupsError && (
            <div className="col-span-full text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {groupsError}
            </div>
          )}

          {groupsLoading && (
            <div className="col-span-full text-sm text-muted-foreground">Loading receipts...</div>
          )}

          {!groupsLoading && filteredGroups.length === 0 && !searchTerm && (
            <div className="group-stack add-new">
              <div className="add-group-card" onClick={handleOpenCreateModal}>
                <Plus className="add-icon" />
                <span>Create Receipt</span>
              </div>
            </div>
          )}

          {!groupsLoading && filteredGroups.length === 0 && searchTerm && (
            <div className="col-span-full text-sm text-muted-foreground">
              No receipts found matching "{searchTerm}"
            </div>
          )}

          {!groupsLoading &&
            filteredGroups.map((group, index) => (
              <div key={group.id} className="group-stack">
                <div
                  className="group-card"
                  draggable
                  onDragStart={(e) => handleDragStart(e, group.id)}
                  onDragEnd={handleDragEnd}
                  style={{ '--rotation': `${getRandomRotation(index)}deg` } as React.CSSProperties}
                >
                  <div className="group-paper">
                    <div className="group-top">
                      <div className="flex items-center gap-2">
                        <div className="group-title">{group.name}</div>
                        <span className={`px-2 py-0.5 text-xs font-medium text-white rounded-full ${getReceiptStatus(group).color}`}>
                          {getReceiptStatus(group).label}
                        </span>
                      </div>
                      <div className="group-date">{formatDate(group.created_at)}</div>
                    </div>

                    {group.description && (
                      <div className="group-description">{group.description}</div>
                    )}

                    <div className="group-members">
                      {group.members.map((member) => (
                        <div key={member.email} className="member-item">
                          <span className="member-email">{member.email}</span>
                          {member.role === 'admin' && (
                            <span className="admin-badge">Admin</span>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="group-footer">
                      <div className="avatar-group">
                        {group.members.slice(0, 3).map((member) => (
                          <div key={member.email} className="avatar-small">
                            <span>{getInitials(member.email)}</span>
                          </div>
                        ))}
                        {group.members.length > 3 && (
                          <div className="avatar-small">
                            <span>+{group.members.length - 3}</span>
                          </div>
                        )}
                      </div>
                      {group.folder_id && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Folder className="w-3 h-3" style={{ color: folders.find(f => f.id === group.folder_id)?.color }} />
                          <span>{folders.find(f => f.id === group.folder_id)?.name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="group-actions">
                    <button
                      className="action-btn"
                      title="View Receipt"
                      onClick={() => {
                        // usage: if receipt exists, go to receiptId, else go to upload with groupId
                        const lastReceiptId = group.receipt_ids && group.receipt_ids.length > 0
                          ? group.receipt_ids[group.receipt_ids.length - 1]
                          : null;

                        if (lastReceiptId) {
                          router.push(`/upload?receiptId=${lastReceiptId}`);
                        } else {
                          router.push(`/upload?groupId=${group.id}`);
                        }
                      }}
                    >
                      <Eye />
                    </button>
                    <button className="action-btn" title="Settings">
                      <Settings />
                    </button>
                    {isUserAdmin(group) && (
                      <button
                        className="action-btn delete"
                        onClick={() => handleDeleteGroup(group.id)}
                        title="Delete Receipt"
                      >
                        <Trash2 />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

          {!groupsLoading && filteredGroups.length > 0 && (
            <div className="group-stack add-new">
              <div className="add-group-card" onClick={handleOpenCreateModal}>
                <Plus className="add-icon" />
                <span>Create Receipt</span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Create Receipt Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setShowCreateModal(false)}>
          <div
            className="bg-card border border-border rounded-2xl w-[90%] max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-xl font-bold">Create New Receipt</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-accent transition-colors"
                aria-label="Close modal"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="modal-group-name">Receipt Name</Label>
                <Input
                  id="modal-group-name"
                  placeholder="e.g., Dinner at Olive Garden"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="modal-group-description">Description (optional)</Label>
                <Input
                  id="modal-group-description"
                  placeholder="e.g., Team lunch"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="modal-folder-select">Folder (optional)</Label>
                <select
                  id="modal-folder-select"
                  value={receiptFolderId || ''}
                  onChange={(e) => setReceiptFolderId(e.target.value || null)}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Uncategorized</option>
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
              </div>

              {createError && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {createError}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateGroup}
                isLoading={createLoading}
              >
                {createLoading ? 'Creating...' : 'Create Receipt'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Folder Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setShowFolderModal(false)}>
          <div
            className="bg-card border border-border rounded-2xl w-[90%] max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-xl font-bold">Create New Folder</h2>
              <button
                onClick={() => setShowFolderModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-accent transition-colors"
                aria-label="Close modal"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="modal-folder-name">Folder Name</Label>
                <Input
                  id="modal-folder-name"
                  placeholder="e.g., Work Lunches"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label>Folder Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {folderColors.map((color, index) => (
                    <button
                      key={`${color}-${index}`}
                      className={`w-10 h-10 rounded-md transition-all ${folderColor === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
                        }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFolderColor(color)}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              {createFolderError && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {createFolderError}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setShowFolderModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateFolder}
                isLoading={createFolderLoading}
              >
                {createFolderLoading ? 'Creating...' : 'Create Folder'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
