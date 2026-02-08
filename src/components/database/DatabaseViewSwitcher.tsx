import React from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, LayoutGrid, GalleryVerticalEnd, Plus, Settings2, Calendar, GanttChart } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ViewType = 'table' | 'board' | 'gallery' | 'calendar' | 'timeline';

interface DatabaseViewSwitcherProps {
    currentView: ViewType;
    onViewChange: (view: ViewType) => void;
    onAddView?: () => void;
    onSettingsClick?: () => void;
}

export function DatabaseViewSwitcher({ currentView, onViewChange, onAddView, onSettingsClick }: DatabaseViewSwitcherProps) {
    return (
        <div className="flex items-center justify-between border-b px-2 h-10 bg-muted/20">
            <div className="flex items-center gap-1 h-full">
                <Tabs value={currentView} onValueChange={(v) => onViewChange(v as ViewType)} className="h-full">
                    <TabsList className="bg-transparent h-full p-0 gap-1">
                        <TabsTrigger
                            value="table"
                            className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 gap-2 text-xs font-medium"
                        >
                            <Table className="h-3.5 w-3.5" />
                            Table
                        </TabsTrigger>
                        <TabsTrigger
                            value="board"
                            className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 gap-2 text-xs font-medium"
                        >
                            <LayoutGrid className="h-3.5 w-3.5" />
                            Board
                        </TabsTrigger>
                        <TabsTrigger
                            value="gallery"
                            className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 gap-2 text-xs font-medium"
                        >
                            <GalleryVerticalEnd className="h-3.5 w-3.5" />
                            Gallery
                        </TabsTrigger>
                        <TabsTrigger
                            value="calendar"
                            className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 gap-2 text-xs font-medium"
                        >
                            <Calendar className="h-3.5 w-3.5" />
                            Calendar
                        </TabsTrigger>
                        <TabsTrigger
                            value="timeline"
                            className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 gap-2 text-xs font-medium"
                        >
                            <GanttChart className="h-3.5 w-3.5" />
                            Timeline
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-muted" onClick={onAddView}>
                    <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
            </div>

            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-2 px-2 text-muted-foreground hover:text-foreground" onClick={onSettingsClick}>
                    <Settings2 className="h-3.5 w-3.5" />
                    Properties
                </Button>
            </div>
        </div>
    );
}
