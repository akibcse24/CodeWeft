import { Block } from "@/types/editor.types";

/**
 * Finds a block recursively by its ID.
 */
export const findBlockRecursive = (blocks: Block[], id: string): Block | null => {
    for (const b of blocks) {
        if (b.id === id) return b;
        if (b.children) {
            const found = findBlockRecursive(b.children, id);
            if (found) return found;
        }
        if (b.columns) {
            for (const col of b.columns) {
                const found = findBlockRecursive(col, id);
                if (found) return found;
            }
        }
    }
    return null;
};

/**
 * Updates a block recursively by its ID.
 */
export const updateBlocksRecursive = (blocks: Block[], id: string, updates: Partial<Block>): Block[] => {
    return blocks.map(b => {
        if (b.id === id) return { ...b, ...updates };
        const newBlock = { ...b };
        if (b.children) {
            newBlock.children = updateBlocksRecursive(b.children, id, updates);
        }
        if (b.columns) {
            newBlock.columns = b.columns.map(col => updateBlocksRecursive(col, id, updates));
        }
        return newBlock;
    });
};

/**
 * Deletes a block recursively by its ID.
 */
export const deleteBlockRecursive = (blocks: Block[], id: string): Block[] => {
    return blocks
        .filter(b => b.id !== id)
        .map(b => ({
            ...b,
            children: b.children ? deleteBlockRecursive(b.children, id) : undefined,
            columns: b.columns ? b.columns.map(col => deleteBlockRecursive(col, id)) : undefined
        }));
};

/**
 * Adds a new block after a specific block ID recursively.
 */
export const addBlockAfterRecursive = (blocks: Block[], afterId: string, newBlock: Block): Block[] => {
    const index = blocks.findIndex(b => b.id === afterId);
    if (index !== -1) {
        const newBlocks = [...blocks];
        newBlocks.splice(index + 1, 0, newBlock);
        return newBlocks;
    }
    return blocks.map(b => ({
        ...b,
        children: b.children ? addBlockAfterRecursive(b.children, afterId, newBlock) : undefined,
        columns: b.columns ? b.columns.map(col => addBlockAfterRecursive(col, afterId, newBlock)) : undefined
    }));
};

/**
 * Duplicates a block recursively by its ID.
 */
export const duplicateBlockRecursive = (blocks: Block[], id: string, newId: string): Block[] => {
    const index = blocks.findIndex(b => b.id === id);
    if (index !== -1) {
        const newBlocks = [...blocks];
        const original = blocks[index];
        // Deep clone original and assign new ID to root and all children
        const deepCloneWithNewIds = (block: Block): Block => {
            const newBlock = { ...block, id: Math.random().toString(36).substring(2, 9) };
            if (block.children) {
                newBlock.children = block.children.map(deepCloneWithNewIds);
            }
            if (block.columns) {
                newBlock.columns = block.columns.map(col => col.map(deepCloneWithNewIds));
            }
            return newBlock;
        };

        newBlocks.splice(index + 1, 0, deepCloneWithNewIds(original));
        return newBlocks;
    }
    return blocks.map(b => ({
        ...b,
        children: b.children ? duplicateBlockRecursive(b.children, id, newId) : undefined,
        columns: b.columns ? b.columns.map(col => duplicateBlockRecursive(col, id, newId)) : undefined
    }));
};

/**
 * Flattens all blocks into a single array of IDs for DND context.
 */
export const getFlattenedBlockIds = (blocks: Block[]): string[] => {
    const ids: string[] = [];
    blocks.forEach(b => {
        ids.push(b.id);
        if (b.children) {
            ids.push(...getFlattenedBlockIds(b.children));
        }
        if (b.columns) {
            b.columns.forEach(col => {
                ids.push(...getFlattenedBlockIds(col));
            });
        }
    });
    return ids;
};

/**
 * Recursively extracts text content from blocks.
 */
export const extractTextFromBlocks = (blocks: Block[]): string => {
    return blocks.map(block => {
        let text = block.content || "";
        if (block.children && block.children.length > 0) {
            text += " " + extractTextFromBlocks(block.children);
        }
        if (block.columns) {
            block.columns.forEach(col => {
                text += " " + extractTextFromBlocks(col);
            });
        }
        return text;
    }).join("\n");
};
