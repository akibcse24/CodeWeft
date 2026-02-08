import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Block, BlockType } from '@/types/editor.types';
import { cn } from '@/lib/utils';

interface TextBlockProps {
    block: Block;
    onUpdate: (updates: Partial<Block>) => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLElement>) => void;
    onFocus?: () => void;
    onTransform?: (type: BlockType) => void;
    isFocused?: boolean;
    placeholder?: string;
    readOnly?: boolean;
}

const PLACEHOLDERS: Record<string, string> = {
    paragraph: "Type '/' for commands...",
    text: "Type '/' for commands...",
    heading1: 'Heading 1',
    heading2: 'Heading 2',
    heading3: 'Heading 3',
    bulletList: 'List item',
    numberedList: 'List item',
    todo: 'To-do',
    quote: 'Quote',
    callout: 'Type something...',
    toggle: 'Toggle',
};

export const TextBlock: React.FC<TextBlockProps> = ({
    block,
    onUpdate,
    onKeyDown,
    onFocus,
    onTransform,
    isFocused,
    placeholder,
    readOnly = false,
}) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const [isEmpty, setIsEmpty] = useState(!block.content);

    // Focus management
    useEffect(() => {
        if (isFocused && contentRef.current) {
            contentRef.current.focus();
            // Move cursor to end
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(contentRef.current);
            range.collapse(false);
            selection?.removeAllRanges();
            selection?.addRange(range);
        }
    }, [isFocused]);

    // Check if content is empty
    useEffect(() => {
        const content = block.content || '';
        const textContent = content.replace(/<[^>]*>/g, '').trim();
        setIsEmpty(!textContent);
    }, [block.content]);

    const handleInput = useCallback(() => {
        if (contentRef.current) {
            const html = contentRef.current.innerHTML;
            const textContent = contentRef.current.textContent || '';
            
            // Check for markdown shortcuts on input
            if (onTransform && textContent) {
                // Heading shortcuts
                if (textContent.startsWith('# ')) {
                    onTransform('heading1');
                    onUpdate({ content: textContent.slice(2) });
                    return;
                }
                if (textContent.startsWith('## ')) {
                    onTransform('heading2');
                    onUpdate({ content: textContent.slice(3) });
                    return;
                }
                if (textContent.startsWith('### ')) {
                    onTransform('heading3');
                    onUpdate({ content: textContent.slice(4) });
                    return;
                }
                // List shortcuts
                if (textContent.startsWith('- ') || textContent.startsWith('* ')) {
                    onTransform('bulletList');
                    onUpdate({ content: textContent.slice(2) });
                    return;
                }
                if (textContent.match(/^1\.\s/)) {
                    onTransform('numberedList');
                    onUpdate({ content: textContent.slice(3) });
                    return;
                }
                // Todo shortcut
                if (textContent.startsWith('[] ')) {
                    onTransform('todo');
                    onUpdate({ content: textContent.slice(3) });
                    return;
                }
                // Quote shortcut
                if (textContent.startsWith('> ')) {
                    onTransform('quote');
                    onUpdate({ content: textContent.slice(2) });
                    return;
                }
                // Code shortcut
                if (textContent.startsWith('``` ') || textContent === '```') {
                    onTransform('code');
                    onUpdate({ content: '' });
                    return;
                }
                // Divider shortcut
                if (textContent === '---' || textContent === '***') {
                    onTransform('divider');
                    onUpdate({ content: '' });
                    return;
                }
            }

            onUpdate({ content: html });
            setIsEmpty(!contentRef.current.textContent?.trim());
        }
    }, [onUpdate, onTransform]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
        // Pass to parent handler
        onKeyDown?.(e);
    }, [onKeyDown]);

    const resolvedPlaceholder = placeholder || PLACEHOLDERS[block.type] || "Type something...";

    // Get styles based on block type
    const getBlockStyles = () => {
        switch (block.type) {
            case 'heading1':
                return 'text-3xl font-bold';
            case 'heading2':
                return 'text-2xl font-semibold';
            case 'heading3':
                return 'text-xl font-medium';
            case 'quote':
                return 'text-lg italic text-muted-foreground';
            default:
                return 'text-base';
        }
    };

    return (
        <div className="relative w-full">
            {/* Notion-style placeholder */}
            {isEmpty && !readOnly && (
                <div 
                    className={cn(
                        "absolute left-0 top-0 pointer-events-none select-none text-muted-foreground/40",
                        getBlockStyles()
                    )}
                >
                    {resolvedPlaceholder}
                </div>
            )}
            
            <div
                ref={contentRef}
                contentEditable={!readOnly}
                suppressContentEditableWarning
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                onFocus={onFocus}
                className={cn(
                    "w-full min-h-[1.5em] outline-none",
                    "focus:outline-none",
                    getBlockStyles()
                )}
                dangerouslySetInnerHTML={{ __html: block.content }}
            />
        </div>
    );
};
