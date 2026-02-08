import React, { useRef, useEffect } from 'react';
import { Block } from '@/types/editor.types';
import { cn } from '@/lib/utils';
import { CheckSquare, Square } from 'lucide-react';

interface TodoBlockProps {
    block: Block;
    onUpdate: (updates: Partial<Block>) => void;
    onFocus?: () => void;
    isFocused?: boolean;
}

export const TodoBlock: React.FC<TodoBlockProps> = ({
    block,
    onUpdate,
    onFocus,
    isFocused,
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const isChecked = block.metadata?.checked || false;

    useEffect(() => {
        if (isFocused && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isFocused]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdate({ content: e.target.value });
    };

    const toggleChecked = () => {
        onUpdate({
            metadata: {
                ...block.metadata,
                checked: !isChecked,
            },
        });
    };

    return (
        <div className="flex items-start gap-3 py-1">
            <button
                onClick={toggleChecked}
                className="p-0.5 hover:bg-accent rounded transition-colors mt-1"
            >
                {isChecked ? (
                    <CheckSquare className="h-5 w-5 text-primary" />
                ) : (
                    <Square className="h-5 w-5 text-muted-foreground" />
                )}
            </button>
            <input
                ref={inputRef}
                type="text"
                value={block.content}
                onChange={handleChange}
                onFocus={onFocus}
                placeholder="To-do"
                className={cn(
                    'flex-1 bg-transparent border-0 focus:outline-none text-sm',
                    'placeholder:text-muted-foreground',
                    isChecked && 'line-through text-muted-foreground',
                    isFocused && 'ring-0'
                )}
            />
        </div>
    );
};
