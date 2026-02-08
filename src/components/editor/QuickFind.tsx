import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, Clock, Star, Plus, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
} from '@/components/ui/dialog';

interface Page {
    id: string;
    title: string;
    icon?: string | null;
    updated_at: string;
    is_favorite?: boolean | null;
    tags?: string[] | null;
}

interface QuickFindProps {
    isOpen: boolean;
    onClose: () => void;
    pages: Page[];
    onSelectPage: (pageId: string) => void;
    onCreatePage?: (title: string) => void;
    recentPageIds?: string[];
}

export const QuickFind: React.FC<QuickFindProps> = ({
    isOpen,
    onClose,
    pages,
    onSelectPage,
    onCreatePage,
    recentPageIds = [],
}) => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
        }
    }, [isOpen]);

    const filteredPages = useMemo(() => {
        if (!query.trim()) {
            // Show recent pages first, then favorites
            const recent = recentPageIds
                .map(id => pages.find(p => p.id === id))
                .filter(Boolean) as Page[];
            const favorites = pages.filter(p => p.is_favorite && !recentPageIds.includes(p.id));
            const others = pages.filter(p => !p.is_favorite && !recentPageIds.includes(p.id)).slice(0, 5);
            return [...recent, ...favorites, ...others].slice(0, 10);
        }

        const searchLower = query.toLowerCase();
        return pages
            .filter(p =>
                p.title.toLowerCase().includes(searchLower) ||
                (p.tags || []).some(tag => tag.toLowerCase().includes(searchLower))
            )
            .sort((a, b) => {
                // Prioritize title matches
                const aStartsWith = a.title.toLowerCase().startsWith(searchLower);
                const bStartsWith = b.title.toLowerCase().startsWith(searchLower);
                if (aStartsWith && !bStartsWith) return -1;
                if (!aStartsWith && bStartsWith) return 1;
                return 0;
            })
            .slice(0, 10);
    }, [query, pages, recentPageIds]);

    const showCreateOption = query.trim() && !filteredPages.some(p =>
        p.title.toLowerCase() === query.toLowerCase()
    );

    const totalItems = filteredPages.length + (showCreateOption ? 1 : 0);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, totalItems - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (showCreateOption && selectedIndex === filteredPages.length) {
                    onCreatePage?.(query);
                    onClose();
                } else if (filteredPages[selectedIndex]) {
                    onSelectPage(filteredPages[selectedIndex].id);
                    onClose();
                }
                break;
            case 'Escape':
                onClose();
                break;
        }
    }, [filteredPages, selectedIndex, showCreateOption, query, onCreatePage, onSelectPage, onClose, totalItems]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-xl p-0 gap-0 overflow-hidden bg-background/95 backdrop-blur-xl border-border/40">
                <div className="p-4 border-b border-border/40">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setSelectedIndex(0);
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder="Search pages or type to create..."
                            autoFocus
                            className="w-full pl-10 pr-4 py-2.5 bg-muted/40 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                        />
                    </div>
                </div>

                <div className="max-h-[400px] overflow-y-auto p-2">
                    {!query.trim() && (
                        <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                            Recent & Favorites
                        </div>
                    )}

                    <AnimatePresence mode="popLayout">
                        {filteredPages.map((page, index) => (
                            <motion.button
                                key={page.id}
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                transition={{ delay: index * 0.02 }}
                                onClick={() => {
                                    onSelectPage(page.id);
                                    onClose();
                                }}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left",
                                    selectedIndex === index
                                        ? "bg-primary/10 ring-1 ring-primary/20"
                                        : "hover:bg-muted/50"
                                )}
                            >
                                <span className="text-lg">{page.icon || '📄'}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium truncate">{page.title}</div>
                                    {page.tags && page.tags.length > 0 && (
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <Hash className="h-3 w-3 text-muted-foreground/50" />
                                            <span className="text-xs text-muted-foreground/50 truncate">
                                                {page.tags.slice(0, 3).join(', ')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                {recentPageIds.includes(page.id) && (
                                    <Clock className="h-3.5 w-3.5 text-muted-foreground/40" />
                                )}
                                {page.is_favorite && (
                                    <Star className="h-3.5 w-3.5 text-warning fill-warning" />
                                )}
                            </motion.button>
                        ))}

                        {showCreateOption && onCreatePage && (
                            <motion.button
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={() => {
                                    onCreatePage(query);
                                    onClose();
                                }}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left",
                                    selectedIndex === filteredPages.length
                                        ? "bg-primary/10 ring-1 ring-primary/20"
                                        : "hover:bg-muted/50"
                                )}
                            >
                                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Plus className="h-4 w-4 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-medium">Create "{query}"</div>
                                    <div className="text-xs text-muted-foreground">New page</div>
                                </div>
                            </motion.button>
                        )}
                    </AnimatePresence>

                    {filteredPages.length === 0 && !showCreateOption && (
                        <div className="px-3 py-8 text-center">
                            <FileText className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                            <p className="text-sm text-muted-foreground">No pages found</p>
                        </div>
                    )}
                </div>

                <div className="px-4 py-2.5 border-t border-border/40 bg-muted/20 flex items-center justify-between text-[10px] text-muted-foreground/50">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                            <kbd className="px-1 py-0.5 bg-muted/60 rounded">↑↓</kbd>
                            Navigate
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1 py-0.5 bg-muted/60 rounded">↵</kbd>
                            Open
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1 py-0.5 bg-muted/60 rounded">esc</kbd>
                            Close
                        </span>
                    </div>
                    <span className="font-bold uppercase tracking-wider">Quick Find</span>
                </div>
            </DialogContent>
        </Dialog>
    );
};
