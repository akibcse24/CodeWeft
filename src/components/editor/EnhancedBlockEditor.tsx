import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GripVertical, Plus, Trash2, MoreHorizontal, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
    DndContext,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Import our new Notion-like components
import { SlashCommandMenu } from './SlashCommandMenu';
import { BlockTypeSelector } from './BlockTypeSelector';
import {
    TextBlock,
    HeadingBlock,
    CodeBlock,
    QuoteBlock,
    TodoBlock,
    ListBlock,
    CalloutBlock,
} from './blocks';
import { DiagramBlock } from './blocks/DiagramBlock';
import { AIAssistant } from './AIAssistant';

// Import hooks
import { useBlockEditor } from '@/hooks/useBlockEditor';
import { useSlashCommand } from '@/hooks/useSlashCommand';
import { useKeyboardShortcuts, createEditorShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useTextSelection } from '@/hooks/useTextSelection';

// Import types
import { Block, BlockType, SlashCommand } from '@/types/editor.types';

interface BlockEditorProps {
    blocks: Block[];
    onChange: (blocks: Block[]) => void;
    readOnly?: boolean;
}

export function BlockEditor({ blocks: initialBlocks, onChange, readOnly = false }: BlockEditorProps) {
    const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
    const [showBlockTypeSelector, setShowBlockTypeSelector] = useState(false);
    const [blockTypeSelectorPosition, setBlockTypeSelectorPosition] = useState({ x: 0, y: 0 });
    const editorRef = useRef<HTMLDivElement>(null);

    // Initialize block editor hook
    const {
        blocks,
        addBlock,
        updateBlock,
        deleteBlock,
        transformBlock,
        moveBlock,
        duplicateBlock,
        focusBlock,
        selectBlock,
        selectedBlockId,
        focusedBlockId,
        undo,
        redo,
        canUndo,
        canRedo,
    } = useBlockEditor({
        initialBlocks,
        onSave: onChange,
        autoSave: true,
        autoSaveDelay: 500,
    });

    // Sync blocks with parent
    useEffect(() => {
        onChange(blocks);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [blocks]);

    // Handle slash command execution
    const handleSlashCommand = useCallback(
        (command: SlashCommand, blockId: string) => {
            transformBlock(blockId, command.id as BlockType);
        },
        [transformBlock]
    );

    // Initialize slash command hook
    const slashCommand = useSlashCommand({
        onCommand: handleSlashCommand,
    });

    // Keyboard shortcuts
    useKeyboardShortcuts({
        shortcuts: createEditorShortcuts({
            onUndo: undo,
            onRedo: redo,
            onDuplicate: () => focusedBlockId && duplicateBlock(focusedBlockId),
            onDelete: () => focusedBlockId && deleteBlock(focusedBlockId),
            onMoveUp: () => {
                if (focusedBlockId) {
                    const index = blocks.findIndex((b) => b.id === focusedBlockId);
                    if (index > 0) moveBlock(focusedBlockId, index - 1);
                }
            },
            onMoveDown: () => {
                if (focusedBlockId) {
                    const index = blocks.findIndex((b) => b.id === focusedBlockId);
                    if (index < blocks.length - 1) moveBlock(focusedBlockId, index + 1);
                }
            },
        }),
        enabled: !readOnly,
    });

    // Drag and drop sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveBlockId(event.active.id as string);
    };

    // Text Selection for AI
    const {
        text: selectedText,
        position: selectionPosition,
        isVisible: isSelectionVisible,
        clearSelection
    } = useTextSelection(editorRef);

    const handleAIReplace = useCallback((text: string) => {
        // Simple replacement using execCommand for now as it handles contenteditable well
        // In a more robust implementation, we'd update block state directly
        document.execCommand('insertText', false, text);
        clearSelection();
    }, [clearSelection]);

    const handleAIInsert = useCallback((text: string) => {
        document.execCommand('insertText', false, text);
        clearSelection();
    }, [clearSelection]);


    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveBlockId(null);

        if (over && active.id !== over.id) {
            const oldIndex = blocks.findIndex((block) => block.id === active.id);
            const newIndex = blocks.findIndex((block) => block.id === over.id);
            moveBlock(active.id as string, newIndex);
        }
    };

    const handleBlockTypeSelect = useCallback(
        (type: BlockType) => {
            if (focusedBlockId) {
                transformBlock(focusedBlockId, type);
            }
            setShowBlockTypeSelector(false);
        },
        [focusedBlockId, transformBlock]
    );

    const openBlockTypeSelector = useCallback((blockId: string, event: React.MouseEvent) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setBlockTypeSelectorPosition({ x: rect.left, y: rect.bottom + 5 });
        focusBlock(blockId);
        setShowBlockTypeSelector(true);
    }, [focusBlock]);

    const renderBlock = useCallback(
        (block: Block, index: number) => {
            const isFocused = block.id === focusedBlockId;

            const commonProps = {
                block,
                onUpdate: (updates: Partial<Block>) => updateBlock(block.id, updates),
                onFocus: () => focusBlock(block.id),
                isFocused,
            };

            switch (block.type) {
                case 'text':
                    return <TextBlock {...commonProps} />;

                case 'heading1':
                case 'heading2':
                case 'heading3':
                    return <HeadingBlock {...commonProps} />;

                case 'code':
                    return <CodeBlock {...commonProps} />;

                case 'quote':
                    return <QuoteBlock {...commonProps} />;

                case 'todo':
                    return <TodoBlock {...commonProps} />;

                case 'bulleted-list':
                case 'numbered-list':
                    return <ListBlock {...commonProps} />;

                case 'callout':
                    return <CalloutBlock {...commonProps} />;

                case 'diagram':
                    return <DiagramBlock
                        content={block.content}
                        onChange={(content) => updateBlock(block.id, { content })}
                        onFocus={commonProps.onFocus}
                        isFocused={isFocused}
                    />;

                default:
                    return <TextBlock {...commonProps} />;
            }
        },
        [focusedBlockId, updateBlock, focusBlock]
    );

    const activeBlock = blocks.find((b) => b.id === activeBlockId);

    if (readOnly) {
        return (
            <div ref={editorRef} className="space-y-1">
                {blocks.map((block, index) => (
                    <div key={block.id} className="min-h-[32px]">
                        {renderBlock(block, index)}
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div ref={editorRef} className="relative">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-1">
                        {blocks.map((block, index) => (
                            <SortableBlock
                                key={block.id}
                                block={block}
                                index={index}
                                isFocused={block.id === focusedBlockId}
                                isSelected={block.id === selectedBlockId}
                                onDuplicate={() => duplicateBlock(block.id)}
                                onDelete={() => deleteBlock(block.id)}
                                onTurnInto={(e) => openBlockTypeSelector(block.id, e)}
                                onSlashTrigger={(position) => {
                                    focusBlock(block.id);
                                    slashCommand.openMenu(block.id, position);
                                }}
                            >
                                {renderBlock(block, index)}
                            </SortableBlock>
                        ))}
                    </div>
                </SortableContext>

                <DragOverlay>
                    {activeBlock && (
                        <div className="opacity-50 bg-background border border-border rounded-lg p-4">
                            {renderBlock(activeBlock, -1)}
                        </div>
                    )}
                </DragOverlay>
            </DndContext>

            {/* Add block button */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-1"
            >
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addBlock('text')}
                    className="text-muted-foreground hover:text-foreground w-full justify-start"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add a block
                </Button>
            </motion.div>

            {/* Slash Command Menu */}
            {slashCommand.isOpen && (
                <SlashCommandMenu
                    isOpen={slashCommand.isOpen}
                    commands={slashCommand.commands}
                    selectedIndex={slashCommand.selectedIndex}
                    searchQuery={slashCommand.searchQuery}
                    onSearchChange={slashCommand.setSearchQuery}
                    onSelectCommand={slashCommand.executeCommand}
                    onClose={slashCommand.closeMenu}
                    position={slashCommand.position}
                />
            )}

            {/* AI Assistant */}
            <AnimatePresence>
                {isSelectionVisible && selectionPosition && (
                    <AIAssistant
                        selectedText={selectedText}
                        position={selectionPosition}
                        onReplace={handleAIReplace}
                        onInsert={handleAIInsert}
                    />
                )}
            </AnimatePresence>

            {/* Block Type Selector */}
            <BlockTypeSelector
                isOpen={showBlockTypeSelector}
                onSelectType={handleBlockTypeSelect}
                onClose={() => setShowBlockTypeSelector(false)}
                position={blockTypeSelectorPosition}
            />

            {/* Editor Footer */}
            <div className="flex items-center justify-between mt-8 pt-4 border-t border-border/50">
                <div className="text-sm text-muted-foreground">
                    {blocks.length} block{blocks.length !== 1 ? 's' : ''}
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={undo}
                        disabled={!canUndo}
                        title="Undo (Ctrl+Z)"
                    >
                        Undo
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={redo}
                        disabled={!canRedo}
                        title="Redo (Ctrl+Y)"
                    >
                        Redo
                    </Button>
                </div>
            </div>
        </div>
    );
}

interface SortableBlockProps {
    block: Block;
    index: number;
    isFocused: boolean;
    isSelected: boolean;
    children: React.ReactNode;
    onDuplicate: () => void;
    onDelete: () => void;
    onTurnInto: (e: React.MouseEvent) => void;
    onSlashTrigger: (position: { x: number; y: number }) => void;
}

function SortableBlock({
    block,
    index,
    isFocused,
    isSelected,
    children,
    onDuplicate,
    onDelete,
    onTurnInto,
    onSlashTrigger,
}: SortableBlockProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: block.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const blockRef = useRef<HTMLDivElement>(null);

    // Detect slash command trigger
    const handleKeyUp = (e: React.KeyboardEvent) => {
        if (e.key === '/' && blockRef.current) {
            const rect = blockRef.current.getBoundingClientRect();
            onSlashTrigger({ x: rect.left, y: rect.bottom + 5 });
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'group relative',
                isFocused && 'ring-2 ring-primary/20 rounded-lg',
                isSelected && 'bg-muted/30'
            )}
            data-block-id={block.id}
        >
            {/* Block Controls */}
            <div className="absolute left-0 top-1 -translate-x-full pr-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
                    title="Drag to reorder"
                    aria-label="Drag handle"
                >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                </button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="bottom" align="start">
                        <DropdownMenuItem onClick={onTurnInto}>
                            Turn into
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onDuplicate}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={onDelete} className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Block Content */}
            <div ref={blockRef} className="min-h-[32px]" onKeyUp={handleKeyUp}>
                {children}
            </div>
        </div>
    );
}

// Export Block type for backward compatibility
export type { Block };
