import axios from "axios";
import { ReceiptVersionConflictError } from "../types/receipt";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle unauthorized (token expired/invalid)
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token");
        // Optionally redirect to login
        window.location.href = "/login";
      }
    }

    // Handle version conflict (optimistic locking)
    if (error.response?.status === 409) {
      const { previousVersion, currentVersion } = error.response?.data || {};
      if (previousVersion !== undefined && currentVersion !== undefined) {
        const conflictError = new ReceiptVersionConflictError(
          previousVersion,
          currentVersion
        );
        return Promise.reject(conflictError);
      }
    }

    return Promise.reject(error);
  }
);


import { describe, it, expect } from "bun:test";

describe("Axios SSR branch", () => {
  it("does not access localStorage when window is undefined", async () => {
    // Remove window entirely
    delete (globalThis as any).window;

    const handler =
      api.interceptors.request.handlers?.[0]?.fulfilled;

    if (!handler) {
      throw new Error("Handler is not defined");
    }

    const config = await handler({ headers: {} } as any);

    expect(config.headers.Authorization).toBeUndefined();
  });
});