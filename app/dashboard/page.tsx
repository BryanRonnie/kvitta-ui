/**
 * Dashboard Page
 * 
 * Main dashboard view for authenticated users with receipt management and folder organization.
 * Protected route - requires login to access.
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
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
  addGroupMember, 
  createGroup, 
  deleteGroup, 
  leaveGroup, 
  listGroups, 
  updateGroupMemberRole,
  createFolder,
  listFolders,
  deleteFolder,
  updateFolder,
  moveReceipt 
} from '@/lib/api';
import type { Group, Folder as FolderType } from '@/types';
import './dashboard.css';

function DashboardContent() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [groups, setGroups] = useState<Group[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsError, setGroupsError] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);

  const [folders, setFolders] = useState<FolderType[]>([]);
  const [foldersLoading, setFoldersLoading] = useState(false);

  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [folderName, setFolderName] = useState('');
  const [folderColor, setFolderColor] = useState('#6366F1');
  const [createFolderLoading, setCreateFolderLoading] = useState(false);
  const [createFolderError, setCreateFolderError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [draggedReceiptId, setDraggedReceiptId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

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

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setCreateError('Receipt name is required');
      return;
    }

    setCreateLoading(true);
    setCreateError(null);

    try {
      await createGroup({
        name: groupName.trim(),
        description: groupDescription.trim() || undefined,
      });
      setGroupName('');
      setGroupDescription('');
      setShowCreateModal(false);
      await loadGroups();
      await loadFolders();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create receipt');
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
      await createFolder({
        name: folderName.trim(),
        color: folderColor,
      });
      setFolderName('');
      setFolderColor('#6366F1');
      setShowFolderModal(false);
      await loadFolders();
    } catch (err) {
      setCreateFolderError(err instanceof Error ? err.message : 'Failed to create folder');
    } finally {
      setCreateFolderLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this receipt? This action cannot be undone.')) return;
    try {
      await deleteGroup(groupId);
      await loadGroups();
      await loadFolders();
    } catch (err) {
      setGroupsError(err instanceof Error ? err.message : 'Failed to delete receipt');
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm('Are you sure you want to delete this folder? Receipts will not be deleted.')) return;
    try {
      await deleteFolder(folderId);
      if (selectedFolderId === folderId) {
        setSelectedFolderId(null);
      }
      await loadFolders();
      await loadGroups();
    } catch (err) {
      setGroupsError(err instanceof Error ? err.message : 'Failed to delete folder');
    }
  };

  const handleMakeAdmin =async (groupId: string, memberEmail: string) => {
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
    setDraggedReceiptId(receiptId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedReceiptId(null);
    setDragOverFolderId(null);
  };

  const handleDragOver = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverFolderId(folderId);
  };

  const handleDragLeave = () => {
    setDragOverFolderId(null);
  };

  const handleDrop = async (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    setDragOverFolderId(null);

    if (!draggedReceiptId) return;

    try {
      await moveReceipt(draggedReceiptId, folderId);
      await loadGroups();
      await loadFolders();
    } catch (err) {
      setGroupsError(err instanceof Error ? err.message : 'Failed to move receipt');
    }

    setDraggedReceiptId(null);
  };

  const filteredGroups = useMemo(() => {
    let filtered = groups;

    // Filter by folder
    if (selectedFolderId) {
      filtered = filtered.filter(g => g.folder_id === selectedFolderId);
    } else if (selectedFolderId === 'all') {
      filtered = groups;
    } else if (selectedFolderId === null) {
      // Show receipts not in any folder
      filtered = filtered.filter(g => !g.folder_id);
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

  const getCurrentViewTitle = () => {
    if (selectedFolderId === 'all') return 'All Receipts';
    if (selectedFolderId === null) return 'Uncategorized';
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
            onClick={() => setSelectedFolderId('all')}
          >
            <Layers className="nav-icon" />
            <span>All Receipts</span>
          </div>
          <div 
            className={`nav-item ${selectedFolderId === null ? 'active' : ''}`}
            onClick={() => setSelectedFolderId(null)}
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
                onClick={() => setSelectedFolderId(folder.id)}
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
                <circle cx="11" cy="11" r="8" strokeWidth="2"/>
                <path d="m21 21-4.35-4.35" strokeWidth="2"/>
              </svg>
              <input
                type="text"
                placeholder="Search receipts..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Button onClick={() => setShowCreateModal(true)}>
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
              <div className="add-group-card" onClick={() => setShowCreateModal(true)}>
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
                      <div className="group-title">{group.name}</div>
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
                    <button className="action-btn" title="View Receipt">
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
              <div className="add-group-card" onClick={() => setShowCreateModal(true)}>
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
                      className={`w-10 h-10 rounded-md transition-all ${
                        folderColor === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
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
