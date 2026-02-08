import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import {
    FileText, Plus, Star, Clock, Search, Settings,
    BookOpen, Brain, CheckSquare, Folder, Github, Monitor, Play, Archive, Home, Command as CommandIcon, Sparkles
} from "lucide-react";
import { usePages } from "@/hooks/usePages";
import { useAI } from "@/hooks/useAI";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Tables } from "@/integrations/supabase/types";
import { DialogTitle } from '@/components/ui/dialog';
import { logger } from "@/lib/logger";

interface CommandPaletteProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CommandPalette({
    open,
    onOpenChange,
}: CommandPaletteProps) {
    const navigate = useNavigate();
    const { pages, favoritePages, searchPages } = usePages();
    const { askAI, indexAllPages, isIndexing } = useAI();
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Tables<"pages">[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [aiMode, setAiMode] = useState(false);
    const [aiResponse, setAiResponse] = useState("");
    const [isAiLoading, setIsAiLoading] = useState(false);

    const handleAskAI = async () => {
        if (!searchQuery.trim()) return;
        setIsAiLoading(true);
        setAiResponse("");
        try {
            const stream = await askAI(searchQuery);
            for await (const chunk of stream) {
                setAiResponse(prev => prev + (chunk.choices[0]?.delta?.content || ""));
            }
        } catch (e) {
            setAiResponse("Failed to get answer. Ensure API Key is set in Settings.");
        } finally {
            setIsAiLoading(false);
        }
    };

    // Get recent pages (last 5 updated)
    const recentPages = pages
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 5);

    // Search pages when query changes
    useEffect(() => {
        const performSearch = async () => {
            if (searchQuery.trim().length < 2) {
                setSearchResults([]);
                return;
            }

            setIsSearching(true);
            try {
                const results = await searchPages(searchQuery);
                setSearchResults(results);
            } catch (error) {
                logger.error("Search failed:", error);
            } finally {
                setIsSearching(false);
            }
        };

        const debounce = setTimeout(performSearch, 200);
        return () => clearTimeout(debounce);
    }, [searchQuery, searchPages]);

    const handleSelectPage = useCallback((pageId: string) => {
        sessionStorage.setItem("selectedPageId", pageId);
        navigate("/notes");
        onOpenChange(false);
        setSearchQuery("");
    }, [navigate, onOpenChange]);

    const handleQuickNavigation = useCallback((path: string) => {
        navigate(path);
        onOpenChange(false);
        setSearchQuery("");
    }, [navigate, onOpenChange]);

    const runCommand = (command: () => void) => {
        onOpenChange(false);
        command();
        setSearchQuery("");
    };

    return (
        <CommandDialog open={open} onOpenChange={(val) => {
            if (!val) { setAiMode(false); setAiResponse(""); setSearchQuery(""); }
            onOpenChange(val);
        }}>
            <DialogTitle className="sr-only">Command Palette</DialogTitle>
            <CommandInput
                placeholder={aiMode ? "Ask your second brain..." : "Search notes, repos, or type a command..."}
                value={searchQuery}
                onValueChange={setSearchQuery}
                onKeyDown={(e) => {
                    if (aiMode && e.key === 'Enter' && !isAiLoading) {
                        e.preventDefault();
                        handleAskAI();
                    }
                    if (!aiMode && searchQuery === "?" && e.key !== "Backspace") {
                        setAiMode(true);
                        setSearchQuery("");
                    }
                }}
            />
            <CommandList className="max-h-[80vh] sm:max-h-[500px]">
                {aiMode ? (
                    <div className="p-4 space-y-4">
                        {isAiLoading && !aiResponse && (
                            <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
                                <Sparkles className="h-4 w-4" />
                                <span>Thinking...</span>
                            </div>
                        )}
                        {aiResponse && (
                            <div className="prose dark:prose-invert text-sm max-w-none">
                                <div className="flex items-start gap-3">
                                    <Brain className="h-5 w-5 mt-1 text-primary shrink-0" />
                                    <div>{aiResponse}</div>
                                </div>
                            </div>
                        )}
                        {!isAiLoading && !aiResponse && (
                            <div className="text-center text-muted-foreground py-8">
                                <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>Type your question and press Enter</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <CommandEmpty>
                            {isSearching ? (
                                <span className="text-muted-foreground animate-pulse">Searching...</span>
                            ) : searchQuery.trim() ? (
                                <div className="py-6 text-center text-sm">
                                    <p className="text-muted-foreground">No results found for "{searchQuery}"</p>
                                    <button
                                        className="mt-2 text-primary font-medium hover:underline"
                                        onClick={() => handleQuickNavigation("/notes")}
                                    >
                                        Create a new page in Notes
                                    </button>
                                </div>
                            ) : (
                                <span className="text-muted-foreground">Type to search or browse commands...</span>
                            )}
                        </CommandEmpty>

                        {/* Search Results */}
                        {searchResults.length > 0 && (
                            <CommandGroup heading="Search Results">
                                {searchResults.map((page) => (
                                    <CommandItem
                                        key={page.id}
                                        value={`search-${page.id}-${page.title}`}
                                        onSelect={() => handleSelectPage(page.id)}
                                        className="flex items-start gap-3 py-3 rounded-lg"
                                    >
                                        <span className="text-xl mt-0.5">{page.icon || "📝"}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-[15px]">{page.title}</span>
                                                {page.is_favorite && (
                                                    <Star className="h-3 w-3 text-warning fill-warning" />
                                                )}
                                            </div>
                                            <p className="text-[11px] text-muted-foreground/60 uppercase tracking-wider mt-0.5 font-medium">
                                                Last edited {format(new Date(page.updated_at), "MMM d")}
                                            </p>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}

                        {!searchQuery.trim() && (
                            <>
                                <CommandGroup heading="AI Actions">
                                    <CommandItem onSelect={() => { setAiMode(true); setSearchQuery(""); }}>
                                        <Sparkles className="mr-3 h-4 w-4 text-purple-500" />
                                        <span>Ask AI...</span>
                                    </CommandItem>
                                    <CommandItem onSelect={() => { indexAllPages(); onOpenChange(false); }}>
                                        <Brain className="mr-3 h-4 w-4 text-muted-foreground" />
                                        <span>Re-index All Notes</span>
                                        {isIndexing && <span className="ml-auto text-xs opacity-50">Indexing...</span>}
                                    </CommandItem>
                                </CommandGroup>

                                <CommandGroup heading="Favorites">
                                    {favoritePages.length > 0 ? (
                                        favoritePages.slice(0, 3).map((page) => (
                                            <CommandItem
                                                key={page.id}
                                                value={`fav-${page.id}-${page.title}`}
                                                onSelect={() => handleSelectPage(page.id)}
                                                className="py-2.5"
                                            >
                                                <span className="mr-3 text-xl">{page.icon || "📝"}</span>
                                                <span className="font-medium">{page.title}</span>
                                                <Star className="ml-auto h-3 w-3 text-warning fill-warning" />
                                            </CommandItem>
                                        ))
                                    ) : (
                                        <div className="px-4 py-2 text-xs text-muted-foreground italic">No favorites yet</div>
                                    )}
                                </CommandGroup>

                                <CommandSeparator className="opacity-50" />

                                <CommandGroup heading="Quick Navigation">
                                    <CommandItem onSelect={() => handleQuickNavigation("/")}>
                                        <Home className="mr-3 h-4 w-4 text-muted-foreground" />
                                        <span>Dashboard</span>
                                    </CommandItem>
                                    <CommandItem onSelect={() => handleQuickNavigation("/notes")}>
                                        <FileText className="mr-3 h-4 w-4 text-muted-foreground" />
                                        <span>Notes</span>
                                    </CommandItem>
                                    <CommandItem onSelect={() => handleQuickNavigation("/github")}>
                                        <Github className="mr-3 h-4 w-4 text-muted-foreground" />
                                        <span>GitHub Hub</span>
                                    </CommandItem>
                                    <CommandItem onSelect={() => handleQuickNavigation("/tasks")}>
                                        <CheckSquare className="mr-3 h-4 w-4 text-muted-foreground" />
                                        <span>Task Board</span>
                                    </CommandItem>
                                </CommandGroup>

                                <CommandSeparator className="opacity-50" />

                                <CommandGroup heading="GitHub Actions">
                                    <CommandItem onSelect={() => handleQuickNavigation("/github/repositories")}>
                                        <Monitor className="mr-3 h-4 w-4 text-muted-foreground" />
                                        <span>Repositories</span>
                                    </CommandItem>
                                    <CommandItem onSelect={() => handleQuickNavigation("/github/gists")}>
                                        <FileText className="mr-3 h-4 w-4 text-muted-foreground" />
                                        <span>Browse Gists</span>
                                    </CommandItem>
                                    <CommandItem onSelect={() => handleQuickNavigation("/github/gists/new")}>
                                        <Plus className="mr-3 h-4 w-4 text-muted-foreground" />
                                        <span>Create New Gist</span>
                                    </CommandItem>
                                </CommandGroup>
                            </>
                        )}

                        <CommandSeparator />

                        <CommandGroup heading="System">
                            <CommandItem onSelect={() => handleQuickNavigation("/settings")}>
                                <Settings className="mr-3 h-4 w-4 text-muted-foreground" />
                                <span>Settings & Integration</span>
                            </CommandItem>
                        </CommandGroup>
                    </>
                )}
            </CommandList>
        </CommandDialog>
    );
}
