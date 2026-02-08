import { useState, useCallback, useMemo } from 'react';
import { Block, BlockType } from '@/types/editor.types';

interface UseBlockEditorOptions {
    initialBlocks?: Block[];
    onSave?: (blocks: Block[]) => void;
    autoSave?: boolean;
    autoSaveDelay?: number;
}

export const useBlockEditor = (options: UseBlockEditorOptions = {}) => {
    const { initialBlocks = [], onSave, autoSave = true, autoSaveDelay = 500 } = options;

    const [blocks, setBlocks] = useState<Block[]>(
        initialBlocks.length > 0 ? initialBlocks : [createDefaultBlock()]
    );
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
    const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
    const [history, setHistory] = useState<Block[][]>([initialBlocks]);
    const [historyIndex, setHistoryIndex] = useState(0);

    // Generate unique block ID
    const generateBlockId = useCallback(() => {
        return `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }, []);

    // Create a new block with defaults
    const createBlock = useCallback((type: BlockType, content = '', metadata = {}): Block => {
        return {
            id: generateBlockId(),
            type,
            content,
            metadata,
            children: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    }, [generateBlockId]);

    // Add block at specific position
    const addBlock = useCallback((type: BlockType, position?: number, parentId?: string) => {
        const newBlock = createBlock(type);

        setBlocks((prev) => {
            const newBlocks = [...prev];

            if (parentId) {
                // Add as child to parent block
                const parentIndex = newBlocks.findIndex(b => b.id === parentId);
                if (parentIndex !== -1) {
                    newBlocks[parentIndex] = {
                        ...newBlocks[parentIndex],
                        children: [...(newBlocks[parentIndex].children || []), newBlock],
                    };
                }
            } else {
                // Add at position or end
                const insertPosition = position !== undefined ? position : newBlocks.length;
                newBlocks.splice(insertPosition, 0, newBlock);
            }

            saveToHistory(newBlocks);
            if (autoSave && onSave) {
                setTimeout(() => onSave(newBlocks), autoSaveDelay);
            }
            return newBlocks;
        });

        return newBlock;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [createBlock, autoSave, onSave, autoSaveDelay]);

    // Update existing block
    const updateBlock = useCallback((id: string, updates: Partial<Block>) => {
        setBlocks((prev) => {
            const newBlocks = prev.map((block) => {
                if (block.id === id) {
                    return {
                        ...block,
                        ...updates,
                        updatedAt: new Date().toISOString(),
                    };
                }
                // Check children
                if (block.children && block.children.length > 0) {
                    return {
                        ...block,
                        children: block.children.map((child) =>
                            child.id === id
                                ? { ...child, ...updates, updatedAt: new Date().toISOString() }
                                : child
                        ),
                    };
                }
                return block;
            });

            saveToHistory(newBlocks);
            if (autoSave && onSave) {
                setTimeout(() => onSave(newBlocks), autoSaveDelay);
            }
            return newBlocks;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoSave, onSave, autoSaveDelay]);

    // Delete block
    const deleteBlock = useCallback((id: string) => {
        setBlocks((prev) => {
            const newBlocks = prev
                .filter((block) => block.id !== id)
                .map((block) => ({
                    ...block,
                    children: block.children?.filter((child) => child.id !== id),
                }));

            saveToHistory(newBlocks);
            if (autoSave && onSave) {
                setTimeout(() => onSave(newBlocks), autoSaveDelay);
            }
            return newBlocks;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoSave, onSave, autoSaveDelay]);

    // Transform block to different type
    const transformBlock = useCallback((id: string, newType: BlockType) => {
        updateBlock(id, { type: newType });
    }, [updateBlock]);

    // Move block to new position
    const moveBlock = useCallback((id: string, newPosition: number) => {
        setBlocks((prev) => {
            const blockIndex = prev.findIndex((b) => b.id === id);
            if (blockIndex === -1) return prev;

            const newBlocks = [...prev];
            const [movedBlock] = newBlocks.splice(blockIndex, 1);
            newBlocks.splice(newPosition, 0, movedBlock);

            saveToHistory(newBlocks);
            if (autoSave && onSave) {
                setTimeout(() => onSave(newBlocks), autoSaveDelay);
            }
            return newBlocks;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoSave, onSave, autoSaveDelay]);

    // Duplicate block
    const duplicateBlock = useCallback((id: string) => {
        const block = blocks.find((b) => b.id === id);
        if (!block) return;

        const duplicated = {
            ...block,
            id: generateBlockId(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const blockIndex = blocks.findIndex((b) => b.id === id);
        addBlock(duplicated.type, blockIndex + 1);
        updateBlock(duplicated.id, { content: duplicated.content, metadata: duplicated.metadata });
    }, [blocks, generateBlockId, addBlock, updateBlock]);

    // Focus block
    const focusBlock = useCallback((id: string) => {
        setFocusedBlockId(id);
    }, []);

    // Select block
    const selectBlock = useCallback((id: string) => {
        setSelectedBlockId(id);
    }, []);

    // History management
    const saveToHistory = useCallback((newBlocks: Block[]) => {
        setHistory((prev) => {
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push(newBlocks);
            return newHistory.slice(-50); // Keep last 50 states
        });
        setHistoryIndex((prev) => Math.min(prev + 1, 49));
    }, [historyIndex]);

    // Undo
    const undo = useCallback(() => {
        if (historyIndex > 0) {
            setHistoryIndex((prev) => prev - 1);
            setBlocks(history[historyIndex - 1]);
        }
    }, [historyIndex, history]);

    // Redo
    const redo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex((prev) => prev + 1);
            setBlocks(history[historyIndex + 1]);
        }
    }, [historyIndex, history]);

    // Get block by ID
    const getBlock = useCallback((id: string): Block | undefined => {
        const block = blocks.find((b) => b.id === id);
        if (block) return block;

        // Search in children
        for (const b of blocks) {
            if (b.children) {
                const child = b.children.find((c) => c.id === id);
                if (child) return child;
            }
        }
        return undefined;
    }, [blocks]);

    // Get block index
    const getBlockIndex = useCallback((id: string): number => {
        return blocks.findIndex((b) => b.id === id);
    }, [blocks]);

    return {
        blocks,
        selectedBlockId,
        focusedBlockId,
        canUndo: historyIndex > 0,
        canRedo: historyIndex < history.length - 1,
        addBlock,
        updateBlock,
        deleteBlock,
        transformBlock,
        moveBlock,
        duplicateBlock,
        focusBlock,
        selectBlock,
        undo,
        redo,
        getBlock,
        getBlockIndex,
    };
};

// Helper function to create default block
function createDefaultBlock(): Block {
    return {
        id: `block_${Date.now()}`,
        type: 'text',
        content: '',
        metadata: {},
        children: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
}
