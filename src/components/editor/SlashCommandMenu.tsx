import React, { useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlashCommand } from '@/types/editor.types';
import { cn } from '@/lib/utils';
import {
    Type, Heading1, Heading2, Heading3, FileText, List,
    ListOrdered, CheckSquare, ChevronRight, Code, Quote,
    AlertCircle, Calculator, ChevronDown, Columns2, Columns3,
    Search, FileStack, Network, Table, Database, Bookmark,
    Image as ImageIcon, Video, Music, File, Link, Minus,
    Sparkles, Wand2, Highlighter
} from 'lucide-react';

interface SlashCommandMenuProps {
    isOpen: boolean;
    commands: SlashCommand[];
    selectedIndex: number;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onSelectCommand: (index: number) => void;
    onClose: () => void;
    position?: { x: number; y: number };
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    Type, Heading1, Heading2, Heading3, FileText, List,
    ListOrdered, CheckSquare, ChevronRight, Code, Quote,
    AlertCircle, Calculator, ChevronDown, Columns2, Columns3,
    FileStack, Network, Table, Database, Bookmark,
    ImageIcon, Video, Music, File, Link, Minus,
    Sparkles, Wand2, Highlighter
};

const categoryLabels: Record<string, string> = {
    basic: 'Basic blocks',
    text: 'Text',
    list: 'Lists',
    media: 'Media',
    advanced: 'Advanced',
    layout: 'Layout',
    database: 'Database',
    embed: 'Embeds',
};

const categoryOrder = ['basic', 'text', 'list', 'media', 'database', 'advanced', 'layout', 'embed'];

const MENU_WIDTH = 288; // w-72 = 18rem = 288px
const MENU_MAX_HEIGHT = 320; // max-h-[320px]

export const SlashCommandMenu: React.FC<SlashCommandMenuProps> = ({
    isOpen,
    commands,
    selectedIndex,
    searchQuery,
    onSearchChange,
    onSelectCommand,
    onClose,
    position,
}) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const selectedRef = useRef<HTMLButtonElement>(null);

    const menuPosition = useMemo(() => {
        if (!position) return { x: 0, y: 0 };
        const adjustedX = Math.max(10, Math.min(position.x, window.innerWidth - MENU_WIDTH - 10));
        const adjustedY = Math.max(10, Math.min(position.y, window.innerHeight - MENU_MAX_HEIGHT - 100));
        return { x: adjustedX, y: adjustedY };
    }, [position]);

    const groupedCommands = useMemo(() => {
        const groups: Record<string, SlashCommand[]> = {};
        commands.forEach((cmd) => {
            if (!groups[cmd.category]) groups[cmd.category] = [];
            groups[cmd.category].push(cmd);
        });
        // Sort by category order
        const sortedGroups: Record<string, SlashCommand[]> = {};
        categoryOrder.forEach(cat => {
            if (groups[cat]) sortedGroups[cat] = groups[cat];
        });
        // Add any remaining categories
        Object.keys(groups).forEach(cat => {
            if (!sortedGroups[cat]) sortedGroups[cat] = groups[cat];
        });
        return sortedGroups;
    }, [commands]);

    // Scroll selected item into view
    useEffect(() => {
        if (selectedRef.current) {
            selectedRef.current.scrollIntoView({ block: 'nearest' });
        }
    }, [selectedIndex]);

    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    // Handle ESC key
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                ref={menuRef}
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="fixed z-[100] w-72 bg-popover border border-border shadow-xl rounded-lg overflow-hidden"
                style={{
                    left: menuPosition.x,
                    top: menuPosition.y,
                }}
                data-slash-menu
            >
                {/* Search Header */}
                <div className="p-2 border-b border-border bg-muted/30">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                        <input
                            type="text"
                            placeholder="Type to search..."
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            autoFocus
                            className="w-full pl-8 pr-3 py-1.5 text-sm bg-background rounded-md border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 placeholder:text-muted-foreground/50 transition-all"
                        />
                    </div>
                </div>

                {/* Commands List */}
                <div className="max-h-[320px] overflow-y-auto py-1">
                    {commands.length === 0 ? (
                        <div className="px-3 py-8 text-center">
                            <p className="text-sm text-muted-foreground">No results</p>
                        </div>
                    ) : (
                        Object.entries(groupedCommands).map(([category, categoryCommands]) => (
                            <div key={category} className="mb-1">
                                {/* Category Header */}
                                <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                                    {categoryLabels[category] || category}
                                </div>

                                {/* Category Items */}
                                <div>
                                    {categoryCommands.map((command) => {
                                        const globalIndex = commands.indexOf(command);
                                        const isFocused = globalIndex === selectedIndex;
                                        const Icon = iconMap[command.icon] || Type;

                                        return (
                                            <button
                                                key={command.id}
                                                ref={isFocused ? selectedRef : null}
                                                onClick={() => onSelectCommand(globalIndex)}
                                                className={cn(
                                                    'w-full flex items-center gap-3 px-3 py-2 transition-colors duration-100 text-left',
                                                    isFocused
                                                        ? 'bg-accent text-accent-foreground'
                                                        : 'hover:bg-muted/50'
                                                )}
                                            >
                                                <div className={cn(
                                                    "flex items-center justify-center h-8 w-8 rounded-md shrink-0 border",
                                                    isFocused
                                                        ? "bg-primary/10 border-primary/20 text-primary"
                                                        : "bg-muted/50 border-border/50 text-muted-foreground"
                                                )}>
                                                    <Icon className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium leading-none mb-0.5">
                                                        {command.label}
                                                    </div>
                                                    {command.description && (
                                                        <div className="text-xs text-muted-foreground/70 truncate">
                                                            {command.description}
                                                        </div>
                                                    )}
                                                </div>
                                                {command.shortcut && (
                                                    <div className="flex items-center gap-1">
                                                        {command.shortcut.split('+').map((key, i) => (
                                                            <kbd key={i} className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono border border-border/50 text-muted-foreground/60 min-w-fit pointer-events-none select-none">
                                                                {key}
                                                            </kbd>
                                                        ))}
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="px-3 py-2 border-t border-border bg-muted/20 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60">
                        <kbd className="px-1.5 py-0.5 bg-muted rounded text-[9px] font-mono border border-border/50">↑↓</kbd>
                        <span>Navigate</span>
                        <kbd className="px-1.5 py-0.5 bg-muted rounded text-[9px] font-mono border border-border/50">↵</kbd>
                        <span>Select</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-[10px] text-muted-foreground/60 hover:text-muted-foreground flex items-center gap-1 transition-colors"
                    >
                        Close
                        <kbd className="px-1.5 py-0.5 bg-muted rounded text-[9px] font-mono border border-border/50">esc</kbd>
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
