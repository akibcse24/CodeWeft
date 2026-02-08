import React, { useRef, useEffect } from 'react';
import { Block } from '@/types/editor.types';
import { cn } from '@/lib/utils';
import { Circle } from 'lucide-react';

interface ListBlockProps {
    block: Block;
    onUpdate: (updates: Partial<Block>) => void;
    onFocus?: () => void;
    isFocused?: boolean;
    index?: number;
}

export const ListBlock: React.FC<ListBlockProps> = ({
    block,
    onUpdate,
    onFocus,
    isFocused,
    index = 0,
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const isNumbered = block.type === 'numbered-list';

    useEffect(() => {
        if (isFocused && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isFocused]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdate({ content: e.target.value });
    };

    return (
        <div className="flex items-start gap-3 py-1">
            <div className="mt-2">
                {isNumbered ? (
                    <span className="text-sm text-muted-foreground font-medium">
                        {index + 1}.
                    </span>
                ) : (
                    <Circle className="h-2 w-2 fill-current text-muted-foreground" />
                )}
            </div>
            <input
                ref={inputRef}
                type="text"
                value={block.content}
                onChange={handleChange}
                onFocus={onFocus}
                placeholder="List item"
                className={cn(
                    'flex-1 bg-transparent border-0 focus:outline-none text-sm',
                    'placeholder:text-muted-foreground',
                    isFocused && 'ring-0'
                )}
            />
        </div>
    );
};
