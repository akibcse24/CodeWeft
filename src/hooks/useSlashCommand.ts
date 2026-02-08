import { useState, useCallback, useEffect, useRef } from 'react';
import { SlashCommand, BlockType } from '@/types/editor.types';
import { BLOCK_TEMPLATES } from '@/data/templates';
import {
    Type,
    Heading1,
    Heading2,
    Heading3,
    FileText,
    List,
    ListOrdered,
    CheckSquare,
    ChevronRight,
    Code,
    Quote,
    AlertCircle,
    Calculator,
    Link2,
    ChevronDown,
    Columns2,
    Columns3,
    FileStack,
    Network,
    Table,
    Database,
    Bookmark,
    Sparkles,
    Image as ImageIcon,
    Video,
    Music,
    Minus,
} from 'lucide-react';

interface UseSlashCommandOptions {
    onCommand: (command: SlashCommand, blockId: string) => void;
    triggerChar?: string;
}

export const useSlashCommand = ({
    onCommand,
    triggerChar = '/',
}: UseSlashCommandOptions) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [currentBlockId, setCurrentBlockId] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Get all available slash commands
    const getCommands = useCallback((blockId: string): SlashCommand[] => {
        return [
            // Basic text
            {
                id: 'text',
                label: 'Text',
                description: 'Just start writing with plain text',
                icon: 'Type',
                keywords: ['text', 'paragraph', 'p'],
                category: 'basic',
                action: () => onCommand({ id: 'text' } as SlashCommand, blockId),
            },
            // Headings
            {
                id: 'heading1',
                label: 'Heading 1',
                description: 'Big section heading',
                icon: 'Heading1',
                keywords: ['heading', 'h1', 'title'],
                category: 'text',
                action: () => onCommand({ id: 'heading1' } as SlashCommand, blockId),
            },
            {
                id: 'heading2',
                label: 'Heading 2',
                description: 'Medium section heading',
                icon: 'Heading2',
                keywords: ['heading', 'h2', 'subtitle'],
                category: 'text',
                action: () => onCommand({ id: 'heading2' } as SlashCommand, blockId),
            },
            {
                id: 'heading3',
                label: 'Heading 3',
                description: 'Small section heading',
                icon: 'Heading3',
                keywords: ['heading', 'h3'],
                category: 'text',
                action: () => onCommand({ id: 'heading3' } as SlashCommand, blockId),
            },
            // Page
            {
                id: 'page',
                label: 'Page',
                description: 'Embed a sub-page inside this page',
                icon: 'FileText',
                keywords: ['page', 'subpage', 'embed'],
                category: 'basic',
                action: () => onCommand({ id: 'page' } as SlashCommand, blockId),
            },
            // Lists
            {
                id: 'bulleted-list',
                label: 'Bulleted list',
                description: 'Create a simple bulleted list',
                icon: 'List',
                keywords: ['list', 'bullet', 'ul'],
                category: 'list',
                action: () => onCommand({ id: 'bulleted-list' } as SlashCommand, blockId),
            },
            {
                id: 'numbered-list',
                label: 'Numbered list',
                description: 'Create a list with numbering',
                icon: 'ListOrdered',
                keywords: ['list', 'number', 'ol', 'ordered'],
                category: 'list',
                action: () => onCommand({ id: 'numbered-list' } as SlashCommand, blockId),
            },
            {
                id: 'todo',
                label: 'To-do list',
                description: 'Track tasks with a to-do list',
                icon: 'CheckSquare',
                keywords: ['todo', 'task', 'checkbox', 'check'],
                category: 'list',
                action: () => onCommand({ id: 'todo' } as SlashCommand, blockId),
            },
            {
                id: 'toggle',
                label: 'Toggle list',
                description: 'Toggles can hide and show content inside',
                icon: 'ChevronRight',
                keywords: ['toggle', 'collapse', 'accordion'],
                category: 'list',
                action: () => onCommand({ id: 'toggle' } as SlashCommand, blockId),
            },
            // Media
            {
                id: 'image',
                label: 'Image',
                description: 'Upload or embed an image',
                icon: 'ImageIcon',
                keywords: ['image', 'picture', 'photo', 'img'],
                category: 'media',
                action: () => onCommand({ id: 'image' } as SlashCommand, blockId),
            },
            {
                id: 'video',
                label: 'Video',
                description: 'Embed a video from URL',
                icon: 'Video',
                keywords: ['video', 'youtube', 'vimeo', 'mp4'],
                category: 'media',
                action: () => onCommand({ id: 'video' } as SlashCommand, blockId),
            },
            {
                id: 'audio',
                label: 'Audio',
                description: 'Embed audio file or podcast',
                icon: 'Music',
                keywords: ['audio', 'music', 'sound', 'mp3', 'podcast'],
                category: 'media',
                action: () => onCommand({ id: 'audio' } as SlashCommand, blockId),
            },
            {
                id: 'code',
                label: 'Code',
                description: 'Capture a code snippet',
                icon: 'Code',
                keywords: ['code', 'snippet', 'programming'],
                category: 'media',
                action: () => onCommand({ id: 'code' } as SlashCommand, blockId),
            },
            {
                id: 'quote',
                label: 'Quote',
                description: 'Capture a quote',
                icon: 'Quote',
                keywords: ['quote', 'blockquote', 'citation'],
                category: 'advanced',
                action: () => onCommand({ id: 'quote' } as SlashCommand, blockId),
            },
            {
                id: 'callout',
                label: 'Callout',
                description: 'Make writing stand out',
                icon: 'AlertCircle',
                keywords: ['callout', 'alert', 'note', 'info'],
                category: 'advanced',
                action: () => onCommand({ id: 'callout' } as SlashCommand, blockId),
            },
            // Advanced
            {
                id: 'equation',
                label: 'Block equation',
                description: 'Display a standalone math equation',
                icon: 'Calculator',
                keywords: ['math', 'equation', 'formula', 'latex'],
                category: 'advanced',
                action: () => onCommand({ id: 'equation' } as SlashCommand, blockId),
            },
            // Layout
            {
                id: 'toggle-heading-1',
                label: 'Toggle heading 1',
                description: 'Heading 1 that can be collapsed',
                icon: 'ChevronDown',
                keywords: ['toggle', 'heading', 'h1', 'collapse'],
                category: 'layout',
                action: () => onCommand({ id: 'toggle-heading-1' } as SlashCommand, blockId),
            },
            {
                id: 'toggle-heading-2',
                label: 'Toggle heading 2',
                description: 'Heading 2 that can be collapsed',
                icon: 'ChevronDown',
                keywords: ['toggle', 'heading', 'h2', 'collapse'],
                category: 'layout',
                action: () => onCommand({ id: 'toggle-heading-2' } as SlashCommand, blockId),
            },
            {
                id: 'toggle-heading-3',
                label: 'Toggle heading 3',
                description: 'Heading 3 that can be collapsed',
                icon: 'ChevronDown',
                keywords: ['toggle', 'heading', 'h3', 'collapse'],
                category: 'layout',
                action: () => onCommand({ id: 'toggle-heading-3' } as SlashCommand, blockId),
            },
            {
                id: 'columns-2',
                label: '2 columns',
                description: 'Create a 2-column layout',
                icon: 'Columns2',
                keywords: ['columns', 'layout', '2', 'two'],
                category: 'layout',
                action: () => onCommand({ id: 'columns-2' } as SlashCommand, blockId),
            },
            {
                id: 'columns-3',
                label: '3 columns',
                description: 'Create a 3-column layout',
                icon: 'Columns3',
                keywords: ['columns', 'layout', '3', 'three'],
                category: 'layout',
                action: () => onCommand({ id: 'columns-3' } as SlashCommand, blockId),
            },
            // Diagram
            {
                id: 'diagram',
                label: 'Diagram',
                description: 'Create flowcharts, sequence diagrams with Mermaid',
                icon: 'Network',
                keywords: ['diagram', 'flowchart', 'mermaid', 'chart', 'graph'],
                category: 'media',
                action: () => onCommand({ id: 'diagram' } as SlashCommand, blockId),
            },
            // Database
            {
                id: 'table',
                label: 'Table',
                description: 'Add a simple table to your page',
                icon: 'Table',
                keywords: ['table', 'grid', 'data'],
                category: 'database',
                action: () => onCommand({ id: 'table' } as SlashCommand, blockId),
            },
            {
                id: 'database-view',
                label: 'Database view',
                description: 'Show data from a database',
                icon: 'Database',
                keywords: ['database', 'view', 'linked', 'data'],
                category: 'database',
                action: () => onCommand({ id: 'database-view' } as SlashCommand, blockId),
            },
            // More Media
            {
                id: 'bookmark',
                label: 'Web bookmark',
                description: 'Save a link with a visual preview',
                icon: 'Bookmark',
                keywords: ['link', 'bookmark', 'url', 'web'],
                category: 'media',
                action: () => onCommand({ id: 'bookmark' } as SlashCommand, blockId),
            },
            // Table of Contents
            {
                id: 'toc',
                label: 'Table of Contents',
                description: 'Auto-generated from headings',
                icon: 'List',
                keywords: ['toc', 'table', 'contents', 'navigation', 'outline'],
                category: 'advanced',
                action: () => onCommand({ id: 'toc' } as SlashCommand, blockId),
            },
            // Embed
            {
                id: 'embed',
                label: 'Embed',
                description: 'Embed YouTube, Figma, CodePen and more',
                icon: 'Code',
                keywords: ['embed', 'youtube', 'video', 'figma', 'iframe'],
                category: 'media',
                action: () => onCommand({ id: 'embed' } as SlashCommand, blockId),
            },
            {
                id: 'file',
                label: 'File',
                description: 'Upload or embed a file',
                icon: 'FileText',
                keywords: ['file', 'upload', 'pdf', 'asset'],
                category: 'media',
                action: () => onCommand({ id: 'file' } as SlashCommand, blockId),
            },
            // Button
            {
                id: 'button',
                label: 'Button',
                description: 'Interactive button with actions',
                icon: 'MousePointer',
                keywords: ['button', 'action', 'link', 'click'],
                category: 'advanced',
                action: () => onCommand({ id: 'button' } as SlashCommand, blockId),
            },
            // Breadcrumb
            {
                id: 'breadcrumb',
                label: 'Breadcrumb',
                description: 'Show page hierarchy navigation',
                icon: 'ChevronRight',
                keywords: ['breadcrumb', 'navigation', 'path', 'hierarchy'],
                category: 'advanced',
                action: () => onCommand({ id: 'breadcrumb' } as SlashCommand, blockId),
            },
            // Divider
            {
                id: 'divider',
                label: 'Divider',
                description: 'Visually divide blocks',
                icon: 'Minus',
                keywords: ['divider', 'hr', 'line', 'separator'],
                category: 'basic',
                action: () => onCommand({ id: 'divider' } as SlashCommand, blockId),
            },
            // AI
            {
                id: 'ai-summarize',
                label: 'Summarize Note',
                description: 'Use AI to summarize the current page',
                icon: 'Sparkles',
                keywords: ['ai', 'summary', 'summarize', 'tldr'],
                category: 'advanced',
                action: () => onCommand({ id: 'ai-summarize' } as SlashCommand, blockId),
            },
            // Templates
            ...BLOCK_TEMPLATES.map(template => ({
                id: `template-${template.id}`,
                label: `${template.icon} ${template.name}`,
                description: template.description,
                icon: 'FileStack',
                keywords: ['template', template.name.toLowerCase(), template.category, ...template.name.toLowerCase().split(' ')],
                category: 'advanced' as const,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                action: () => onCommand({ id: `template-${template.id}`, templateId: template.id } as any, blockId),
            })),
        ];
    }, [onCommand]);

    // Filter commands based on search query
    const filteredCommands = useCallback((blockId: string) => {
        const commands = getCommands(blockId);
        if (!searchQuery) return commands;

        const query = searchQuery.toLowerCase();
        return commands.filter(
            (cmd) =>
                cmd.label.toLowerCase().includes(query) ||
                cmd.description?.toLowerCase().includes(query) ||
                cmd.keywords.some((kw) => kw.toLowerCase().includes(query))
        );
    }, [searchQuery, getCommands]);

    // Open menu
    const openMenu = useCallback((blockId: string, cursorPosition?: { x: number; y: number }) => {
        setCurrentBlockId(blockId);
        setIsOpen(true);
        setSearchQuery('');
        setSelectedIndex(0);
        if (cursorPosition) {
            setPosition(cursorPosition);
        }
    }, []);

    // Close menu
    const closeMenu = useCallback(() => {
        setIsOpen(false);
        setSearchQuery('');
        setSelectedIndex(0);
        setCurrentBlockId(null);
    }, []);

    // Execute selected command
    const executeCommand = useCallback((index?: number) => {
        if (!currentBlockId) return;

        const commands = filteredCommands(currentBlockId);
        const commandIndex = index !== undefined ? index : selectedIndex;
        const command = commands[commandIndex];

        if (command) {
            command.action(currentBlockId);
            closeMenu();
        }
    }, [currentBlockId, selectedIndex, filteredCommands, closeMenu]);

    // Navigate commands with keyboard
    const navigateUp = useCallback(() => {
        setSelectedIndex((prev) => {
            const commands = currentBlockId ? filteredCommands(currentBlockId) : [];
            return prev > 0 ? prev - 1 : commands.length - 1;
        });
    }, [currentBlockId, filteredCommands]);

    const navigateDown = useCallback(() => {
        setSelectedIndex((prev) => {
            const commands = currentBlockId ? filteredCommands(currentBlockId) : [];
            return prev < commands.length - 1 ? prev + 1 : 0;
        });
    }, [currentBlockId, filteredCommands]);

    // Handle keyboard events
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    navigateUp();
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    navigateDown();
                    break;
                case 'Enter':
                    e.preventDefault();
                    executeCommand();
                    break;
                case 'Escape':
                    e.preventDefault();
                    closeMenu();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, navigateUp, navigateDown, executeCommand, closeMenu]);

    return {
        isOpen,
        openMenu,
        closeMenu,
        searchQuery,
        setSearchQuery,
        selectedIndex,
        setSelectedIndex,
        position,
        currentBlockId,
        commands: currentBlockId ? filteredCommands(currentBlockId) : [],
        executeCommand,
        menuRef,
    };
};
