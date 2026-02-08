import { Link, ArrowLeft } from 'lucide-react';
import { useBacklinks } from '@/hooks/useBacklinks';
import { format } from 'date-fns';
import { cn } from '@/lib/utils'; // Assuming utils exists
import { Json } from '@/integrations/supabase/types';

interface Page {
    id: string;
    title: string;
    content: Json | null; // Relaxed to handle Supabase Json type
    updated_at: string;
}

interface BacklinksPanelProps {
    currentPageId: string;
    allPages: Page[];
    onNavigate: (pageId: string) => void;
}

export function BacklinksPanel({ currentPageId, allPages, onNavigate }: BacklinksPanelProps) {
    const backlinks = useBacklinks(currentPageId, allPages);

    if (backlinks.length === 0) return null;

    return (
        <div className="mt-12 pt-8 border-t border-border animate-fade-in">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
                <Link className="h-4 w-4" />
                {backlinks.length} Backlink{backlinks.length !== 1 ? 's' : ''}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {backlinks.map(page => (
                    <button
                        key={page.id}
                        onClick={() => onNavigate(page.id)}
                        className={cn(
                            "flex flex-col items-start p-3 rounded-lg border bg-card text-card-foreground",
                            "hover:bg-accent/50 hover:border-primary/50 transition-all text-left group"
                        )}
                    >
                        <div className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-1">
                            {page.title || "Untitled"}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                            Edited {format(new Date(page.updated_at), 'MMM d, yyyy')}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
