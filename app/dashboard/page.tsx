/**
 * Dashboard Page
 * 
 * Main dashboard view for authenticated users.
 * Protected route - requires login to access.
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogOut, User, Users, Plus, LogOut as LeaveIcon } from 'lucide-react';
import { addGroupMember, createGroup, leaveGroup, listGroups } from '@/lib/api';
import type { Group } from '@/types';

function DashboardContent() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [groups, setGroups] = useState<Group[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsError, setGroupsError] = useState<string | null>(null);

  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [memberInputs, setMemberInputs] = useState<Record<string, string>>({});
  const [memberErrors, setMemberErrors] = useState<Record<string, string>>({});
  const [memberLoading, setMemberLoading] = useState<Record<string, boolean>>({});

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
      setGroupsError(err instanceof Error ? err.message : 'Failed to load groups');
    } finally {
      setGroupsLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setCreateError('Group name is required');
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
      await loadGroups();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create group');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleAddMember = async (groupId: string) => {
    const email = memberInputs[groupId]?.trim();
    if (!email) {
      setMemberErrors((prev) => ({ ...prev, [groupId]: 'Email is required' }));
      return;
    }

    setMemberLoading((prev) => ({ ...prev, [groupId]: true }));
    setMemberErrors((prev) => ({ ...prev, [groupId]: '' }));

    try {
      await addGroupMember(groupId, email);
      setMemberInputs((prev) => ({ ...prev, [groupId]: '' }));
      await loadGroups();
    } catch (err) {
      setMemberErrors((prev) => ({
        ...prev,
        [groupId]: err instanceof Error ? err.message : 'Failed to add member',
      }));
    } finally {
      setMemberLoading((prev) => ({ ...prev, [groupId]: false }));
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    try {
      await leaveGroup(groupId);
      await loadGroups();
    } catch (err) {
      setGroupsError(err instanceof Error ? err.message : 'Failed to leave group');
    }
  };

  const groupCountLabel = useMemo(() => {
    if (groupsLoading) return 'Loading groups...';
    if (groups.length === 0) return 'No groups yet';
    return `${groups.length} group${groups.length === 1 ? '' : 's'}`;
  }, [groupsLoading, groups.length]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold">Kvitta Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <User className="w-4 h-4" />
                <span className="text-muted-foreground">{user?.email}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Welcome, {user?.name || 'User'}!</CardTitle>
            <CardDescription>
              Create a group room to split expenses with your friends and family.
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Group
              </CardTitle>
              <CardDescription>
                Start a new expense room and invite people by email.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="group-name">Group name</Label>
                <Input
                  id="group-name"
                  placeholder="Trip to Dubai"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="group-description">Description</Label>
                <Input
                  id="group-description"
                  placeholder="Flights, hotels, food"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                />
              </div>
              {createError && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {createError}
                </div>
              )}
              <Button
                className="w-full"
                onClick={handleCreateGroup}
                isLoading={createLoading}
              >
                {createLoading ? 'Creating...' : 'Create group'}
              </Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-4 h-4" />
                Your Groups
              </CardTitle>
              <CardDescription>{groupCountLabel}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {groupsError && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {groupsError}
                </div>
              )}

              {groupsLoading && (
                <div className="text-sm text-muted-foreground">Loading groups...</div>
              )}

              {!groupsLoading && groups.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  Create your first group to start splitting expenses.
                </div>
              )}

              {!groupsLoading && groups.length > 0 && (
                <div className="space-y-4">
                  {groups.map((group) => (
                    <div key={group.id} className="border border-border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-base font-semibold text-foreground">{group.name}</h3>
                          {group.description && (
                            <p className="text-sm text-muted-foreground">{group.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {group.members.length} member{group.members.length === 1 ? '' : 's'}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleLeaveGroup(group.id)}
                        >
                          <LeaveIcon className="w-4 h-4 mr-2" />
                          Leave
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2 items-end">
                        <div className="space-y-1">
                          <Label htmlFor={`member-${group.id}`}>Add member by email</Label>
                          <Input
                            id={`member-${group.id}`}
                            placeholder="friend@example.com"
                            value={memberInputs[group.id] || ''}
                            onChange={(e) =>
                              setMemberInputs((prev) => ({
                                ...prev,
                                [group.id]: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <Button
                          onClick={() => handleAddMember(group.id)}
                          isLoading={!!memberLoading[group.id]}
                        >
                          {memberLoading[group.id] ? 'Adding...' : 'Add'}
                        </Button>
                      </div>

                      {memberErrors[group.id] && (
                        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                          {memberErrors[group.id]}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {group.members.map((member) => (
                          <span
                            key={member.email}
                            className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground"
                          >
                            {member.email}{member.role === 'admin' ? ' (admin)' : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
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
