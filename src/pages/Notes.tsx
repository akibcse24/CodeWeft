import { useState, useCallback, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, FileText, Search, Star, MoreHorizontal, Trash2, Loader2,
  Tag, X, Filter, SortAsc, FolderPlus, Clock, Database, Maximize2, Minimize2, Sparkles, BarChart2, List
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from "@/components/ui/select";
import { BlockEditor } from "@/components/editor/BlockEditor";
import { Block } from "@/types/editor.types";
import { EmojiPicker } from "@/components/ui/EmojiPicker";
import { NoteBreadcrumbs } from "@/components/notes/NoteBreadcrumbs";
import { CoverImage } from "@/components/notes/CoverImage";
import { ExportMenu } from "@/components/notes/ExportMenu";
import { DailyNotes, getDailyNoteTitle, getDailyNoteTemplate } from "@/components/notes/DailyNotes";
import { CommandPalette } from "@/components/CommandPalette";
import { PageWidthSelector } from "@/components/PageWidthSelector";
import { getPageWidthClass, PageWidth } from "@/lib/page-layout";
import { getPageBlocks, getPageProperties, getPageSchema, getPageViewType, createPageContent, PropertyValue, PropertyConfig } from '@/lib/page-content';
import { DatabaseView } from '@/components/database/DatabaseView';
import { KanbanView } from '@/components/database/KanbanView';
import { GalleryView } from '@/components/database/GalleryView';
import { PageHeader } from '@/components/notes/PageHeader';
import { BacklinksPanel } from "@/components/notes/BacklinksPanel";
import { PagePropertiesPanel } from "@/components/editor/PagePropertiesPanel";
import { usePages } from "@/hooks/usePages";
import { useToast } from "@/hooks/use-toast";
import { TemplatePicker } from "@/components/notes/TemplatePicker";
import { Template } from "@/lib/templates";
import { cn } from "@/lib/utils";
import { Tables, Json } from "@/integrations/supabase/types";
import { format } from "date-fns";
import { EmptyState, EmptyNotesIcon } from "@/components/shared/EmptyState";
import { SkeletonGrid, SkeletonList } from "@/components/ui/skeleton";
import { runAgentLoop } from "@/services/agent.service";
import { extractTextFromBlocks } from "@/lib/block-utils";
import { useAuth } from "@/hooks/useAuth";
import { QuickFind } from "@/components/editor/QuickFind";
import { EDITOR_SHORTCUTS, matchesShortcut } from "@/lib/ShortcutRegistry";

type SortOption = "updated" | "created" | "title";

export default function Notes() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { pages, favoritePages, isLoading, createPage, updatePage, deletePage, toggleFavorite } = usePages();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedPageId, setSelectedPageId] = useState<string | null>(() => {
    const headerId = searchParams.get("id");
    if (headerId) return headerId;

    const storedId = sessionStorage.getItem("selectedPageId");
    if (storedId) {
      sessionStorage.removeItem("selectedPageId");
      return storedId;
    }
    return null;
  });
  const [pageTitle, setPageTitle] = useState("");
  const [pageIcon, setPageIcon] = useState("📝");
  const [pageTags, setPageTags] = useState<string[]>([]);
  const [pageCover, setPageCover] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([{ id: "1", type: "paragraph", content: "" }]);
  const [pageProperties, setPageProperties] = useState<Record<string, PropertyValue>>({});
  const [pageSchema, setPageSchema] = useState<Record<string, PropertyConfig>>({});
  const [viewType, setViewType] = useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("updated");
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [newTag, setNewTag] = useState("");
  const [pageWidth, setPageWidth] = useState<PageWidth>("default");
  const [showProperties, setShowProperties] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [aiInsights, setAIInsights] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [quickFindOpen, setQuickFindOpen] = useState(false);
  const [recentPageIds, setRecentPageIds] = useState<string[]>([]);

  // Quick Find keyboard shortcut (Cmd+P / Ctrl+P)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        setQuickFindOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Track recent pages
  useEffect(() => {
    if (selectedPageId) {
      setRecentPageIds(prev => {
        const filtered = prev.filter(id => id !== selectedPageId);
        return [selectedPageId, ...filtered].slice(0, 5);
      });
    }
  }, [selectedPageId]);

  // Handle URL params causing page selection or creation
  useEffect(() => {
    const shouldCreate = searchParams.get("new") === "true";
    const targetId = searchParams.get("id");

    if (shouldCreate) {
      handleCreatePage();
      // Remove the param so we don't loop or recreate on refresh
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        newParams.delete("new");
        return newParams;
      });
    } else if (targetId && targetId !== selectedPageId) {
      setSelectedPageId(targetId);
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const handleStorage = () => {
      const storedId = sessionStorage.getItem("selectedPageId");
      if (storedId) {
        setSelectedPageId(storedId);
        sessionStorage.removeItem("selectedPageId");
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const selectedPage = pages.find(p => p.id === selectedPageId);
  const allTags = [...new Set(pages.flatMap(p => (p.tags as string[]) || []))];

  useEffect(() => {
    if (selectedPage) {
      setPageTitle(selectedPage.title);
      setPageIcon(selectedPage.icon || "📝");
      setPageTags((selectedPage.tags as string[]) || []);
      setPageCover(selectedPage.cover_url);

      const content = selectedPage.content;
      setBlocks(getPageBlocks(content));
      setPageProperties(getPageProperties(content));
      setPageSchema(getPageSchema(content));
      setViewType(getPageViewType(content));
    }
  }, [selectedPageId, selectedPage]);

  const handleCreatePage = async (parentId?: string, customTitle?: string, customBlocks?: Block[]) => {
    const result = await createPage.mutateAsync({
      title: customTitle || "Untitled",
      icon: "📝",
      content: customBlocks as unknown as Json || [{ id: "1", type: "paragraph", content: "" }],
      parent_id: parentId,
    });
    setSelectedPageId(result.id);
    if (customBlocks) setBlocks(customBlocks);
    toast({ title: "New page created" });
  };

  const handleSave = useCallback(async () => {
    if (!selectedPageId) return;
    setIsSaving(true);

    const content = createPageContent(blocks, {
      properties: pageProperties,
      schema: pageSchema,
      viewType: viewType,
      type: viewType ? 'database' : 'page'
    });

    await updatePage.mutateAsync({
      id: selectedPageId,
      title: pageTitle,
      icon: pageIcon,
      content: content as unknown as Json,
      tags: pageTags,
      cover_url: pageCover,
    });
    setIsSaving(false);
  }, [selectedPageId, pageTitle, pageIcon, blocks, pageTags, pageCover, updatePage, pageProperties, pageSchema, viewType]);

  useEffect(() => {
    if (!selectedPageId) return;
    const timer = setTimeout(() => {
      handleSave();
    }, 1000);
    return () => clearTimeout(timer);
  }, [pageTitle, blocks, pageIcon, pageTags, pageCover, pageProperties, pageSchema, viewType, selectedPageId, handleSave]);

  // Handle block link scrolling
  useEffect(() => {
    const blockId = searchParams.get("block");
    if (blockId) {
      const timer = setTimeout(() => {
        const blockElement = document.getElementById(`block-${blockId}`);
        if (blockElement) {
          blockElement.scrollIntoView({ behavior: "smooth", block: "center" });
          blockElement.classList.add("ring-2", "ring-primary", "ring-offset-2");
          setTimeout(() => {
            blockElement.classList.remove("ring-2", "ring-primary", "ring-offset-2");
          }, 3000);
        }
        // Clean up the URL
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete("block");
        setSearchParams(newSearchParams, { replace: true });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchParams, setSearchParams, blocks]);

  const handleAIAnalyze = async () => {
    if (!selectedPageId) return;
    setIsAnalyzing(true);
    setShowAIInsights(true);

    try {
      const text = extractTextFromBlocks(blocks);
      const systemPrompt = "You are a brilliant research assistant. Analyze the following note and provide: 1. A 2-sentence summary. 2. Key takeaways (3-5 bullets). 3. Suggested tags. 4. Related concepts to explore.";
      const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analyze this note content:\n\n${text}` }
      ];

      const response = await runAgentLoop(messages, user?.id || "");
      let resultText = "";

      if (Symbol.asyncIterator in response) {
        for await (const chunk of response as AsyncIterable<{ choices: Array<{ delta?: { content: string } }> }>) {
          resultText += chunk.choices[0]?.delta?.content || "";
          setAIInsights(resultText); // Update live
        }
      } else {
        resultText = (response as { choices: Array<{ message: { content: string } }> }).choices[0].message.content;
        setAIInsights(resultText);
      }
    } catch (error) {
      console.error("AI Analysis Error", error);
      toast({ title: "Analysis failed", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const wordCount = extractTextFromBlocks(blocks).split(/\s+/).filter(Boolean).length;
  const readingTime = Math.ceil(wordCount / 200);

  const handleDeletePage = async (id: string) => {
    await deletePage.mutateAsync(id);
    if (selectedPageId === id) setSelectedPageId(null);
    toast({ title: "Page moved to trash" });
  };

  const handleToggleFavorite = async (id: string, isFavorite: boolean) => {
    await toggleFavorite.mutateAsync({ id, isFavorite });
    toast({ title: isFavorite ? "Removed from favorites" : "Added to favorites" });
  };

  const filteredPages = pages
    .filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = !filterTag || ((p.tags as string[]) || []).includes(filterTag);
      return matchesSearch && matchesTag;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "title": return a.title.localeCompare(b.title);
        case "created": return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default: return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });

  const favoriteNotes = favoritePages;
  const otherNotes = filteredPages.filter(p => !p.is_favorite);

  if (isLoading) {
    return (
      <div className="space-y-8 animate-slide-up max-w-[1400px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">Second Brain</h1>
            <p className="text-muted-foreground text-lg">Capture, organize, and synthesize your thoughts.</p>
          </div>
          <div className="flex items-center gap-3">
            <SkeletonList count={1} className="w-32 h-11" />
            <SkeletonList count={1} className="w-40 h-11" />
          </div>
        </div>
        <SkeletonGrid count={6} />
      </div>
    );
  }

  if (selectedPageId && selectedPage) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedPageId}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={cn(getPageWidthClass(pageWidth), "transition-all duration-300 mx-auto")}
        >
          {/* Header */}
          <div className={cn(
            "flex items-center justify-between mb-6 glass-premium p-4 rounded-2xl border-border/40 sticky top-0 z-10 transition-all duration-500",
            isFocusMode && "opacity-0 h-0 overflow-hidden pointer-events-none mb-0"
          )}>
            <NoteBreadcrumbs
              currentPage={selectedPage}
              allPages={pages}
              onNavigate={(pageId) => setSelectedPageId(pageId)}
            />

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className={cn("gap-2 px-3 rounded-xl transition-all", isFocusMode ? "bg-primary text-primary-foreground" : "hover:bg-primary/10 hover:text-primary")}
                onClick={() => setIsFocusMode(!isFocusMode)}
              >
                {isFocusMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                <span className="hidden sm:inline font-bold text-xs uppercase tracking-wider">{isFocusMode ? "Exit Focus" : "Focus"}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="gap-2 px-3 rounded-xl hover:bg-purple-500/10 hover:text-purple-500 transition-all group"
                onClick={handleAIAnalyze}
              >
                <Sparkles className="h-4 w-4 group-hover:animate-pulse" />
                <span className="hidden sm:inline font-bold text-xs uppercase tracking-wider">Analyze</span>
              </Button>

              <div className="h-4 w-[1px] bg-border/40 mx-1" />

              <DailyNotes onSelectDate={(date) => {
                const title = getDailyNoteTitle(date);
                const existing = pages.find(p => p.title === title);
                if (existing) setSelectedPageId(existing.id);
                else handleCreatePage(null, title, getDailyNoteTemplate(date));
              }} />

              <div className={cn(
                "px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all duration-300",
                isSaving ? "text-muted-foreground opacity-100" : "text-muted-foreground/40 opacity-100"
              )}>
                <div className={cn("h-1.5 w-1.5 rounded-full transition-colors duration-300", isSaving ? "bg-primary" : "bg-muted-foreground/30")} />
                <span className="w-12">{isSaving ? "Saving" : "Saved"}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-warning/10 hover:text-warning transition-colors rounded-xl"
                onClick={() => handleToggleFavorite(selectedPageId, selectedPage.is_favorite || false)}
              >
                <Star className={cn("h-5 w-5", selectedPage.is_favorite && "fill-warning text-warning")} />
              </Button>
              <ExportMenu blocks={blocks} pageTitle={pageTitle} pageData={selectedPage} />
              <PageWidthSelector value={pageWidth} onChange={setPageWidth} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="hover:bg-accent transition-colors rounded-xl">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 glass-premium border-border/40 rounded-xl">
                  <DropdownMenuItem onClick={() => handleCreatePage(selectedPageId)} className="gap-2 font-medium">
                    <FolderPlus className="h-4 w-4" /> Add sub-page
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setViewType(viewType ? undefined : 'table')} className="gap-2 font-medium">
                    <Database className="h-4 w-4" /> {viewType ? 'Convert to Page' : 'Convert to Database'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border/40" />
                  <DropdownMenuItem className="text-destructive gap-2 focus:text-destructive focus:bg-destructive/10 font-bold" onClick={() => handleDeletePage(selectedPageId)}>
                    <Trash2 className="h-4 w-4" /> Delete page
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {!isFocusMode && pageCover && (
            <div className="-mx-4 md:-mx-8 lg:-mx-12 mb-4">
              <CoverImage coverUrl={pageCover} onCoverChange={setPageCover} />
            </div>
          )}

          <div className="px-4 md:px-8">
            <PageHeader
              title={pageTitle}
              icon={pageIcon}
              coverUrl={pageCover}
              onTitleChange={setPageTitle}
              onIconChange={setPageIcon}
              onRemoveIcon={() => setPageIcon("")}
              onCoverClick={() => {
                // Add a default gradient cover if none exists
                if (!pageCover) {
                  setPageCover("linear-gradient(135deg, #667eea 0%, #764ba2 100%)");
                }
              }}
              pageId={selectedPageId}
              isPublic={selectedPage.is_public || false}
              onPublicChange={(isPublic) => {
                if (selectedPage) {
                  selectedPage.is_public = isPublic;
                }
              }}
            />

            {!isFocusMode && (
              <PagePropertiesPanel
                properties={pageProperties}
                schema={pageSchema}
                onChange={setPageProperties}
                onSchemaChange={setPageSchema}
                tags={pageTags}
                onTagsChange={setPageTags}
                lastEdited={format(new Date(selectedPage.updated_at), "MMM d, h:mm a")}
              />
            )}

            {!isFocusMode && (
              <div className="flex items-center gap-6 mt-4 px-1 text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] border-t border-border/10 pt-4">
                <div className="flex items-center gap-1.5">
                  <BarChart2 className="h-3 w-3" />
                  {wordCount} Words
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  {readingTime} Min Read
                </div>
                <div className="flex items-center gap-1.5">
                  <FileText className="h-3 w-3" />
                  {blocks.length} Blocks
                </div>
              </div>
            )}
          </div>

          <div className={cn("mt-10 min-h-[500px] transition-all duration-500", isFocusMode && "mt-32 max-w-3xl mx-auto")}>
            <AnimatePresence mode="wait">
              <motion.div
                key={viewType || 'blocks'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {viewType === 'table' ? (
                  <DatabaseView pageId={selectedPageId} schema={pageSchema} onSchemaChange={setPageSchema} />
                ) : viewType === 'board' ? (
                  <KanbanView pageId={selectedPageId} schema={pageSchema} groupByProperty="status" onSchemaChange={setPageSchema} />
                ) : viewType === 'list' ? (
                  <GalleryView pageId={selectedPageId} schema={pageSchema} onSchemaChange={setPageSchema} />
                ) : (
                  <div className="prose prose-slate dark:prose-invert max-w-none">
                    <BlockEditor blocks={blocks} onChange={setBlocks} pages={pages} onNavigate={(pageId) => navigate(`/notes?page=${pageId}`)} />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-20 pt-10 border-t border-border/40 flex flex-col md:flex-row gap-8">
            <div className="flex-1">
              <BacklinksPanel currentPageId={selectedPageId} allPages={pages} onNavigate={setSelectedPageId} />
            </div>

            <AnimatePresence>
              {showAIInsights && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="w-full md:w-80 glass-premium border border-purple-500/20 rounded-2xl p-6 shadow-xl shadow-purple-500/5 relative h-fit sticky top-24"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7 rounded-full"
                    onClick={() => setShowAIInsights(false)}
                  >
                    <X className="h-3 w-3" />
                  </Button>

                  <div className="flex items-center gap-2 mb-6 text-purple-500">
                    <Sparkles className="h-5 w-5" />
                    <h3 className="font-black text-xs uppercase tracking-widest">AI Insights</h3>
                  </div>

                  {isAnalyzing && !aiInsights ? (
                    <div className="space-y-4">
                      <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                      <div className="h-4 bg-muted animate-pulse rounded w-full" />
                      <div className="h-4 bg-muted animate-pulse rounded w-5/6" />
                      <div className="flex gap-2 mt-4">
                        <div className="h-6 bg-muted animate-pulse rounded-full w-12" />
                        <div className="h-6 bg-muted animate-pulse rounded-full w-16" />
                      </div>
                    </div>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert">
                      <p className="text-[13px] leading-relaxed whitespace-pre-wrap font-inter">
                        {aiInsights || "Nothing analyzed yet. Click the magic wand to gather insights."}
                      </p>
                    </div>
                  )}

                  {isAnalyzing && (
                    <div className="mt-6 flex items-center justify-center gap-2 text-[10px] font-bold text-purple-500/60 uppercase tracking-widest">
                      <Loader2 className="h-3 w-3 animate-spin" /> Deep Thinking...
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {isFocusMode && (
            <Button
              variant="outline"
              size="sm"
              className="fixed bottom-8 left-1/2 -translate-x-1/2 rounded-full glass-premium border-primary/20 hover:bg-primary/10 transition-all shadow-xl z-50 px-6 font-bold text-xs uppercase tracking-widest gap-2"
              onClick={() => setIsFocusMode(false)}
            >
              <Minimize2 className="h-4 w-4" /> Exit Focus Mode
            </Button>
          )}
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-[1400px] mx-auto pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative">
        <div className="space-y-2">
          <h1 className="text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60">
            Second Brain
          </h1>
          <p className="text-muted-foreground text-lg max-w-lg">
            A centralized hub for your knowledge, ideas, and creative explorations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <TemplatePicker onSelect={(template) => handleCreatePage(undefined, template.name, template.blocks)} />
          <Button onClick={() => handleCreatePage()} size="lg" className="h-12 px-6 rounded-2xl shadow-xl shadow-primary/10 hover:shadow-primary/20 hover:-translate-y-0.5 transition-all">
            <Plus className="mr-2 h-5 w-5" /> New Note
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 sticky top-0 z-10 bg-background/80 backdrop-blur-xl py-4 -mx-1 px-1">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search your brain..."
            className="pl-12 h-14 bg-muted/40 border-none rounded-2xl focus-visible:ring-2 focus-visible:ring-primary/20 text-lg shadow-inner"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-48 h-14 bg-muted/40 border-none rounded-2xl px-5 font-medium shadow-inner">
              <div className="flex items-center gap-2">
                <SortAsc className="h-4 w-4 text-primary" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent className="glass-premium border-border/40 rounded-xl">
              <SelectItem value="updated">Last Updated</SelectItem>
              <SelectItem value="created">Created Date</SelectItem>
              <SelectItem value="title">Alphabetical</SelectItem>
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-14 w-14 rounded-2xl border-none bg-muted/40 shadow-inner">
                <Filter className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 glass-premium border-border/40 rounded-xl">
              <div className="p-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 px-2">Filter by Tag</p>
                <div className="flex flex-wrap gap-1 px-1">
                  <Badge
                    variant={filterTag === null ? "default" : "outline"}
                    className="cursor-pointer rounded-lg text-[10px]"
                    onClick={() => setFilterTag(null)}
                  >
                    All
                  </Badge>
                  {allTags.map(tag => (
                    <Badge
                      key={tag}
                      variant={filterTag === tag ? "default" : "outline"}
                      className="cursor-pointer rounded-lg text-[10px]"
                      onClick={() => setFilterTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="space-y-12">
        {favoriteNotes.length > 0 && !searchQuery && !filterTag && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-2 text-warning">
              <Star className="h-4 w-4 fill-warning" />
              <h2 className="text-sm font-black uppercase tracking-[0.2em]">Favorites</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {favoriteNotes.map(page => (
                <PageCard key={page.id} page={page} allPages={pages} onSelect={() => setSelectedPageId(page.id)} />
              ))}
            </div>
          </section>
        )}

        <section className="space-y-6">
          <div className="flex items-center gap-2 px-2 text-muted-foreground/60">
            <FileText className="h-4 w-4" />
            <h2 className="text-sm font-black uppercase tracking-[0.2em]">
              {searchQuery || filterTag ? 'Search Results' : 'Recent Content'}
            </h2>
          </div>

          {filteredPages.length === 0 ? (
            <div className="bg-dot-pattern py-20 rounded-3xl border-2 border-dashed border-border/40 flex flex-col items-center justify-center text-center px-6">
              <div className="w-24 h-24 rounded-full bg-primary/5 flex items-center justify-center mb-6 animate-pulse">
                <EmptyNotesIcon className="w-12 h-12 text-primary/40" />
              </div>
              <h3 className="text-2xl font-bold mb-2">No notes found</h3>
              <p className="text-muted-foreground max-w-sm mb-8">
                {searchQuery ? `We couldn't find any results for "${searchQuery}"` : "Your knowledge base is waiting to be filled. Start capturing your brilliance today."}
              </p>
              <div className="flex items-center gap-3">
                <TemplatePicker onSelect={(template) => handleCreatePage(undefined, template.name, template.blocks)} />
                <Button onClick={() => handleCreatePage()} size="lg" className="rounded-2xl">
                  <Plus className="mr-2 h-5 w-5" /> New Note
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {(searchQuery || filterTag ? filteredPages : otherNotes).map(page => (
                <PageCard key={page.id} page={page} allPages={pages} onSelect={() => setSelectedPageId(page.id)} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Quick Find Modal */}
      <QuickFind
        isOpen={quickFindOpen}
        onClose={() => setQuickFindOpen(false)}
        pages={pages.map(p => ({
          id: p.id,
          title: p.title,
          icon: p.icon,
          updated_at: p.updated_at,
          is_favorite: p.is_favorite,
          tags: p.tags as string[] | null,
        }))}
        onSelectPage={(pageId) => setSelectedPageId(pageId)}
        onCreatePage={(title) => handleCreatePage(undefined, title)}
        recentPageIds={recentPageIds}
      />
    </div>
  );
}

function PageCard({ page, allPages, onSelect }: { page: Tables<'pages'>; allPages: Tables<'pages'>[]; onSelect: () => void }) {
  const content = page.content;
  const blocks = getPageBlocks(content);
  const textPreview = blocks.find(b => b.type === 'paragraph')?.content || "";

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card
        className="group overflow-hidden cursor-pointer h-full glass-premium border-border/30 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 relative"
        onClick={onSelect}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        {page.cover_url && (
          <div className="h-32 bg-cover bg-center relative" style={{ backgroundImage: `url(${page.cover_url})` }}>
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
          </div>
        )}
        <CardContent className="p-6 space-y-4 relative">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-muted/50 flex items-center justify-center text-xl shadow-inner group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  {page.icon || "📄"}
                </div>
                <h3 className="font-bold tracking-tight text-base leading-tight line-clamp-2">{page.title}</h3>
              </div>
              {page.is_favorite && <Star className="h-4 w-4 fill-warning text-warning shrink-0 mt-1" />}
            </div>
            <p className="text-xs text-muted-foreground/80 line-clamp-3 min-h-[48px] font-medium leading-relaxed">
              {textPreview || "No content yet..."}
            </p>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-border/30">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
              <Clock className="h-3 w-3" />
              {format(new Date(page.updated_at), 'MMM d, yyyy')}
            </div>
            <div className="flex gap-1.5 overflow-hidden">
              {(page.tags as string[])?.slice(0, 2).map(tag => (
                <Badge key={tag} variant="secondary" className="text-[9px] uppercase px-2 py-0.5 rounded-md bg-accent/50 text-accent-foreground font-bold">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
