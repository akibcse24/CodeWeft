/**
 * TabManager Component - Multi-tab file editing
 * 
 * Manages multiple open files with tab interface
 */

import { useState } from 'react';
import { X, Save, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from '@/components/ui/context-menu';

export interface EditorTab {
    id: string;
    filename: string;
    path: string;
    content: string;
    language: string;
    isDirty: boolean; // Has unsaved changes
    isNew: boolean; // New file not yet saved
}

interface TabManagerProps {
    tabs: EditorTab[];
    activeTabId: string | null;
    onTabChange: (tabId: string) => void;
    onTabClose: (tabId: string) => void;
    onTabSave: (tabId: string) => void;
    onCloseAll?: () => void;
    onCloseOthers?: (tabId: string) => void;
}

export function TabManager({
    tabs,
    activeTabId,
    onTabChange,
    onTabClose,
    onTabSave,
    onCloseAll,
    onCloseOthers,
}: TabManagerProps) {
    if (tabs.length === 0) {
        return null;
    }

    return (
        <div className="flex items-center border-b border-border bg-muted/30">
            <ScrollArea className="flex-1">
                <div className="flex">
                    {tabs.map((tab) => (
                        <TabItem
                            key={tab.id}
                            tab={tab}
                            isActive={tab.id === activeTabId}
                            onClick={() => onTabChange(tab.id)}
                            onClose={() => onTabClose(tab.id)}
                            onSave={() => onTabSave(tab.id)}
                            onCloseOthers={() => onCloseOthers?.(tab.id)}
                            onCloseAll={onCloseAll}
                        />
                    ))}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    );
}

interface TabItemProps {
    tab: EditorTab;
    isActive: boolean;
    onClick: () => void;
    onClose: () => void;
    onSave: () => void;
    onCloseOthers?: () => void;
    onCloseAll?: () => void;
}

function TabItem({
    tab,
    isActive,
    onClick,
    onClose,
    onSave,
    onCloseOthers,
    onCloseAll,
}: TabItemProps) {
    return (
        <ContextMenu>
            <ContextMenuTrigger>
                <div
                    className={cn(
                        'group flex items-center gap-2 px-3 py-2 border-r border-border cursor-pointer transition-colors min-w-[120px] max-w-[200px]',
                        isActive
                            ? 'bg-background text-foreground'
                            : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                    )}
                    onClick={onClick}
                >
                    {/* Unsaved indicator */}
                    {tab.isDirty && (
                        <Circle className="h-2 w-2 fill-primary text-primary shrink-0" />
                    )}

                    {/* Filename */}
                    <span className="flex-1 truncate text-sm font-medium">
                        {tab.filename}
                        {tab.isNew && ' *'}
                    </span>

                    {/* Close button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            </ContextMenuTrigger>

            <ContextMenuContent>
                {tab.isDirty && (
                    <>
                        <ContextMenuItem onClick={onSave}>
                            <Save className="mr-2 h-4 w-4" />
                            Save
                        </ContextMenuItem>
                    </>
                )}
                <ContextMenuItem onClick={onClose}>
                    <X className="mr-2 h-4 w-4" />
                    Close
                </ContextMenuItem>
                {onCloseOthers && (
                    <ContextMenuItem onClick={onCloseOthers}>
                        Close Others
                    </ContextMenuItem>
                )}
                {onCloseAll && (
                    <ContextMenuItem onClick={onCloseAll}>
                        Close All
                    </ContextMenuItem>
                )}
            </ContextMenuContent>
        </ContextMenu>
    );
}
