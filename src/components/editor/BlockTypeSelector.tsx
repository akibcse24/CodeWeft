import React, { useEffect } from 'react';
import { BlockType } from '@/types/editor.types';
import { cn } from '@/lib/utils';
import {
    Type,
    Heading1,
    Heading2,
    Heading3,
    FileText,
    List,
    CheckSquare,
    ChevronRight,
    Code,
    Quote,
    AlertCircle,
    Calculator,
    ListOrdered,
    Columns2,
    Columns3,
    Table,
    Database,
    Bookmark,
} from 'lucide-react';

interface BlockTypeSelectorProps {
    isOpen: boolean;
    onSelectType: (type: BlockType) => void;
    onClose: () => void;
    position?: { x: number; y: number };
}

interface BlockTypeOption {
    type: BlockType;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    category: string;
}

const blockTypes: BlockTypeOption[] = [
    // Text
    {
        type: 'text',
        label: 'Text',
        description: 'Plain text',
        icon: Type,
        category: 'Basic',
    },
    {
        type: 'heading1',
        label: 'Heading 1',
        description: 'Big heading',
        icon: Heading1,
        category: 'Headings',
    },
    {
        type: 'heading2',
        label: 'Heading 2',
        description: 'Medium heading',
        icon: Heading2,
        category: 'Headings',
    },
    {
        type: 'heading3',
        label: 'Heading 3',
        description: 'Small heading',
        icon: Heading3,
        category: 'Headings',
    },
    // Page
    {
        type: 'page',
        label: 'Page',
        description: 'Embed a sub-page',
        icon: FileText,
        category: 'Basic',
    },
    // Lists
    {
        type: 'bulleted-list',
        label: 'Bulleted list',
        description: 'Simple list',
        icon: List,
        category: 'Lists',
    },
    {
        type: 'numbered-list',
        label: 'Numbered list',
        description: 'Ordered list',
        icon: ListOrdered,
        category: 'Lists',
    },
    {
        type: 'todo',
        label: 'To-do list',
        description: 'Task checklist',
        icon: CheckSquare,
        category: 'Lists',
    },
    {
        type: 'toggle',
        label: 'Toggle list',
        description: 'Collapsible section',
        icon: ChevronRight,
        category: 'Lists',
    },
    // Media
    {
        type: 'code',
        label: 'Code',
        description: 'Code snippet',
        icon: Code,
        category: 'Media',
    },
    {
        type: 'quote',
        label: 'Quote',
        description: 'Blockquote',
        icon: Quote,
        category: 'Media',
    },
    {
        type: 'callout',
        label: 'Callout',
        description: 'Highlighted text',
        icon: AlertCircle,
        category: 'Media',
    },
    // Advanced
    {
        type: 'equation',
        label: 'Block equation',
        description: 'Math formula',
        icon: Calculator,
        category: 'Advanced',
    },
    // Layout
    {
        type: 'columns-2',
        label: '2 columns',
        description: 'Two column layout',
        icon: Columns2,
        category: 'Layout',
    },
    {
        type: 'columns-3',
        label: '3 columns',
        description: 'Three column layout',
        icon: Columns3,
        category: 'Layout',
    },
    {
        type: 'table',
        label: 'Table',
        description: 'Simple table',
        icon: Table,
        category: 'Database',
    },
    {
        type: 'database-view',
        label: 'Database view',
        description: 'Show data from a database',
        icon: Database,
        category: 'Database',
    },
    {
        type: 'bookmark',
        label: 'Bookmark',
        description: 'Save a web link',
        icon: Bookmark,
        category: 'Media',
    },
    {
        type: 'file',
        label: 'File',
        description: 'Upload a file',
        icon: FileText,
        category: 'Media',
    },
];

export const BlockTypeSelector: React.FC<BlockTypeSelectorProps> = ({
    isOpen,
    onSelectType,
    onClose,
    position,
}) => {
    // Group by category
    const groupedTypes = React.useMemo(() => {
        const groups: Record<string, BlockTypeOption[]> = {};
        blockTypes.forEach((type) => {
            if (!groups[type.category]) {
                groups[type.category] = [];
            }
            groups[type.category].push(type);
        });
        return groups;
    }, []);

    // Click outside to close
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('[data-block-type-selector]')) {
                onClose();
            }
        };

        setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
        }, 0);

        return () => document.removeEventListener('click', handleClickOutside);
    }, [isOpen, onClose]);

    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            data-block-type-selector
            className="fixed z-50 w-96 rounded-lg border border-border/50 bg-background/95 backdrop-blur-sm shadow-xl animate-in fade-in slide-in-from-top-2 duration-200"
            style={{
                left: position?.x || 0,
                top: position?.y || 0,
            }}
        >
            {/* Header */}
            <div className="p-3 border-b border-border/50">
                <h3 className="text-sm font-semibold">Turn into</h3>
            </div>

            {/* Content */}
            <div className="max-h-[500px] overflow-y-auto p-2">
                {Object.entries(groupedTypes).map(([category, types]) => (
                    <div key={category} className="mb-4 last:mb-0">
                        {/* Category Header */}
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            {category}
                        </div>

                        {/* Type Grid */}
                        <div className="grid grid-cols-2 gap-1.5 mt-1">
                            {types.map((option) => {
                                const Icon = option.icon;
                                return (
                                    <button
                                        key={option.type}
                                        onClick={() => {
                                            onSelectType(option.type);
                                            onClose();
                                        }}
                                        className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-accent/50 transition-all text-left group"
                                    >
                                        <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors mt-0.5" />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium group-hover:text-primary transition-colors">
                                                {option.label}
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-0.5">
                                                {option.description}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-border/50 text-xs text-muted-foreground">
                <kbd className="px-1 py-0.5 bg-muted rounded">Esc</kbd> to close
            </div>
        </div>
    );
};
