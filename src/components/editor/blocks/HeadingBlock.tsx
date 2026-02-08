import React, { useRef, useEffect } from 'react';
import { Block } from '@/types/editor.types';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface HeadingBlockProps {
    block: Block;
    onUpdate: (updates: Partial<Block>) => void;
    onFocus?: () => void;
    isFocused?: boolean;
}

export const HeadingBlock: React.FC<HeadingBlockProps> = ({
    block,
    onUpdate,
    onFocus,
    isFocused,
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const level = block.metadata?.level || (block.type === 'heading1' ? 1 : block.type === 'heading2' ? 2 : 3);
    const isToggleable = block.metadata?.toggleable || false;
    const isCollapsed = block.metadata?.collapsed || false;

    useEffect(() => {
        if (isFocused && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isFocused]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdate({ content: e.target.value });
    };

    const toggleCollapse = () => {
        if (isToggleable) {
            onUpdate({
                metadata: {
                    ...block.metadata,
                    collapsed: !isCollapsed,
                },
            });
        }
    };

    const headingClasses = {
        1: 'text-3xl font-bold',
        2: 'text-2xl font-bold',
        3: 'text-xl font-semibold',
    };

    return (
        <div className="flex items-center gap-2">
            {isToggleable && (
                <button
                    onClick={toggleCollapse}
                    className="p-1 hover:bg-accent rounded transition-colors"
                >
                    {isCollapsed ? (
                        <ChevronRight className="h-4 w-4" />
                    ) : (
                        <ChevronDown className="h-4 w-4" />
                    )}
                </button>
            )}
            <input
                ref={inputRef}
                type="text"
                value={block.content}
                onChange={handleChange}
                onFocus={onFocus}
                placeholder={`Heading ${level}`}
                className={cn(
                    'flex-1 bg-transparent border-0 focus:outline-none',
                    headingClasses[level as 1 | 2 | 3],
                    'placeholder:text-muted-foreground',
                    isFocused && 'ring-0'
                )}
            />
        </div>
    );
};
