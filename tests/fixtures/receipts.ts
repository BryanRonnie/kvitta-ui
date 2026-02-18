import type { Receipt } from '@/types';

export const mockReceipt: Receipt = {
    id: 'receipt-123',
    user_email: 'test@example.com',
    created_at: '2024-01-01T00:00:00Z',
    items_analysis: {
        line_items: [
            {
                description: 'Margherita Pizza',
                total_price: 18.50,
                quantity: 1,
                index: 0,
            },
            {
                description: 'Caesar Salad',
                total_price: 12.00,
                quantity: 2,
                index: 1,
            },
            {
                description: 'Soft Drinks',
                total_price: 8.00,
                quantity: 4,
                index: 2,
            },
        ],
        total: 38.50,
        tax: 3.08,
        tip: 7.00,
    },
    split_details: {},
    status: 'completed',
};

export const mockReceiptWithSplit: Receipt = {
    ...mockReceipt,
    split_details: {
        '0': ['alice@test.com', 'bob@test.com'],
        '1': ['alice@test.com'],
        '2': ['alice@test.com', 'bob@test.com', 'charlie@test.com'],
    },
};
