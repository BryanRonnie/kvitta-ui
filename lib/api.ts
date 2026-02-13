import type { Group, GroupCreateInput, Folder, FolderCreateInput, Receipt, ReceiptCreateInput } from '@/types';

/**
 * API Client for Kvitta Backend
 * 
 * This file centralizes all API calls to the Kvitta backend.
 * Benefits:
 * - Single source of truth for API endpoints
 * - Easy to mock for testing
 * - Type-safe with TypeScript
 * - Reusable across components
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Generic fetch wrapper with error handling
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        detail: `HTTP ${response.status}` 
      }));
      throw new Error(error.detail || `Request failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

function getStoredToken() {
  if (typeof window === 'undefined') return null;
  const rememberMe = localStorage.getItem('rememberMe') === 'true';
  const storedToken = localStorage.getItem('token');
  const sessionToken = sessionStorage.getItem('token');
  return rememberMe ? storedToken : sessionToken;
}

async function apiAuthRequest<T>(endpoint: string, options: RequestInit = {}) {
  const token = getStoredToken();

  if (!token) {
    throw new Error('Not authenticated');
  }

  return apiRequest<T>(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Extract text from receipt images using Nvidia OCR
 * 
 * @example
 * ```ts
 * const formData = new FormData();
 * formData.append('receipt_items', file1);
 * formData.append('receipt_items', file2);
 * formData.append('charges_image', file3);
 * 
 * const result = await extractReceiptText(formData);
 * ```
 */
export async function extractReceiptText(formData: FormData) {
  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
    // Don't set Content-Type header - browser will set it with boundary for multipart/form-data
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ 
      detail: `HTTP ${response.status}` 
    }));
    throw new Error(error.detail || 'Failed to extract receipt text');
  }

  return await response.json();
}

/**
 * Use LLM reasoning for custom prompts
 * 
 * @example
 * ```ts
 * const result = await reasonWithLLM({
 *   prompt: "Analyze this receipt for discounts",
 *   temperature: 0.6,
 *   max_tokens: 2048
 * });
 * ```
 */
export async function reasonWithLLM(params: {
  prompt: string;
  temperature?: number;
  max_tokens?: number;
}) {
  const searchParams = new URLSearchParams({
    prompt: params.prompt,
    ...(params.temperature && { temperature: params.temperature.toString() }),
    ...(params.max_tokens && { max_tokens: params.max_tokens.toString() }),
  });

  return apiRequest(`/nvidia-ocr/reason?${searchParams}`, {
    method: 'POST',
  });
}

// Example: Health check endpoint
export async function checkAPIHealth() {
  return apiRequest('/');
}

// ============================================
// Group Expense Rooms
// ============================================

export async function createGroup(payload: GroupCreateInput): Promise<Group> {
  return apiAuthRequest('/groups', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

export async function listGroups(): Promise<Group[]> {
  return apiAuthRequest('/groups');
}

export async function addGroupMember(groupId: string, email: string): Promise<Group> {
  return apiAuthRequest(`/groups/${groupId}/members`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });
}

export async function updateGroupMemberRole(
  groupId: string,
  email: string,
  role: 'admin' | 'member'
): Promise<Group> {
  return apiAuthRequest(`/groups/${groupId}/members/${encodeURIComponent(email)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ role }),
  });
}

export async function leaveGroup(groupId: string): Promise<{ message: string }> {
  return apiAuthRequest(`/groups/${groupId}/leave`, {
    method: 'POST',
  });
}

export async function deleteGroup(groupId: string): Promise<{ message: string }> {
  return apiAuthRequest(`/groups/${groupId}`, {
    method: 'DELETE',
  });
}

// ============================================
// Folders
// ============================================

export async function createFolder(payload: FolderCreateInput): Promise<Folder> {
  return apiAuthRequest('/folders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

export async function listFolders(): Promise<Folder[]> {
  return apiAuthRequest('/folders');
}

export async function deleteFolder(folderId: string): Promise<{ message: string }> {
  return apiAuthRequest(`/folders/${folderId}`, {
    method: 'DELETE',
  });
}

export async function updateFolder(folderId: string, payload: FolderCreateInput): Promise<Folder> {
  return apiAuthRequest(`/folders/${folderId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

// ============================================
// Receipt Operations
// ============================================

export async function moveReceipt(receiptId: string, folderId: string | null): Promise<Receipt> {
  return apiAuthRequest(`/receipts/${receiptId}/move`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ folder_id: folderId }),
  });
}

// Legacy aliases
export const createReceipt = createGroup;
export const listReceipts = listGroups;
export const deleteReceipt = deleteGroup;
