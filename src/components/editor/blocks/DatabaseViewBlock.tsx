import React from 'react';
import { Block } from '@/types/editor.types';
import { Database } from 'lucide-react';
import { DatabaseView } from '@/components/database/DatabaseView';
import { KanbanView } from '@/components/database/KanbanView';
import { GalleryView } from '@/components/database/GalleryView';
import { DatabaseViewSwitcher, ViewType } from '@/components/database/DatabaseViewSwitcher';
import { PropertyConfig } from '@/lib/page-content';

interface DatabaseViewBlockProps {
    block: Block;
    onUpdate: (updates: Partial<Block>) => void;
    onFocus?: () => void;
    isFocused?: boolean;
}

export const DatabaseViewBlock: React.FC<DatabaseViewBlockProps> = ({
    block,
    onUpdate,
    onFocus,
    isFocused,
}) => {
    const viewType = (block.metadata?.viewType as ViewType) || 'table';
    const pageId = block.metadata?.pageId as string;

    if (!pageId) {
        return (
            <div className="my-4 p-8 border-2 border-dashed rounded-lg flex flex-col items-center justify-center bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer group" onClick={onFocus}>
                <Database className="h-8 w-8 text-muted-foreground mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm text-muted-foreground text-center font-medium">
                    No database source selected
                </p>
                <p className="text-xs text-muted-foreground/60 text-center mt-1">
                    Use the slash menu to connect a page as a database
                </p>
            </div>
        );
    }

    return (
        <div className="my-6 border rounded-xl overflow-hidden bg-background/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all border-primary/10" onFocus={onFocus}>
            <DatabaseViewSwitcher
                currentView={viewType}
                onViewChange={(v) => onUpdate({ metadata: { ...block.metadata, viewType: v } })}
            />

            <div className="p-1">
                {viewType === 'table' ? (
                    <DatabaseView
                        pageId={pageId}
                        schema={block.metadata?.schema as Record<string, PropertyConfig> || {}}
                        onSchemaChange={(s) => onUpdate({ metadata: { ...block.metadata, schema: s } })}
                    />
                ) : viewType === 'board' ? (
                    <KanbanView
                        pageId={pageId}
                        schema={block.metadata?.schema as Record<string, PropertyConfig> || {}}
                        groupByProperty={block.metadata?.groupBy as string || 'status'}
                        onSchemaChange={(s) => onUpdate({ metadata: { ...block.metadata, schema: s } })}
                    />
                ) : (
                    <GalleryView
                        pageId={pageId}
                        schema={block.metadata?.schema as Record<string, PropertyConfig> || {}}
                        onSchemaChange={(s) => onUpdate({ metadata: { ...block.metadata, schema: s } })}
                    />
                )}
            </div>
        </div>
    );
};
