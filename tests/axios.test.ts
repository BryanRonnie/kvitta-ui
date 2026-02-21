import { describe, it, expect, beforeEach } from "bun:test";
import { api } from "@/api/axios";
import { ReceiptVersionConflictError } from "@/types/receipt";

beforeEach(() => {
  (globalThis as any).window = {
    location: { href: "" },
  };

  const store: Record<string, string> = {};

  (globalThis as any).localStorage = {
    getItem: (k: string) => store[k] || null,
    setItem: (k: string, v: string) => (store[k] = v),
    removeItem: (k: string) => delete store[k],
    clear: () => Object.keys(store).forEach(k => delete store[k]),
  };
});

describe("Axios response interceptor", () => {
  const rejected =
    api.interceptors.response.handlers[0].rejected;

  it("handles 401 by clearing token and redirecting", async () => {
    localStorage.setItem("access_token", "abc");

    const error = { response: { status: 401 } };

    try {
      await rejected(error);
    } catch (_) {}

    expect(localStorage.getItem("access_token")).toBeNull();
    expect(window.location.href).toBe("/login");
  });

  it("transforms 409 into ReceiptVersionConflictError", async () => {
    const error = {
      response: {
        status: 409,
        data: {
          previousVersion: 1,
          currentVersion: 2,
        },
      },
    };

    try {
      await rejected(error);
    } catch (e) {
      expect(e instanceof ReceiptVersionConflictError).toBe(true);
    }
  });

  it("passes through 409 without version payload", async () => {
    const error = {
      response: { status: 409, data: {} },
    };

    try {
      await rejected(error);
    } catch (e) {
      expect(e).toBe(error);
    }
  });

  it("passes through non-handled errors", async () => {
    const error = { response: { status: 500 } };

    try {
      await rejected(error);
    } catch (e) {
      expect(e).toBe(error);
    }
  });
});
