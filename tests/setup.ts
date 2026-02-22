import "@testing-library/jest-dom";
import { vi } from "vitest";

// Polyfill ResizeObserver for Radix UI
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal("ResizeObserver", ResizeObserver);