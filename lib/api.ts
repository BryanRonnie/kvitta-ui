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

/**
 * Extract text from receipt images using Nvidia OCR
 * 
 * @example
 * ```ts
 * const formData = new FormData();
 * formData.append('items_images', file1);
 * formData.append('items_images', file2);
 * formData.append('charges_image', file3);
 * 
 * const result = await extractReceiptText(formData);
 * ```
 */
export async function extractReceiptText(formData: FormData) {
  const response = await fetch(`${API_BASE_URL}/nvidia-ocr/extract-text`, {
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
