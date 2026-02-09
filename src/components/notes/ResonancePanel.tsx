import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, FileText, ExternalLink, Loader2, BrainCircuit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LongTermMemoryItem } from "@/services/memory.service";
import { cn } from "@/lib/utils";

interface ResonancePanelProps {
    results: LongTermMemoryItem[];
    isSearching: boolean;
    onNavigate: (id: string) => void;
}

export function ResonancePanel({ results, isSearching, onNavigate }: ResonancePanelProps) {
    if (!isSearching && results.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="w-full glass-premium border border-primary/20 rounded-2xl p-6 shadow-xl shadow-primary/5 h-fit sticky top-24"
        >
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-primary">
                    <BrainCircuit className="h-5 w-5" />
                    <h3 className="font-black text-xs uppercase tracking-widest">Knowledge Resonance</h3>
                </div>
                {isSearching && <Loader2 className="h-3 w-3 animate-spin text-primary/60" />}
            </div>

            <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                    {results.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: index * 0.05 }}
                            className="group relative p-3 rounded-xl hover:bg-primary/5 border border-transparent hover:border-primary/10 transition-all cursor-pointer"
                            onClick={() => {
                                // Extract original ID from metadata if available
                                const targetId = (item.metadata as { originalId?: string })?.originalId || item.id;
                                onNavigate(targetId);
                            }}
                        >
                            <div className="flex items-start gap-3">
                                <div className="mt-1 p-1.5 rounded-lg bg-primary/10 text-primary">
                                    <FileText className="h-3.5 w-3.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-medium leading-relaxed line-clamp-2 text-foreground/90 group-hover:text-primary transition-colors">
                                        {item.content.length > 100 ? item.content.substring(0, 100) + "..." : item.content}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Badge variant="secondary" className="text-[9px] uppercase px-1.5 py-0 rounded bg-primary/5 text-primary/70 border-none font-bold">
                                            {item.metadata.type}
                                        </Badge>
                                        <span className="text-[10px] text-muted-foreground/50 font-medium">
                                            {Math.round(item.metadata.importance * 100)}% match
                                        </span>
                                    </div>
                                </div>
                                <ExternalLink className="h-3 w-3 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {results.length === 0 && isSearching && (
                    <div className="py-10 text-center space-y-3">
                        <div className="flex justify-center">
                            <Sparkles className="h-8 w-8 text-primary/20 animate-pulse" />
                        </div>
                        <p className="text-[11px] font-bold text-muted-foreground/40 uppercase tracking-widest animate-pulse">
                            Synapsing knowledge...
                        </p>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
