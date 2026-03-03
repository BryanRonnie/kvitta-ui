"use client";

import { useEffect, useState, useRef } from "react";

interface WorkerHealthStatus {
  isOnline: boolean;
  isLoading: boolean;
  lastChecked: Date | null;
}

/**
 * Hook to monitor OCR worker health status
 * Polls the worker health endpoint periodically
 * 
 * Best practices:
 * - Polls every 30 seconds to avoid excessive requests
 * - Caches status for the polling interval
 * - Gracefully handles network errors
 * - Uses exponential backoff for repeated failures
 */
export function useWorkerHealth(pollInterval: number = 30000) {
  const [status, setStatus] = useState<WorkerHealthStatus>({
    isOnline: false,
    isLoading: true,
    lastChecked: null,
  });
  const failureCountRef = useRef(0);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const checkHealth = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_WORKER_API_URL || "http://localhost:8001";
        if (!baseUrl) {
          setStatus({
            isOnline: false,
            isLoading: false,
            lastChecked: new Date(),
          });
          return;
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const response = await fetch(`${baseUrl}/health`, {
          method: "GET",
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (isMounted) {
          const isOnline = response.ok;
          setStatus({
            isOnline,
            isLoading: false,
            lastChecked: new Date(),
          });
          // Reset failure count on success
          if (isOnline) {
            failureCountRef.current = 0;
          } else {
            failureCountRef.current += 1;
          }
        }
      } catch (error) {
        if (isMounted) {
          setStatus({
            isOnline: false,
            isLoading: false,
            lastChecked: new Date(),
          });
          failureCountRef.current += 1;
        }
      }
    };

    // Initial check
    checkHealth();

    // Poll with failure backoff
    const scheduleNextCheck = () => {
      // Exponential backoff on failures: 30s, 60s, 120s max
      const backoffMultiplier = Math.min(Math.pow(2, Math.max(0, failureCountRef.current - 1)), 4);
      const nextCheckInterval = pollInterval * backoffMultiplier;

      timeoutId = setTimeout(() => {
        checkHealth();
        scheduleNextCheck();
      }, nextCheckInterval);
    };

    scheduleNextCheck();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [pollInterval]);

  return status;
}
