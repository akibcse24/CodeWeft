import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile, Image as ImageIcon, MessageSquare, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { EmojiPicker } from '@/components/editor/EmojiPicker';
import { useFocusMode } from '@/contexts/FocusContext';
import { SharePopover } from './SharePopover';

interface PageHeaderProps {
    title: string;
    icon: string | null;
    coverUrl: string | null | undefined;
    onTitleChange: (title: string) => void;
    onIconChange: (icon: string) => void;
    onCoverClick: () => void;
    onRemoveIcon: () => void;
    readOnly?: boolean;
    pageId?: string;
    isPublic?: boolean;
    onPublicChange?: (isPublic: boolean) => void;
}

export function PageHeader({
    title,
    icon,
    coverUrl,
    onTitleChange,
    onIconChange,
    onCoverClick,
    onRemoveIcon,
    readOnly = false,
    pageId,
    isPublic = false,
    onPublicChange
}: PageHeaderProps) {
    const [isHovering, setIsHovering] = useState(false);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const { isFocusMode, toggleFocusMode } = useFocusMode();

    // Sync contentEditable title
    useEffect(() => {
        if (titleRef.current && titleRef.current.innerText !== title) {
            titleRef.current.innerText = title;
        }
    }, [title]);

    const handleTitleBlur = () => {
        if (titleRef.current) {
            onTitleChange(titleRef.current.innerText);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            titleRef.current?.blur();
        }
    };

    return (
        <div
            className="relative group w-full mb-6"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {/* Focus Toggle & Share - Fixed Top Right */}
            <div className="absolute top-0 right-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                {pageId && onPublicChange && (
                    <SharePopover pageId={pageId} isPublic={isPublic} onPublicChange={onPublicChange} />
                )}
                <Button variant="ghost" size="icon" onClick={toggleFocusMode} className="text-muted-foreground hover:text-primary h-8 w-8">
                    {isFocusMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
            </div>

            {/* Page Icon - Overlapping if cover exists */}
            {icon && (
                <div className={cn(
                    "relative mb-3",
                    coverUrl ? "-mt-12 sm:-mt-16" : "mt-4"
                )}>
                    <EmojiPicker onSelect={onIconChange}>
                        <button className={cn(
                            "group/icon relative flex items-center justify-center rounded-xl transition-all",
                            coverUrl
                                ? "h-20 w-20 text-5xl md:h-24 md:w-24 md:text-6xl bg-background shadow-xl hover:bg-accent ring-4 ring-background"
                                : "h-16 w-16 text-5xl hover:bg-accent rounded-lg"
                        )}>
                            {icon}
                            {!readOnly && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 group-hover/icon:opacity-100 rounded-xl transition-opacity">
                                    <div className="bg-background/90 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm border text-[10px] font-semibold uppercase tracking-wider">
                                        Click to change
                                    </div>
                                </div>
                            )}
                        </button>
                    </EmojiPicker>
                </div>
            )}

            {/* Meta Actions - Add Icon / Add Cover / Add Comment */}
            <AnimatePresence>
                {!readOnly && isHovering && (!icon || !coverUrl) && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        transition={{ duration: 0.15 }}
                        className="flex items-center gap-1.5 mb-2"
                    >
                        {!icon && (
                            <EmojiPicker onSelect={onIconChange}>
                                <Button variant="ghost" size="sm" className="text-muted-foreground h-7 px-2 hover:bg-muted/50 text-xs font-medium">
                                    <Smile className="h-3.5 w-3.5 mr-1.5" />
                                    Add icon
                                </Button>
                            </EmojiPicker>
                        )}
                        {!coverUrl && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground h-7 px-2 hover:bg-muted/50 text-xs font-medium"
                                onClick={onCoverClick}
                            >
                                <ImageIcon className="h-3.5 w-3.5 mr-1.5" />
                                Add cover
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground h-7 px-2 hover:bg-muted/50 text-xs font-medium"
                            onClick={() => { /* TODO: Implement comment logic */ }}
                        >
                            <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                            Add comment
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Page Title */}
            <h1
                ref={titleRef}
                contentEditable={!readOnly}
                suppressContentEditableWarning
                onBlur={handleTitleBlur}
                onKeyDown={handleKeyDown}
                className={cn(
                    "text-4xl md:text-5xl font-bold outline-none leading-tight tracking-tight text-foreground",
                    !title && "text-muted-foreground/40"
                )}
                data-placeholder="Untitled"
            />
        </div>
    );
}
