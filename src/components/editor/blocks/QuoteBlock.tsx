import React, { useRef, useEffect } from 'react';
import { Block } from '@/types/editor.types';
import { cn } from '@/lib/utils';
import { Quote as QuoteIcon } from 'lucide-react';

interface QuoteBlockProps {
    block: Block;
    onUpdate: (updates: Partial<Block>) => void;
    onFocus?: () => void;
    isFocused?: boolean;
}

export const QuoteBlock: React.FC<QuoteBlockProps> = ({
    block,
    onUpdate,
    onFocus,
    isFocused,
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isFocused && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [isFocused]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [block.content]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onUpdate({ content: e.target.value });
    };

    return (
        <div className="my-2 pl-4 border-l-4 border-primary/50 bg-muted/30 rounded-r-lg">
            <div className="flex gap-3 p-4">
                <QuoteIcon className="h-5 w-5 text-primary/70 flex-shrink-0 mt-1" />
                <textarea
                    ref={textareaRef}
                    value={block.content}
                    onChange={handleChange}
                    onFocus={onFocus}
                    placeholder="Enter a quote..."
                    className={cn(
                        'flex-1 resize-none bg-transparent border-0 focus:outline-none text-sm italic leading-relaxed',
                        'placeholder:text-muted-foreground',
                        isFocused && 'ring-0'
                    )}
                    rows={1}
                />
            </div>
        </div>
    );
};
