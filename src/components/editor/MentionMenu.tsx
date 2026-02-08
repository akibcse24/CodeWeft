import { motion } from "framer-motion";
import { FileText, Hash, User, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface Page {
    id: string;
    title: string;
    updated_at: string;
    icon?: string;
    tags?: string[];
}

interface MentionMenuProps {
    isOpen: boolean;
    searchTerm: string;
    pages: Page[];
    onSelect: (page: Page) => void;
    position: { top: number; left: number };
    selectedIndex: number;
}

export function MentionMenu({
    isOpen,
    searchTerm,
    pages,
    onSelect,
    position,
    selectedIndex,
}: MentionMenuProps) {
    const filteredPages = pages.filter(
        page =>
            page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            page.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
    ).slice(0, 10);

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="fixed z-50 bg-popover/90 backdrop-blur-xl border rounded-xl shadow-2xl p-2 min-w-[300px] max-h-[400px] overflow-y-auto ring-1 ring-primary/10"
            style={{
                top: position.top + 24,
                left: Math.min(position.left, window.innerWidth - 320)
            }}
        >
            <div className="flex items-center justify-between px-2 py-1.5 mb-2 rounded-lg bg-primary/5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Link to Page or Date</p>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                    <span className="text-xs">@</span>
                </kbd>
            </div>

            <div className="space-y-1">
                {filteredPages.map((page, index) => (
                    <button
                        key={page.id}
                        onClick={() => onSelect(page)}
                        className={cn(
                            "w-full flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm transition-all duration-200",
                            "hover:bg-accent group",
                            index === selectedIndex && "bg-accent ring-1 ring-primary/20 shadow-sm"
                        )}
                    >
                        <div className={cn(
                            "p-2 rounded-md transition-colors",
                            index === selectedIndex ? "bg-primary/20" : "bg-muted/50 group-hover:bg-primary/10"
                        )}>
                            <span className="text-lg leading-none">
                                {page.icon || <FileText className="h-4 w-4 text-muted-foreground" />}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className="block font-semibold truncate">{page.title}</span>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(page.updated_at).toLocaleDateString()}
                                </span>
                                {page.tags && page.tags.length > 0 && (
                                    <div className="flex items-center gap-1">
                                        <Hash className="h-3 w-3 text-muted-foreground/40" />
                                        <span className="text-[10px] text-muted-foreground/60 truncate max-w-[100px]">
                                            {page.tags[0]}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {filteredPages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-3">
                        <User className="h-5 w-5 text-muted-foreground/40" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">No pages found</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Try a different search term</p>
                </div>
            )}
        </motion.div>
    );
}
