import '@testing-library/jest-dom';
import { expect, afterEach, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './mocks/server';

// Mock environment variables
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8000';

// Mock window.matchMedia (used by many UI libraries)
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Mock localStorage with actual storage
const localStorageData: Record<string, string> = {};
const localStorageMock = {
    getItem: (key: string) => localStorageData[key] || null,
    setItem: (key: string, value: string) => {
        localStorageData[key] = value;
    },
    removeItem: (key: string) => {
        delete localStorageData[key];
    },
    clear: () => {
        Object.keys(localStorageData).forEach(key => delete localStorageData[key]);
    },
};
global.localStorage = localStorageMock as any;

// Mock sessionStorage with actual storage
const sessionStorageData: Record<string, string> = {};
const sessionStorageMock = {
    getItem: (key: string) => sessionStorageData[key] || null,
    setItem: (key: string, value: string) => {
        sessionStorageData[key] = value;
    },
    removeItem: (key: string) => {
        delete sessionStorageData[key];
    },
    clear: () => {
        Object.keys(sessionStorageData).forEach(key => delete sessionStorageData[key]);
    },
};
global.sessionStorage = sessionStorageMock as any;

// Start MSW server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));

// Setup before each test
beforeEach(() => {
    // Clear storage before each test
    Object.keys(localStorageData).forEach(key => delete localStorageData[key]);
    Object.keys(sessionStorageData).forEach(key => delete sessionStorageData[key]);
});

// Cleanup after each test
afterEach(() => {
    cleanup();
    server.resetHandlers();
});

// Close server after all tests
afterAll(() => server.close());
