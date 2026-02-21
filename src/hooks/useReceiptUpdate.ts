"use client";

import { useState, useCallback } from "react";
import { ReceiptVersionConflictError } from "@/types/receipt";

interface UseReceiptUpdateOptions {
  maxRetries?: number;
  onConflict?: (error: ReceiptVersionConflictError) => void;
}

/**
 * Hook for handling receipt updates with optimistic locking
 * Automatically retries on version conflicts (409)
 *
 * Usage:
 * const { updateWithRetry, loading, error } = useReceiptUpdate();
 * await updateWithRetry(receiptId, { version, title: "New Title" }, fetchReceiptFn);
 */
export function useReceiptUpdate(options: UseReceiptUpdateOptions = {}) {
  const { maxRetries = 3, onConflict } = options;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateWithRetry = useCallback(
    async <T,>(
      updateFn: () => Promise<T>,
      onVersionConflict?: () => Promise<T>
    ): Promise<T> => {
      setLoading(true);
      setError(null);

      let retries = 0;

      while (retries < maxRetries) {
        try {
          const result = await updateFn();
          setLoading(false);
          return result;
        } catch (err) {
          if (
            err instanceof ReceiptVersionConflictError &&
            retries < maxRetries - 1
          ) {
            retries++;
            console.warn(
              `Version conflict (retry ${retries}/${maxRetries}):`,
              err.message
            );

            onConflict?.(err);

            // Refetch and retry with new version
            if (onVersionConflict) {
              try {
                await new Promise((resolve) => setTimeout(resolve, 100)); // Small delay
                return await updateWithRetry(
                  onVersionConflict,
                  onVersionConflict
                );
              } catch (retryErr) {
                setError(retryErr instanceof Error ? retryErr : new Error(String(retryErr)));
                setLoading(false);
                throw retryErr;
              }
            }
          }

          const errorObj = err instanceof Error ? err : new Error(String(err));
          setError(errorObj);
          setLoading(false);
          throw errorObj;
        }
      }

      const maxRetriesError = new Error(`Max retries (${maxRetries}) exceeded`);
      setError(maxRetriesError);
      setLoading(false);
      throw maxRetriesError;
    },
    [maxRetries, onConflict]
  );

  return { updateWithRetry, loading, error };
}
