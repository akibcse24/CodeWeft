import { Skeleton } from '@/components/ui/skeleton';

export function DatabaseViewSkeleton() {
    return (
        <div className="border rounded-md p-4">
            <div className="space-y-2">
                {/* Header Row */}
                <div className="flex gap-4 pb-2 border-b">
                    {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} className="h-8 flex-1" />
                    ))}
                </div>
                {/* Data Rows */}
                {[1, 2, 3, 4, 5].map(row => (
                    <div key={row} className="flex gap-4 py-2">
                        {[1, 2, 3, 4].map(col => (
                            <Skeleton key={col} className="h-8 flex-1" />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

export function KanbanViewSkeleton() {
    return (
        <div className="flex gap-4 overflow-x-auto">
            {[1, 2, 3].map(col => (
                <div key={col} className="flex-shrink-0 w-80">
                    <div className="bg-muted/50 rounded-lg p-4">
                        <Skeleton className="h-6 w-32 mb-4" />
                        <div className="space-y-2">
                            {[1, 2, 3].map(card => (
                                <Skeleton key={card} className="h-24 w-full" />
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export function GalleryViewSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="space-y-2">
                    <Skeleton className="h-40 w-full rounded-t-lg" />
                    <div className="p-4 space-y-2">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-full" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function CalendarViewSkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-40" />
                <div className="flex gap-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                </div>
            </div>
            <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton key={`header-${i}`} className="h-6 w-full" />
                ))}
                {Array.from({ length: 35 }).map((_, i) => (
                    <Skeleton key={`day-${i}`} className="h-24 w-full" />
                ))}
            </div>
        </div>
    );
}

export function TimelineViewSkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-40" />
                <div className="flex gap-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                </div>
            </div>
            <Skeleton className="h-10 w-full" />
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-8 flex-1" />
                </div>
            ))}
        </div>
    );
}
