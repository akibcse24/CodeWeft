import React, { useState } from 'react';
import { Block } from '@/types/editor.types';
import { cn } from '@/lib/utils';
import { Plus, Trash2, GripHorizontal, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TableBlockProps {
    block: Block;
    onUpdate: (updates: Partial<Block>) => void;
    onFocus?: () => void;
    isFocused?: boolean;
}

export const TableBlock: React.FC<TableBlockProps> = ({
    block,
    onUpdate,
    onFocus,
    isFocused,
}) => {
    const rows = (block.metadata?.rowCount as number) || 3;
    const cols = (block.metadata?.colCount as number) || 3;
    const tableData = (block.metadata?.data as string[][]) ||
        Array.from({ length: rows }, () => Array.from({ length: cols }, () => ''));

    const updateCell = (rowIndex: number, colIndex: number, value: string) => {
        const newData = [...tableData];
        newData[rowIndex] = [...newData[rowIndex]];
        newData[rowIndex][colIndex] = value;
        onUpdate({
            metadata: {
                ...block.metadata,
                data: newData,
            }
        });
    };

    const addRow = () => {
        const newData = [...tableData, Array.from({ length: cols }, () => '')];
        onUpdate({
            metadata: {
                ...block.metadata,
                rowCount: rows + 1,
                data: newData,
            }
        });
    };

    const addCol = () => {
        const newData = tableData.map(row => [...row, '']);
        onUpdate({
            metadata: {
                ...block.metadata,
                colCount: cols + 1,
                data: newData,
            }
        });
    };

    const deleteRow = (rowIndex: number) => {
        if (rows <= 1) return;
        const newData = tableData.filter((_, i) => i !== rowIndex);
        onUpdate({
            metadata: {
                ...block.metadata,
                rowCount: rows - 1,
                data: newData,
            }
        });
    };

    const deleteCol = (colIndex: number) => {
        if (cols <= 1) return;
        const newData = tableData.map(row => row.filter((_, i) => i !== colIndex));
        onUpdate({
            metadata: {
                ...block.metadata,
                colCount: cols - 1,
                data: newData,
            }
        });
    };

    return (
        <div className="my-4 overflow-x-auto" onFocus={onFocus}>
            <table className="w-full border-collapse border border-border/50 rounded-lg overflow-hidden">
                <thead>
                    <tr className="bg-muted/30">
                        {Array.from({ length: cols }).map((_, i) => (
                            <th key={i} className="border border-border/50 p-0 relative group">
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => deleteCol(i)}>
                                        <Trash2 className="h-3 w-3 text-destructive" />
                                    </Button>
                                </div>
                                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground text-left">
                                    Column {i + 1}
                                </div>
                            </th>
                        ))}
                        <th className="w-8 border-none bg-transparent">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={addCol}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {tableData.map((row, rowIndex) => (
                        <tr key={rowIndex} className="group/row">
                            {row.map((cell, colIndex) => (
                                <td key={colIndex} className="border border-border/50 p-0">
                                    <input
                                        type="text"
                                        value={cell}
                                        onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                                        className="w-full px-3 py-2 bg-transparent border-0 focus:outline-none focus:bg-accent/30 text-sm"
                                        placeholder="..."
                                    />
                                </td>
                            ))}
                            <td className="w-8 opacity-0 group-hover/row:opacity-100 border-none bg-transparent pl-1">
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteRow(rowIndex)}>
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                            </td>
                        </tr>
                    ))}
                    <tr>
                        <td colSpan={cols} className="p-1">
                            <Button variant="ghost" size="sm" className="w-full h-8 text-muted-foreground justify-center border border-dashed border-border/50 mt-1" onClick={addRow}>
                                <Plus className="h-3 w-3 mr-2" />
                                Add Row
                            </Button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};
