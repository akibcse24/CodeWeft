import React, { useState } from 'react';
import { Block } from '@/types/editor.types';
import { Bookmark, ExternalLink, Loader2, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface BookmarkBlockProps {
    block: Block;
    onUpdate: (updates: Partial<Block>) => void;
    onFocus?: () => void;
    isFocused?: boolean;
}

export const BookmarkBlock: React.FC<BookmarkBlockProps> = ({
    block,
    onUpdate,
    onFocus,
    isFocused,
}) => {
    const [url, setUrl] = useState(block.metadata?.url as string || '');
    const [isLoading, setIsLoading] = useState(false);
    const title = block.metadata?.title as string;
    const description = block.metadata?.description as string;
    const icon = block.metadata?.icon as string;
    const cover = block.metadata?.cover as string;

    const handleFetchMetadata = async () => {
        if (!url) return;
        setIsLoading(true);
        // In a real app, you'd fetch this via a proxy server to avoid CORS
        // For now, we simulate success for the demo experience
        setTimeout(() => {
            onUpdate({
                metadata: {
                    ...block.metadata,
                    url,
                    title: url.replace('https://', '').split('/')[0],
                    description: 'Interactive web content and documentation for elite developers.',
                    icon: `https://www.google.com/s2/favicons?domain=${url}&sz=64`,
                }
            });
            setIsLoading(false);
        }, 1000);
    };

    if (!title && !isLoading) {
        return (
            <div className="my-2 p-1" onFocus={onFocus}>
                <div className="flex gap-2">
                    <Input
                        placeholder="Paste web link here..."
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleFetchMetadata()}
                        className="flex-1 h-9"
                    />
                    <Button size="sm" onClick={handleFetchMetadata}>
                        Create Bookmark
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="my-4 group relative" onFocus={onFocus}>
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex border border-border/50 rounded-lg overflow-hidden hover:bg-muted/30 transition-all group/link"
            >
                <div className="flex-1 p-4 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        {icon ? (
                            <img src={icon} alt="" className="h-4 w-4 rounded" />
                        ) : (
                            <Globe className="h-4 w-4 text-muted-foreground" />
                        )}
                        <h4 className="font-semibold text-sm truncate group-hover/link:text-primary transition-colors">
                            {title || url}
                        </h4>
                    </div>
                    {description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {description}
                        </p>
                    )}
                    <div className="flex items-center gap-2 mt-3 text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
                        <span className="truncate">{url}</span>
                    </div>
                </div>
                {cover && (
                    <div className="w-32 sm:w-48 bg-muted relative overflow-hidden hidden sm:block">
                        <img src={cover} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    </div>
                )}
            </a>
            {isLoading && (
                <div className="absolute inset-0 bg-background/50 flex items-center justify-center backdrop-blur-[1px]">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
            )}
        </div>
    );
};
