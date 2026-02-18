import type { GroupMember } from '@/types';

export const mockGroupMembers: GroupMember[] = [
    {
        email: 'alice@test.com',
        role: 'admin',
        joined_at: '2024-01-01T00:00:00Z',
    },
    {
        email: 'bob@test.com',
        role: 'member',
        joined_at: '2024-01-02T00:00:00Z',
    },
    {
        email: 'charlie@test.com',
        role: 'member',
        joined_at: '2024-01-03T00:00:00Z',
    },
];
