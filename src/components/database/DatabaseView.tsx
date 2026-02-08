import { useState } from 'react';
import { Tables, Json } from '@/integrations/supabase/types';
import { PropertyConfig, PropertyValue, getPageProperties, createPageContent, getPageBlocks } from '@/lib/page-content';
import { usePages } from '@/hooks/usePages';
import { DatabaseViewSkeleton } from './LoadingSkeletons';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, MoreHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { PropertyEditor } from './PropertyEditor';
import { EmojiPicker } from '../ui/EmojiPicker';
import { motion, AnimatePresence } from "framer-motion";

type Page = Tables<'pages'>;

interface DatabaseViewProps {
    pageId: string;
    schema: Record<string, PropertyConfig>;
    onSchemaChange: (schema: Record<string, PropertyConfig>) => void;
}

export function DatabaseView({ pageId, schema, onSchemaChange }: DatabaseViewProps) {
    const { pages, updatePage, createPage, isLoading } = usePages();
    const { toast } = useToast();

    // Get children
    const childPages = pages.filter(p => p.parent_id === pageId);

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
                title: "Error updating property",
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

    const handleAddRow = async () => {
        await createPage.mutateAsync({
            title: "New Item",
            parent_id: pageId,
            icon: "📄"
        });
    };

    if (isLoading) {
        return <DatabaseViewSkeleton />;
    }

    return (
        <div className="w-full">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent border-b">
                        <TableHead className="w-[300px] font-medium text-xs uppercase tracking-wider h-9">Name</TableHead>
                        {Object.values(schema).map(prop => (
                            <TableHead key={prop.id} className="font-medium text-xs uppercase tracking-wider h-9">{prop.name}</TableHead>
                        ))}
                        <TableHead className="w-[50px] h-9"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <AnimatePresence mode="popLayout" initial={false}>
                        {childPages.map(page => {
                            const props = getPageProperties(page.content);
                            return (
                                <motion.tr
                                    key={page.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="group hover:bg-muted/30 transition-colors border-b"
                                >
                                    <TableCell className="py-1">
                                        <div className="flex items-center gap-2">
                                            <EmojiPicker value={page.icon || undefined} onSelect={(icon) => handleUpdatePageIcon(page.id, icon)} />
                                            <Link
                                                to={`/notes?page=${page.id}`}
                                                className="hover:underline font-medium text-sm truncate max-w-[200px]"
                                            >
                                                {page.title}
                                            </Link>
                                        </div>
                                    </TableCell>
                                    {Object.values(schema).map(prop => (
                                        <TableCell key={prop.id} className="py-1 px-1">
                                            <PropertyEditor
                                                config={prop}
                                                value={props[prop.id]}
                                                onChange={(val) => handleUpdateProperty(page.id, prop.id, val)}
                                                compact
                                            />
                                        </TableCell>
                                    ))}
                                    <TableCell className="py-1">
                                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </motion.tr>
                            );
                        })}
                    </AnimatePresence>
                    <TableRow className="hover:bg-transparent border-none">
                        <TableCell colSpan={Object.keys(schema).length + 2} className="p-0">
                            <Button
                                variant="ghost"
                                onClick={handleAddRow}
                                className="w-full justify-start text-muted-foreground hover:text-foreground h-9 rounded-none px-4 text-xs font-medium"
                            >
                                <Plus className="h-3.5 w-3.5 mr-2" /> New Row
                            </Button>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    );
}
