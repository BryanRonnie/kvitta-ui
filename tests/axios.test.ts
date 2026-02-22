import { api } from "../src/api";
import { ReceiptVersionConflictError } from "../src/types/receipt";
import { describe, it, expect, beforeEach, vi } from "vitest";

describe("Axios response interceptor", () => {
  const rejected =
    api.interceptors.response.handlers?.[0].rejected!;

  beforeEach(() => {
    // Reset storage
    localStorage.clear();

    // Mock window.location safely
    vi.stubGlobal("window", {
      ...window,
      location: { href: "" },
    });
  });

  it("handles 401 by clearing token and redirecting", async () => {
    localStorage.setItem("access_token", "abc");

    const error = { response: { status: 401 } };

    await expect(rejected(error)).rejects.toBeDefined();

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

    await expect(rejected(error)).rejects.toBeInstanceOf(
      ReceiptVersionConflictError
    );
  });

  it("passes through 409 without version payload", async () => {
    const error = {
      response: { status: 409, data: {} },
    };

    await expect(rejected(error)).rejects.toBe(error);
  });

  it("passes through non-handled errors", async () => {
    const error = { response: { status: 500 } };

    await expect(rejected(error)).rejects.toBe(error);
  });
});