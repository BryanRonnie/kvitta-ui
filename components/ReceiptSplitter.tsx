import { useState, useEffect } from 'react';
import type { Receipt, GroupMember } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Check, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReceiptSplitterProps {
    receipt: Receipt;
    members: GroupMember[];
    onSave: (splitMap: Record<string, string[]>) => Promise<void>;
}

interface LineItem {
    index: number;
    description: string;
    total_price: number;
    quantity?: number;
}

export function ReceiptSplitter({ receipt, members, onSave }: ReceiptSplitterProps) {
    const [splitMap, setSplitMap] = useState<Record<string, string[]>>({});
    const [items, setItems] = useState<LineItem[]>([]);
    const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
    const [saving, setSaving] = useState(false);

    // Parse items from receipt analysis
    useEffect(() => {
        if (receipt.items_analysis && receipt.items_analysis.line_items) {
            const parsedItems = receipt.items_analysis.line_items.map((item: any, idx: number) => ({
                ...item,
                index: idx // Ensure we have a consistent index
            }));
            setItems(parsedItems);
        }

        // Load existing split if available
        if (receipt.split_details) {
            setSplitMap(receipt.split_details);
        }
    }, [receipt]);

    const toggleItemSelection = (index: number) => {
        const next = new Set(selectedItems);
        if (next.has(index)) {
            next.delete(index);
        } else {
            next.add(index);
        }
        setSelectedItems(next);
    };

    const assignToMember = (email: string) => {
        if (selectedItems.size === 0) return;

        const nextSplitMap = { ...splitMap };

        selectedItems.forEach(index => {
            const key = index.toString();
            const currentAssignees = nextSplitMap[key] || [];

            // Toggle assignment for this member
            if (currentAssignees.includes(email)) {
                nextSplitMap[key] = currentAssignees.filter(e => e !== email);
            } else {
                nextSplitMap[key] = [...currentAssignees, email];
            }

            // Cleanup empty arrays
            if (nextSplitMap[key].length === 0) {
                delete nextSplitMap[key];
            }
        });

        setSplitMap(nextSplitMap);
        // Optional: Clear selection after assignment? keeping it might be better for bulk edits
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave(splitMap);
        } finally {
            setSaving(false);
        }
    };

    const getAssigneeInitials = (email: string) => {
        return email.substring(0, 2).toUpperCase();
    };

    // Calculate totals per member
    const memberTotals = members.reduce((acc, member) => {
        acc[member.email] = 0;
        return acc;
    }, {} as Record<string, number>);

    items.forEach(item => {
        const key = item.index.toString();
        const assignees = splitMap[key] || [];
        if (assignees.length > 0) {
            const splitPrice = item.total_price / assignees.length;
            assignees.forEach(email => {
                if (memberTotals[email] !== undefined) {
                    memberTotals[email] += splitPrice;
                }
            });
        }
    });

    if (!items.length) {
        return <div className="p-4 text-center text-gray-500">No items found in this receipt.</div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
            {/* Center: Receipt Items */}
            <Card className="md:col-span-2 flex flex-col overflow-hidden">
                <CardHeader className="py-3 px-4 border-b">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">Receipt Items</CardTitle>
                        <div className="text-sm text-gray-500">
                            {selectedItems.size} selected
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-0">
                    <div className="divide-y">
                        {items.map((item) => {
                            const assignees = splitMap[item.index.toString()] || [];
                            const isSelected = selectedItems.has(item.index);

                            return (
                                <div
                                    key={item.index}
                                    onClick={() => toggleItemSelection(item.index)}
                                    className={cn(
                                        "flex items-center p-3 cursor-pointer hover:bg-gray-50 transition-colors",
                                        isSelected && "bg-blue-50 hover:bg-blue-100"
                                    )}
                                >
                                    <div className="mr-3">
                                        <div className={cn(
                                            "w-5 h-5 border rounded flex items-center justify-center",
                                            isSelected ? "bg-blue-600 border-blue-600 text-white" : "border-gray-300"
                                        )}>
                                            {isSelected && <Check className="w-3 h-3" />}
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between">
                                            <span className="font-medium">{item.description}</span>
                                            <span className="font-semibold">${item.total_price.toFixed(2)}</span>
                                        </div>

                                        {/* Assignee badges */}
                                        <div className="flex gap-1 mt-1 flex-wrap">
                                            {assignees.map(email => (
                                                <span key={email} className="text-xs bg-gray-200 px-1.5 py-0.5 rounded text-gray-700">
                                                    {email}
                                                </span>
                                            ))}
                                            {assignees.length === 0 && (
                                                <span className="text-xs text-red-400 italic">Unassigned</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Right: Members & Actions */}
            <div className="flex flex-col gap-4">
                <Card className="flex-1 flex flex-col">
                    <CardHeader className="py-3 px-4 border-b">
                        <CardTitle className="text-lg">Assign To</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                        <p className="text-xs text-gray-500 mb-2">
                            Select items on the left, then click a member to assign/unassign.
                        </p>
                        {members.map(member => (
                            <button
                                key={member.email}
                                onClick={() => assignToMember(member.email)}
                                className="w-full flex items-center justify-between p-3 rounded border hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                            >
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback>{getAssigneeInitials(member.email)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium truncate w-32">{member.email}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="font-bold text-green-600">${memberTotals[member.email]?.toFixed(2) || '0.00'}</span>
                                </div>
                            </button>
                        ))}
                    </CardContent>
                </Card>

                <Button onClick={handleSave} isLoading={saving} size="lg" className="w-full">
                    Save Split
                </Button>
            </div>
        </div>
    );
}
