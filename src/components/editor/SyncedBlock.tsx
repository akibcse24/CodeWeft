
import { Block } from "@/types/editor.types";
import { Loader2, RefreshCw, Link } from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SyncedBlockProps {
    block: Block;
    originalBlock?: Block;
    renderBlock?: (block: Block) => ReactNode;
    onClick?: () => void;
}

export function SyncedBlock({ block, originalBlock, renderBlock, onClick }: SyncedBlockProps) {
    if (!originalBlock) {
        return (
            <div className="border border-dashed border-red-500/30 rounded-md p-3 bg-red-500/5 flex items-center gap-2 text-muted-foreground text-sm select-none">
                <RefreshCw className="h-4 w-4 text-red-500/50" />
                <span className="text-red-500/70 italic">Original block not found or deleted</span>
                <span className="text-xs text-muted-foreground/50 font-mono ml-auto">{block.content}</span>
            </div>
        );
    }

    return (
        <div
            className="group relative rounded-lg transition-all hover:bg-accent/5 ring-1 ring-transparent hover:ring-primary/20"
            onClick={onClick}
        >
            {/* Synced Indicator */}
            <div className="absolute -left-3 top-1 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center h-6 w-6">
                <RefreshCw className="h-3 w-3 text-primary animate-[spin_3s_linear_infinite]" />
            </div>

            <div className="opacity-90 group-hover:opacity-100 transition-opacity">
                {renderBlock ? renderBlock(originalBlock) : (
                    <div className="p-2 text-red-500">No renderer provided</div>
                )}
            </div>

            {/* Overlay to indicate it's a sync copy (optional, maybe a colored border logic is better) */}
            <div className="absolute inset-0 border border-primary/20 rounded-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    );
}
