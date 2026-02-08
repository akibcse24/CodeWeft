import React, { useRef, useEffect, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Block, BlockType } from '@/types/editor.types';
import { cn } from '@/lib/utils';

interface EnhancedTextBlockProps {
    block: Block;
    onUpdate: (updates: Partial<Block>) => void;
    onTransform: (type: BlockType) => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => void;
    onFocus?: () => void;
    isFocused?: boolean;
    placeholder?: string;
    readOnly?: boolean;
}

const PLACEHOLDERS: Record<string, string> = {
    paragraph: "Type '/' for commands, or type to continue...",
    text: "Type '/' for commands, or type to continue...",
    heading1: 'Heading 1',
    heading2: 'Heading 2',
    heading3: 'Heading 3',
    bulletList: 'List',
    numberedList: 'List',
    todo: 'To-do',
    quote: 'Empty quote',
    callout: 'Type something...',
    toggle: 'Toggle',
    code: 'Paste or type code...',
};

export const EnhancedTextBlock: React.FC<EnhancedTextBlockProps> = ({
    block,
    onUpdate,
    onTransform,
    onKeyDown,
    onFocus,
    isFocused,
    placeholder,
    readOnly = false,
}) => {
    const inputRef = useRef<HTMLDivElement>(null);
    const [isEmpty, setIsEmpty] = useState(true);

    // Check content emptiness
    useEffect(() => {
        const content = block.content || '';
        const strippedContent = content.replace(/<[^>]*>/g, '').trim();
        setIsEmpty(!strippedContent);
    }, [block.content]);

    // Focus and cursor management
    useEffect(() => {
        if (isFocused && inputRef.current) {
            inputRef.current.focus();
            
            // Move cursor to end if content exists
            if (inputRef.current.childNodes.length > 0) {
                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(inputRef.current);
                range.collapse(false);
                selection?.removeAllRanges();
                selection?.addRange(range);
            }
        }
    }, [isFocused]);

    // Handle input with markdown shortcuts
    const handleInput = useCallback(() => {
        if (!inputRef.current) return;
        
        const html = inputRef.current.innerHTML;
        const textContent = inputRef.current.textContent || '';
        
        // Check for markdown shortcuts
        const shortcuts: { pattern: RegExp | string; type: BlockType; clear: boolean }[] = [
            { pattern: /^#\s$/, type: 'heading1', clear: true },
            { pattern: /^##\s$/, type: 'heading2', clear: true },
            { pattern: /^###\s$/, type: 'heading3', clear: true },
            { pattern: /^[-*]\s$/, type: 'bulletList', clear: true },
            { pattern: /^1\.\s$/, type: 'numberedList', clear: true },
            { pattern: /^\[\]\s$/, type: 'todo', clear: true },
            { pattern: /^>\s$/, type: 'quote', clear: true },
            { pattern: /^```$/, type: 'code', clear: true },
            { pattern: /^---$/, type: 'divider', clear: true },
        ];

        for (const { pattern, type, clear } of shortcuts) {
            if (typeof pattern === 'string' ? textContent === pattern : pattern.test(textContent)) {
                onTransform(type);
                if (clear) {
                    onUpdate({ content: '' });
                    if (inputRef.current) {
                        inputRef.current.innerHTML = '';
                    }
                }
                return;
            }
        }

        // Normal update
        onUpdate({ content: html });
        setIsEmpty(!textContent.trim());
    }, [onUpdate, onTransform]);

    const handleKeyDownInternal = useCallback((e: React.KeyboardEvent<HTMLElement>) => {
        // Let the parent handle shortcuts
        onKeyDown(e);
    }, [onKeyDown]);

    const resolvedPlaceholder = placeholder || PLACEHOLDERS[block.type] || "Type something...";

    // Get styles based on block type
    const getBlockStyles = () => {
        switch (block.type) {
            case 'heading1':
                return 'text-4xl font-bold tracking-tight';
            case 'heading2':
                return 'text-2xl font-semibold tracking-tight';
            case 'heading3':
                return 'text-xl font-medium';
            case 'quote':
                return 'text-lg italic text-muted-foreground';
            case 'code':
                return 'font-mono text-sm';
            default:
                return 'text-base leading-relaxed';
        }
    };

    return (
        <motion.div
            initial={false}
            animate={{ opacity: 1 }}
            className="relative w-full"
        >
            {/* Notion-style placeholder with smooth fade */}
            {isEmpty && !readOnly && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className={cn(
                        "absolute inset-0 pointer-events-none select-none text-muted-foreground/40",
                        getBlockStyles()
                    )}
                >
                    {resolvedPlaceholder}
                </motion.div>
            )}

            <div
                ref={inputRef}
                contentEditable={!readOnly}
                suppressContentEditableWarning
                onInput={handleInput}
                onKeyDown={handleKeyDownInternal}
                onFocus={onFocus}
                className={cn(
                    "w-full min-h-[1.5em] outline-none transition-colors",
                    "focus:outline-none",
                    "empty:before:content-[''] empty:before:text-muted-foreground/40",
                    getBlockStyles()
                )}
                dangerouslySetInnerHTML={{ __html: block.content }}
            />
        </motion.div>
    );
};