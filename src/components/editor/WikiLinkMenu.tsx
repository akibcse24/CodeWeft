import { useRef } from "react";
import { motion } from "framer-motion";
import { FileText, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

interface Page {
    id: string;
    title: string;
    updated_at: string;
    icon?: string;
    tags?: string[];
}

interface WikiLinkMenuProps {
    isOpen: boolean;
    searchTerm: string;
    pages: Page[];
    onSelect: (page: Page) => void;
    position: { top: number; left: number };
    selectedIndex: number;
}

export function WikiLinkMenu({
    isOpen,
    searchTerm,
    pages,
    onSelect,
    position,
    selectedIndex,
}: WikiLinkMenuProps) {
    const filteredPages = pages.filter(
        page =>
            page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            page.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
    ).slice(0, 10);

    if (!isOpen || filteredPages.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed z-50 bg-popover border rounded-lg shadow-lg p-2 min-w-[280px] max-h-[400px] overflow-y-auto"
            style={{ top: position.top + 24, left: Math.min(position.left, window.innerWidth - 300) }}
        >
            <p className="text-xs text-muted-foreground px-2 py-1 mb-1 font-medium">Link to page</p>
            {filteredPages.map((page, index) => (
                <button
                    key={page.id}
                    onClick={() => onSelect(page)}
                    className={cn(
                        "w-full flex items-center gap-3 px-2 py-2 rounded-md text-sm",
                        "hover:bg-accent transition-colors text-left",
                        index === selectedIndex && "bg-accent"
                    )}
                >
                    <div className="p-1.5 rounded bg-muted/50">
                        <span className="text-base leading-none">{page.icon || <FileText className="h-4 w-4 text-muted-foreground" />}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className="block font-medium truncate">{page.title}</span>
                        {page.tags && page.tags.length > 0 && (
                            <div className="flex items-center gap-1 mt-0.5">
                                <Hash className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground truncate">{page.tags.join(', ')}</span>
                            </div>
                        )}
                    </div>
                </button>
            ))}
            {filteredPages.length === 0 && (
                <div className="px-2 py-2 text-sm text-muted-foreground">No pages found</div>
            )}
        </motion.div>
    );
}
