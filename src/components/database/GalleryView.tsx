import { useState } from 'react';
import { PropertyConfig, PropertyValue, getPageProperties } from '@/lib/page-content';
import { usePages } from '@/hooks/usePages';
import { GalleryViewSkeleton } from './LoadingSkeletons';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, MoreHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Tables, Json } from '@/integrations/supabase/types';
import { EmojiPicker } from '../ui/EmojiPicker';

type Page = Tables<'pages'>;

interface GalleryViewProps {
    pageId: string;
    schema: Record<string, PropertyConfig>;
    onSchemaChange: (schema: Record<string, PropertyConfig>) => void;
}

export function GalleryView({ pageId, schema, onSchemaChange }: GalleryViewProps) {
    const { pages, updatePage, createPage, isLoading } = usePages();
    const { toast } = useToast();

    // Get children
    const childPages = pages.filter(p => p.parent_id === pageId);

    const handleUpdatePageIcon = async (childId: string, icon: string) => {
        const page = pages.find(p => p.id === childId);
        if (!page) return;
        await updatePage.mutateAsync({ ...page, icon });
    };

    const handleAddCard = async () => {
        try {
            await createPage.mutateAsync({
                title: "New Item",
                parent_id: pageId,
                icon: "📄",
                content: {
                    blocks: [],
                    properties: {},
                    type: 'page'
                } as unknown as Json
            });
        } catch (error) {
            toast({
                title: "Error creating card",
                description: error instanceof Error ? error.message : "Failed to create",
                variant: "destructive"
            });
        }
    };

    if (isLoading) {
        return <GalleryViewSkeleton />;
    }

    return (
        <div className="space-y-4 px-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {childPages.map(page => (
                    <GalleryCard
                        key={page.id}
                        page={page}
                        schema={schema}
                        onUpdateIcon={handleUpdatePageIcon}
                    />
                ))}

                <button
                    onClick={handleAddCard}
                    className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl bg-muted/20 hover:bg-muted/30 transition-all group min-h-[200px]"
                >
                    <Plus className="h-8 w-8 text-muted-foreground/50 group-hover:scale-110 transition-transform mb-2" />
                    <span className="text-sm font-medium text-muted-foreground">New Card</span>
                </button>
            </div>
        </div>
    );
}

function GalleryCard({
    page,
    schema,
    onUpdateIcon
}: {
    page: Page;
    schema: Record<string, PropertyConfig>;
    onUpdateIcon: (id: string, icon: string) => Promise<void>;
}) {
    const props = getPageProperties(page.content);
    const coverUrl = page.cover_url;

    return (
        <Card className="overflow-hidden hover:shadow-xl transition-all group cursor-default border-primary/5 bg-background/80 backdrop-blur-sm flex flex-col h-full ring-1 ring-primary/5">
            {/* Cover Image */}
            <Link to={`/notes?page=${page.id}`} className="block relative overflow-hidden h-32 bg-muted/30">
                {coverUrl ? (
                    <div
                        className="h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                        style={
                            coverUrl.startsWith("linear-gradient")
                                ? { background: coverUrl }
                                : { backgroundImage: `url(${coverUrl})` }
                        }
                    />
                ) : (
                    <div className="h-full flex items-center justify-center opacity-20">
                        <span className="text-4xl">{page.icon || '📄'}</span>
                    </div>
                )}
            </Link>

            {/* Card Content */}
            <CardContent className="p-4 flex-1 flex flex-col pt-3">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <EmojiPicker value={page.icon || undefined} onSelect={(icon) => onUpdateIcon(page.id, icon)} />
                        <Link to={`/notes?page=${page.id}`} className="hover:underline flex-1 truncate">
                            <h3 className="font-semibold text-sm tracking-tight truncate">{page.title}</h3>
                        </Link>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                </div>

                {/* Properties */}
                <div className="space-y-1.5 flex-1">
                    {Object.entries(schema)
                        .slice(0, 4)
                        .map(([key, config]) => {
                            const value = props[key];
                            if (!value) return null;

                            return (
                                <div key={key} className="flex items-center justify-between text-[11px]">
                                    <span className="text-muted-foreground/60 font-medium truncate mr-2">{config.name}</span>
                                    <div className="max-w-[120px] truncate">
                                        {config.type === 'date' ? (
                                            <span className="font-bold text-muted-foreground/80">{format(new Date(value as string), 'MMM d')}</span>
                                        ) : (
                                            <span className="font-bold text-muted-foreground/80">{String(value)}</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                </div>

                <div className="pt-3 mt-auto border-t border-primary/5 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest">
                        {format(new Date(page.updated_at), 'MMM d')}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
