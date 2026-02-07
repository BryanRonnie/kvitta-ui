/**
 * Type definitions for Kvitta Receipt Processing
 * 
 * Keep all your TypeScript types/interfaces here for:
 * - Type safety across the application
 * - Easy refactoring
 * - Auto-completion in IDE
 * - Documentation
 */

// ============================================
// Receipt Extraction Types
// ============================================

export interface LineItem {
  name_raw: string;
  quantity: number;
  unit_price: number | null;
  line_subtotal: number | null;
}

export interface Fee {
  type: string;
  amount: number;
  taxable: boolean;
}

export interface Discount {
  description: string;
  amount: number;
}

/**
 * Response from Nvidia OCR API
 */
export interface OcrResponse {
  success: boolean;
  full_text: string;
  items_text: string;
  charges_text: string;
  items_analysis?: {
    response: string; // JSON string containing line_items
  };
  charges_analysis?: {
    response: string; // JSON string containing charges data
  };
}

/**
 * Parsed items analysis
 */
export interface ItemsAnalysis {
  line_items: LineItem[];
}

/**
 * Parsed charges analysis
 */
export interface ChargesAnalysis {
  subtotal_items: number | null;
  fees: Fee[];
  discounts: Discount[];
  total_tax_reported: number | null;
  grand_total: number | null;
}

// ============================================
// Component Props Types
// ============================================

/**
 * Example: FileUpload component props
 */
export interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
}

/**
 * Example: ReceiptCard component props
 */
export interface ReceiptCardProps {
  items: LineItem[];
  charges: ChargesAnalysis;
  onEdit?: () => void;
  onDelete?: () => void;
}

// ============================================
// Utility Types
// ============================================

/**
 * API Error response structure
 */
export interface ApiError {
  detail: string;
  status?: number;
}

/**
 * Generic paginated response
 * 
 * @example
 * ```ts
 * type ReceiptList = PaginatedResponse<Receipt>;
 * ```
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Loading states for async operations
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// ============================================
// Group Expense Rooms
// ============================================

export type GroupRole = 'admin' | 'member';

export interface GroupMember {
  email: string;
  role: GroupRole;
  joined_at: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  members: GroupMember[];
}

export interface GroupCreateInput {
  name: string;
  description?: string;
}
