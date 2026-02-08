import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { List, ChevronRight } from 'lucide-react';
import { Block } from '@/types/editor.types';
import { cn } from '@/lib/utils';

interface TableOfContentsProps {
    blocks: Block[];
    onNavigate?: (blockId: string) => void;
}

interface HeadingEntry {
    id: string;
    content: string;
    level: 1 | 2 | 3;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({
    blocks,
    onNavigate,
}) => {
    const headings = useMemo(() => {
        const extractHeadings = (blockList: Block[]): HeadingEntry[] => {
            const result: HeadingEntry[] = [];

            const processBlock = (block: Block) => {
                if (block.type === 'heading1' || block.type === 'toggleHeading1') {
                    result.push({ id: block.id, content: stripHtml(block.content), level: 1 });
                } else if (block.type === 'heading2' || block.type === 'toggleHeading2') {
                    result.push({ id: block.id, content: stripHtml(block.content), level: 2 });
                } else if (block.type === 'heading3' || block.type === 'toggleHeading3') {
                    result.push({ id: block.id, content: stripHtml(block.content), level: 3 });
                }

                if (block.children) {
                    block.children.forEach(processBlock);
                }
            };

            blockList.forEach(processBlock);
            return result;
        };

        return extractHeadings(blocks);
    }, [blocks]);

    const handleClick = (id: string) => {
        if (onNavigate) {
            onNavigate(id);
        }
        // Scroll to block
        const element = document.querySelector(`[data-block-id="${id}"]`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Highlight effect
            element.classList.add('ring-2', 'ring-primary/50');
            setTimeout(() => {
                element.classList.remove('ring-2', 'ring-primary/50');
            }, 2000);
        }
    };

    if (headings.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-muted/30 border border-border/40"
            >
                <div className="flex items-center gap-2 text-muted-foreground">
                    <List className="h-4 w-4" />
                    <span className="text-sm font-medium">Table of Contents</span>
                </div>
                <p className="text-xs text-muted-foreground/60 mt-2 italic">
                    Add headings to your page to generate a table of contents.
                </p>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-muted/20 border border-border/30 backdrop-blur-sm"
        >
            <div className="flex items-center gap-2 text-foreground mb-3">
                <List className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold tracking-tight">Table of Contents</span>
            </div>

            <nav className="space-y-1">
                <AnimatePresence>
                    {headings.map((heading, index) => (
                        <motion.button
                            key={heading.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => handleClick(heading.id)}
                            className={cn(
                                "w-full text-left px-2 py-1.5 rounded-lg transition-all duration-200",
                                "hover:bg-primary/10 hover:text-primary group flex items-center gap-2",
                                heading.level === 1 && "font-semibold text-sm",
                                heading.level === 2 && "font-medium text-sm pl-4",
                                heading.level === 3 && "font-normal text-xs pl-6 text-muted-foreground"
                            )}
                        >
                            <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                            <span className="truncate">
                                {heading.content || 'Untitled'}
                            </span>
                        </motion.button>
                    ))}
                </AnimatePresence>
            </nav>
        </motion.div>
    );
};

// Helper to strip HTML tags from content
function stripHtml(html: string): string {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
}
