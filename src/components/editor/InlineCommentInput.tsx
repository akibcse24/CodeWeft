import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Paperclip, AtSign, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface InlineCommentInputProps {
    isOpen: boolean;
    position: { x: number; y: number };
    onSubmit: (comment: string) => void;
    onClose: () => void;
}

export function InlineCommentInput({
    isOpen,
    position,
    onSubmit,
    onClose
}: InlineCommentInputProps) {
    const [comment, setComment] = useState('');
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSubmit = () => {
        if (comment.trim()) {
            onSubmit(comment.trim());
            setComment('');
            onClose();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
        if (e.key === 'Escape') {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                className="fixed z-[200] w-72"
                style={{
                    left: position.x,
                    top: position.y,
                }}
            >
                <div className="bg-popover border border-border rounded-lg shadow-xl overflow-hidden">
                    {/* Comment Input */}
                    <div className="p-3">
                        <textarea
                            ref={inputRef}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Add a comment..."
                            rows={2}
                            className={cn(
                                "w-full resize-none bg-transparent border-0 focus:outline-none text-sm",
                                "placeholder:text-muted-foreground/50"
                            )}
                        />
                    </div>

                    {/* Actions Footer */}
                    <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-muted/30">
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                title="Attach file"
                            >
                                <Paperclip className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                title="Mention someone"
                            >
                                <AtSign className="h-3.5 w-3.5" />
                            </Button>
                        </div>

                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={onClose}
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                className="h-7 px-3 text-xs"
                                onClick={handleSubmit}
                                disabled={!comment.trim()}
                            >
                                <Send className="h-3 w-3 mr-1" />
                                Send
                            </Button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
