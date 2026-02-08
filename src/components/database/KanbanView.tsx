import { useState } from 'react';
import { Tables, Json } from '@/integrations/supabase/types';
import { PropertyConfig, PropertyValue, getPageProperties, createPageContent, getPageBlocks } from '@/lib/page-content';
import { usePages } from '@/hooks/usePages';
import { KanbanViewSkeleton } from './LoadingSkeletons';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, GripVertical, MoreHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { DndContext, DragEndEvent, DragOverlay, useDraggable, useDroppable, DragStartEvent } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useToast } from '@/hooks/use-toast';
import { PropertyEditor } from './PropertyEditor';
import { EmojiPicker } from '../ui/EmojiPicker';
import { motion, AnimatePresence } from 'framer-motion';

type Page = Tables<'pages'>;

interface KanbanViewProps {
    pageId: string;
    schema: Record<string, PropertyConfig>;
    groupByProperty: string;
    onSchemaChange: (schema: Record<string, PropertyConfig>) => void;
}

export function KanbanView({ pageId, schema, groupByProperty, onSchemaChange }: KanbanViewProps) {
    const { pages, updatePage, createPage, isLoading } = usePages();
    const [activeId, setActiveId] = useState<string | null>(null);
    const { toast } = useToast();

    const childPages = pages.filter(p => p.parent_id === pageId);
    const groupProperty = schema[groupByProperty];
    const columns = groupProperty?.options?.map(opt => opt.name) || ['To Do', 'In Progress', 'Done'];

    const groupedPages = columns.reduce((acc, column) => {
        acc[column] = childPages.filter(page => {
            const props = getPageProperties(page.content);
            return props[groupByProperty] === column;
        });
        return acc;
    }, {} as Record<string, Page[]>);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const pageId = active.id as string;
        const newColumn = over.id as string;

        // Update the page's property
        await handleUpdateProperty(pageId, groupByProperty, newColumn);
    };

    const handleUpdateProperty = async (childId: string, property: string, value: PropertyValue) => {
        try {
            const page = pages.find(p => p.id === childId);
            if (!page) return;

            const currentProps = getPageProperties(page.content);
            const content = createPageContent(getPageBlocks(page.content), {
                properties: { ...currentProps, [property]: value },
                type: 'page'
            });

            await updatePage.mutateAsync({
                id: childId,
                content: content as unknown as Json,
                title: page.title,
                user_id: page.user_id,
                created_at: page.created_at,
                updated_at: page.updated_at
            });
        } catch (error) {
            toast({
                title: "Error updating card",
                description: error instanceof Error ? error.message : "Failed to update",
                variant: "destructive"
            });
        }
    };

    const handleUpdatePageIcon = async (childId: string, icon: string) => {
        const page = pages.find(p => p.id === childId);
        if (!page) return;
        await updatePage.mutateAsync({ ...page, icon });
    };

    const handleAddCard = async (columnValue: string) => {
        try {
            const newContent = {
                blocks: [],
                properties: { [groupByProperty]: columnValue },
                type: 'page'
            };

            await createPage.mutateAsync({
                title: "New Item",
                parent_id: pageId,
                icon: "📄",
                content: newContent as unknown as Json
            });
        } catch (error) {
            toast({
                title: "Error creating card",
                description: error instanceof Error ? error.message : "Failed to create",
                variant: "destructive"
            });
        }
    };

    const activePage = activeId ? pages.find(p => p.id === activeId) : null;

    if (isLoading) {
        return <KanbanViewSkeleton />;
    }

    return (
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-6 px-2 scrollbar-thin">
                {columns.map(column => (
                    <KanbanColumn
                        key={column}
                        column={column}
                        pages={groupedPages[column] || []}
                        schema={schema}
                        groupByProperty={groupByProperty}
                        onUpdateProperty={handleUpdateProperty}
                        onUpdateIcon={handleUpdatePageIcon}
                        onAddCard={() => handleAddCard(column)}
                    />
                ))}
            </div>
            <DragOverlay>
                {activePage ? (
                    <KanbanCard
                        page={activePage}
                        schema={schema}
                        groupByProperty={groupByProperty}
                        isDragging
                        onUpdateProperty={async () => { }}
                        onUpdateIcon={async () => { }}
                    />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}

function KanbanColumn({
    column,
    pages,
    schema,
    groupByProperty,
    onUpdateProperty,
    onUpdateIcon,
    onAddCard
}: {
    column: string;
    pages: Page[];
    schema: Record<string, PropertyConfig>;
    groupByProperty: string;
    onUpdateProperty: (pageId: string, property: string, value: PropertyValue) => Promise<void>;
    onUpdateIcon: (pageId: string, icon: string) => Promise<void>;
    onAddCard: () => void;
}) {
    const { setNodeRef } = useDroppable({ id: column });

    return (
        <div ref={setNodeRef} className="flex-shrink-0 w-[300px]">
            <div className="bg-muted/30 rounded-xl p-3 flex flex-col h-full ring-1 ring-primary/5">
                <div className="flex items-center justify-between mb-4 px-1">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm tracking-tight">{column}</h3>
                        <span className="text-[10px] font-bold text-muted-foreground/60 bg-muted/50 px-1.5 py-0.5 rounded-md">
                            {pages.length}
                        </span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-muted" onClick={onAddCard}>
                        <Plus className="h-3.5 w-3.5" />
                    </Button>
                </div>

                <div className="space-y-3 min-h-[50px]">
                    <AnimatePresence mode="popLayout" initial={false}>
                        {pages.map(page => (
                            <motion.div
                                key={page.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                            >
                                <KanbanCard
                                    page={page}
                                    schema={schema}
                                    groupByProperty={groupByProperty}
                                    onUpdateProperty={onUpdateProperty}
                                    onUpdateIcon={onUpdateIcon}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onAddCard}
                        className="w-full justify-start text-xs text-muted-foreground hover:text-foreground h-8 mt-2"
                    >
                        <Plus className="h-3.5 w-3.5 mr-2" />
                        New Item
                    </Button>
                </div>
            </div>
        </div>
    );
}

function KanbanCard({
    page,
    schema,
    groupByProperty,
    onUpdateProperty,
    onUpdateIcon,
    isDragging = false
}: {
    page: Page;
    schema: Record<string, PropertyConfig>;
    groupByProperty: string;
    onUpdateProperty: (pageId: string, property: string, value: PropertyValue) => Promise<void>;
    onUpdateIcon: (pageId: string, icon: string) => Promise<void>;
    isDragging?: boolean;
}) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: page.id });
    const props = getPageProperties(page.content);

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <Card
            ref={setNodeRef}
            style={style}
            className={`cursor-default hover:shadow-xl transition-all border-primary/5 group ${isDragging ? 'rotate-2 scale-105 shadow-2xl' : ''} bg-background/80 backdrop-blur-sm`}
        >
            <CardContent className="p-3 space-y-3">
                <div className="flex items-start gap-2">
                    <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing">
                        <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 mt-1 transition-opacity" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2">
                            <EmojiPicker value={page.icon || undefined} onSelect={(icon) => onUpdateIcon(page.id, icon)} />
                            <Link to={`/notes?page=${page.id}`} className="hover:underline flex-1 truncate">
                                <h4 className="font-semibold text-sm tracking-tight truncate">{page.title}</h4>
                            </Link>
                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                        </div>

                        <div className="space-y-1.5 pt-1">
                            {Object.entries(schema)
                                .filter(([key]) => key !== groupByProperty)
                                .map(([key, config]) => {
                                    const value = props[key];
                                    return (
                                        <div key={key} className="flex items-center gap-2 group/prop">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 min-w-[60px]">
                                                {config.name}
                                            </span>
                                            <div className="flex-1 overflow-hidden">
                                                <PropertyEditor
                                                    config={config}
                                                    value={value}
                                                    onChange={(val) => onUpdateProperty(page.id, key, val)}
                                                    compact
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
