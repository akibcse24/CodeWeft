import React, { useRef, useEffect, useState } from 'react';
import { Block } from '@/types/editor.types';
import { cn } from '@/lib/utils';
import { Lightbulb, AlertTriangle, Info, Flame, Zap, Star } from 'lucide-react';

interface CalloutBlockProps {
    block: Block;
    onUpdate: (updates: Partial<Block>) => void;
    onFocus?: () => void;
    isFocused?: boolean;
}

const calloutIcons = {
    lightbulb: { icon: Lightbulb, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    warning: { icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    flame: { icon: Flame, color: 'text-red-500', bg: 'bg-red-500/10' },
    zap: { icon: Zap, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    star: { icon: Star, color: 'text-green-500', bg: 'bg-green-500/10' },
};

export const CalloutBlock: React.FC<CalloutBlockProps> = ({
    block,
    onUpdate,
    onFocus,
    isFocused,
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [showIconPicker, setShowIconPicker] = useState(false);
    const iconType = (block.metadata?.icon as keyof typeof calloutIcons) || 'lightbulb';
    const callout = calloutIcons[iconType];
    const Icon = callout.icon;

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

    const handleIconChange = (newIcon: keyof typeof calloutIcons) => {
        onUpdate({
            metadata: {
                ...block.metadata,
                icon: newIcon,
            },
        });
        setShowIconPicker(false);
    };

    return (
        <div className={cn('my-2 rounded-lg p-4', callout.bg)}>
            <div className="flex gap-3">
                {/* Icon Picker */}
                <div className="relative">
                    <button
                        onClick={() => setShowIconPicker(!showIconPicker)}
                        className={cn('p-1 rounded hover:bg-background/50 transition-colors', callout.color)}
                    >
                        <Icon className="h-5 w-5" />
                    </button>

                    {showIconPicker && (
                        <div className="absolute z-10 mt-2 p-2 bg-background border border-border rounded-lg shadow-lg flex gap-1">
                            {Object.entries(calloutIcons).map(([key, value]) => {
                                const IconOption = value.icon;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => handleIconChange(key as keyof typeof calloutIcons)}
                                        className={cn('p-2 rounded hover:bg-accent transition-colors', value.color)}
                                    >
                                        <IconOption className="h-4 w-4" />
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Content */}
                <textarea
                    ref={textareaRef}
                    value={block.content}
                    onChange={handleChange}
                    onFocus={onFocus}
                    placeholder="Callout text..."
                    className={cn(
                        'flex-1 resize-none bg-transparent border-0 focus:outline-none text-sm leading-relaxed',
                        'placeholder:text-muted-foreground',
                        isFocused && 'ring-0'
                    )}
                    rows={1}
                />
            </div>
        </div>
    );
};
