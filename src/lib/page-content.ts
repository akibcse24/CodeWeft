import { Block } from "@/components/editor/BlockEditor";

export type PropertyType = 'text' | 'number' | 'select' | 'multi-select' | 'status' | 'date' | 'checkbox' | 'url' | 'email' | 'person' | 'formula';

export interface PropertyConfig {
    id: string;
    name: string;
    type: PropertyType;
    options?: { id: string; name: string; color: string }[]; // For select/status
    formula?: string; // For formula properties
}

export type PropertyValue = string | number | boolean | string[] | null;

export interface PageContent {
    type?: 'page' | 'database';
    viewType?: 'list' | 'board' | 'table';
    properties?: Record<string, PropertyValue>;
    schema?: Record<string, PropertyConfig>; // Schema definition for database properties
    blocks: Block[];
}

/**
 * Safely extracts blocks from any content format (legacy array or new object)
 */
export function getPageBlocks(content: unknown): Block[] {
    if (!content) return [];
    if (Array.isArray(content)) return content as Block[];
    return (content as PageContent).blocks || [];
}

/**
 * Safely extracts properties from content
 */
export function getPageProperties(content: unknown): Record<string, PropertyValue> {
    if (!content || Array.isArray(content)) return {};
    return (content as PageContent).properties || {};
}

/**
 * Safely extracts database schema from content
 */
export function getPageSchema(content: unknown): Record<string, PropertyConfig> {
    if (!content || Array.isArray(content)) return {};
    return (content as PageContent).schema || {};
}

/**
 * Safely extracts view type (list, board, table)
 */
export function getPageViewType(content: unknown): 'list' | 'board' | 'table' | undefined {
    if (!content || Array.isArray(content)) return undefined;
    return (content as PageContent).viewType;
}

/**
 * Checks if the content represents a database
 */
export function isDatabase(content: unknown): boolean {
    if (!content || Array.isArray(content)) return false;
    return (content as PageContent).type === 'database';
}

/**
 * Creates a standard structure for saving
 */
export function createPageContent(blocks: Block[], existingContent?: unknown): PageContent {
    const base: Partial<PageContent> = (!Array.isArray(existingContent) && existingContent) ? (existingContent as PageContent) : {};
    return {
        ...base,
        blocks,
        type: base?.type || 'page',
        properties: base?.properties || {},
    };
}
