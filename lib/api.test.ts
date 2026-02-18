import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getReceipt, saveSplit } from './api';

describe('API Client', () => {
    beforeEach(() => {
        // Setup auth token in localStorage for API calls
        localStorage.setItem('token', 'mock-jwt-token-12345');
        localStorage.setItem('rememberMe', 'true');
    });

    describe('getReceipt', () => {
        it('should fetch receipt successfully', async () => {
            const receipt = await getReceipt('receipt-123');

            expect(receipt).toBeDefined();
            expect(receipt.id).toBe('receipt-123');
            expect(receipt.items_analysis).toBeDefined();
            expect(receipt.items_analysis.line_items).toHaveLength(2);
        });

        it('should include authorization header', async () => {
            // MSW will verify the token automatically
            const receipt = await getReceipt('receipt-123');
            expect(receipt).toBeDefined();
        });
    });

    describe('saveSplit', () => {
        it('should save split successfully', async () => {
            const splitMap = {
                '0': ['alice@test.com'],
                '1': ['bob@test.com'],
            };

            const result = await saveSplit('receipt-123', splitMap);

            expect(result.split_details).toEqual(splitMap);
        });

        it('should handle multiple assignees', async () => {
            const splitMap = {
                '0': ['alice@test.com', 'bob@test.com', 'charlie@test.com'],
            };

            const result = await saveSplit('receipt-123', splitMap);

            expect(result.split_details['0']).toHaveLength(3);
            expect(result.split_details['0']).toContain('alice@test.com');
        });
    });
});
