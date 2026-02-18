import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReceiptSplitter } from './ReceiptSplitter';
import { mockReceipt, mockReceiptWithSplit } from '../tests/fixtures/receipts';
import { mockGroupMembers } from '../tests/fixtures/groups';

describe('ReceiptSplitter', () => {
    const mockOnSave = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render all line items', () => {
        render(
            <ReceiptSplitter
                receipt={mockReceipt}
                members={mockGroupMembers}
                onSave={mockOnSave}
            />
        );

        expect(screen.getByText('Margherita Pizza')).toBeInTheDocument();
        expect(screen.getByText('Caesar Salad')).toBeInTheDocument();
        expect(screen.getByText('Soft Drinks')).toBeInTheDocument();
    });

    it('should show empty state when no items', () => {
        const emptyReceipt = {
            ...mockReceipt,
            items_analysis: { ...mockReceipt.items_analysis, line_items: [] }
        };

        render(
            <ReceiptSplitter
                receipt={emptyReceipt}
                members={mockGroupMembers}
                onSave={mockOnSave}
            />
        );

        expect(screen.getByText(/no items found/i)).toBeInTheDocument();
    });

    it('should toggle item selection', async () => {
        render(
            <ReceiptSplitter
                receipt={mockReceipt}
                members={mockGroupMembers}
                onSave={mockOnSave}
            />
        );

        // Initially 0 selected
        expect(screen.getByText('0 selected')).toBeInTheDocument();

        // Click first item
        const pizzaItem = screen.getByText('Margherita Pizza').closest('div');
        if (pizzaItem) {
            await userEvent.click(pizzaItem);
        }

        // Should show 1 selected
        expect(screen.getByText('1 selected')).toBeInTheDocument();
    });

    it('should calculate totals correctly with split', () => {
        render(
            <ReceiptSplitter
                receipt={mockReceiptWithSplit}
                members={mockGroupMembers}
                onSave={mockOnSave}
            />
        );

        // Pizza: 18.50 / 2 = 9.25
        // Salad: 12.00 / 1 = 12.00
        // Drinks: 8.00 / 3 = 2.67
        // Alice total: 9.25 + 12.00 + 2.67 = 23.92

        // Check that the total is displayed somewhere
        expect(screen.getByText('$23.92')).toBeInTheDocument();
    });

    it('should show unassigned warning for items without assignees', () => {
        render(
            <ReceiptSplitter
                receipt={mockReceipt}
                members={mockGroupMembers}
                onSave={mockOnSave}
            />
        );

        // All items should show "Unassigned"
        const unassignedElements = screen.getAllByText('Unassigned');
        expect(unassignedElements.length).toBeGreaterThan(0);
    });
});
