import { useCallback } from 'react';
import { BlockType } from '@/types/editor.types';

interface MarkdownPattern {
    pattern: RegExp;
    type: BlockType;
    clearContent?: boolean;
}

const MARKDOWN_PATTERNS: MarkdownPattern[] = [
    // Headings
    { pattern: /^# $/, type: 'heading1', clearContent: true },
    { pattern: /^## $/, type: 'heading2', clearContent: true },
    { pattern: /^### $/, type: 'heading3', clearContent: true },
    // Lists
    { pattern: /^- $/, type: 'bulletList', clearContent: true },
    { pattern: /^\* $/, type: 'bulletList', clearContent: true },
    { pattern: /^1\. $/, type: 'numberedList', clearContent: true },
    { pattern: /^\d+\. $/, type: 'numberedList', clearContent: true },
    // Todo
    { pattern: /^\[\] $/, type: 'todo', clearContent: true },
    { pattern: /^\[ \] $/, type: 'todo', clearContent: true },
    // Quote
    { pattern: /^> $/, type: 'quote', clearContent: true },
    { pattern: /^" $/, type: 'quote', clearContent: true },
    // Code block
    { pattern: /^```$/, type: 'code', clearContent: true },
    { pattern: /^```\s$/, type: 'code', clearContent: true },
    // Divider
    { pattern: /^---$/, type: 'divider', clearContent: true },
    { pattern: /^---\s$/, type: 'divider', clearContent: true },
    { pattern: /^\*\*\*$/, type: 'divider', clearContent: true },
    // Math/Equation
    { pattern: /^\$\$$/, type: 'math', clearContent: true },
    // Toggle
    { pattern: /^> > $/, type: 'toggle', clearContent: true },
    // Callout
    { pattern: /^! $/, type: 'callout', clearContent: true },
    { pattern: /^!! $/, type: 'callout', clearContent: true },
];

export interface UseMarkdownShortcutsOptions {
    onTransform: (blockId: string, type: BlockType, clearContent?: boolean) => void;
}

export const useMarkdownShortcuts = ({ onTransform }: UseMarkdownShortcutsOptions) => {
    const checkAndTransform = useCallback((blockId: string, content: string): boolean => {
        for (const { pattern, type, clearContent } of MARKDOWN_PATTERNS) {
            if (pattern.test(content)) {
                onTransform(blockId, type, clearContent);
                return true;
            }
        }
        return false;
    }, [onTransform]);

    const handleInput = useCallback((blockId: string, content: string, key: string): boolean => {
        // Only check on space or enter
        if (key !== ' ' && key !== 'Enter') {
            return false;
        }

        // Check if content matches any markdown pattern
        return checkAndTransform(blockId, content);
    }, [checkAndTransform]);

    return {
        checkAndTransform,
        handleInput,
    };
};

// Additional inline formatting shortcuts
export const INLINE_SHORTCUTS = {
    bold: { trigger: '**', command: 'bold' },
    italic: { trigger: '__', command: 'italic' },
    italicAlt: { trigger: '_', command: 'italic' },
    strikethrough: { trigger: '~~', command: 'strikeThrough' },
    code: { trigger: '`', command: 'code' },
};

export const processInlineShortcut = (text: string): { processed: string; command: string } | null => {
    // Check for bold: **text**
    const boldMatch = text.match(/\*\*([^*]+)\*\*$/);
    if (boldMatch) {
        return { processed: boldMatch[1], command: 'bold' };
    }

    // Check for italic: *text* or _text_
    const italicMatch = text.match(/(?<!\*)\*([^*]+)\*(?!\*)$|_([^_]+)_$/);
    if (italicMatch) {
        return { processed: italicMatch[1] || italicMatch[2], command: 'italic' };
    }

    // Check for strikethrough: ~~text~~
    const strikeMatch = text.match(/~~([^~]+)~~$/);
    if (strikeMatch) {
        return { processed: strikeMatch[1], command: 'strikeThrough' };
    }

    // Check for inline code: `text`
    const codeMatch = text.match(/`([^`]+)`$/);
    if (codeMatch) {
        return { processed: codeMatch[1], command: 'code' };
    }

    return null;
};
