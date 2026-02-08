import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  FileText, 
  CheckSquare, 
  BookOpen, 
  Link, 
  GraduationCap,
  X,
  Clock,
  Loader2
} from "lucide-react";
import { usePages } from "@/hooks/usePages";
import { useTasks } from "@/hooks/useTasks";
import { useCourses } from "@/hooks/useCourses";
import { useResources } from "@/hooks/useResources";
import { usePapers } from "@/hooks/usePapers";
import type { Tables } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { sanitizeSearchQuery } from "@/lib/sanitize";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface SearchResult {
  id: string;
  type: "page" | "task" | "course" | "resource" | "paper";
  title: string;
  subtitle?: string;
  url: string;
  icon: React.ReactNode;
  updatedAt: string;
  tags?: string[];
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  const { pages } = usePages();
  const { tasks } = useTasks();
  const { courses } = useCourses();
  const { resources } = useResources();
  const { papers } = usePapers();

  // Keyboard shortcut to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const performSearch = useCallback(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    const sanitizedQuery = sanitizeSearchQuery(query.toLowerCase());

    const searchResults: SearchResult[] = [];

    // Search pages
    if (activeTab === "all" || activeTab === "pages") {
      pages
        .filter((page) =>
          page.title?.toLowerCase().includes(sanitizedQuery) ||
          page.tags?.some((tag) => tag.toLowerCase().includes(sanitizedQuery))
        )
        .forEach((page) => {
          searchResults.push({
            id: page.id,
            type: "page",
            title: page.title || "Untitled",
            url: `/notes?id=${page.id}`,
            icon: <FileText className="h-4 w-4" />,
            updatedAt: page.updated_at,
            tags: page.tags || [],
          });
        });
    }

    // Search tasks
    if (activeTab === "all" || activeTab === "tasks") {
      tasks
        .filter((task: Tables<"tasks">) =>
          task.title?.toLowerCase().includes(sanitizedQuery)
        )
        .forEach((task: Tables<"tasks">) => {
          searchResults.push({
            id: task.id,
            type: "task",
            title: task.title,
            subtitle: task.status,
            url: "/tasks",
            icon: <CheckSquare className="h-4 w-4" />,
            updatedAt: task.updated_at,
          });
        });
    }

    // Search courses
    if (activeTab === "all" || activeTab === "courses") {
      courses
        .filter((course) =>
          course.name?.toLowerCase().includes(sanitizedQuery) ||
          course.code?.toLowerCase().includes(sanitizedQuery)
        )
        .forEach((course) => {
          searchResults.push({
            id: course.id,
            type: "course",
            title: course.name,
            subtitle: course.code,
            url: "/courses",
            icon: <GraduationCap className="h-4 w-4" />,
            updatedAt: course.updated_at,
          });
        });
    }

    // Search resources
    if (activeTab === "all" || activeTab === "resources") {
      resources
        .filter((resource) =>
          resource.title?.toLowerCase().includes(sanitizedQuery) ||
          resource.tags?.some((tag) => tag.toLowerCase().includes(sanitizedQuery))
        )
        .forEach((resource) => {
          searchResults.push({
            id: resource.id,
            type: "resource",
            title: resource.title,
            subtitle: resource.category,
            url: "/resources",
            icon: <Link className="h-4 w-4" />,
            updatedAt: resource.updated_at,
            tags: resource.tags || [],
          });
        });
    }

    // Search papers
    if (activeTab === "all" || activeTab === "papers") {
      papers
        .filter((paper) =>
          paper.title?.toLowerCase().includes(sanitizedQuery) ||
          paper.authors?.some((author: string) =>
            author.toLowerCase().includes(sanitizedQuery)
          ) ||
          paper.tags?.some((tag: string) => tag.toLowerCase().includes(sanitizedQuery))
        )
        .forEach((paper) => {
          searchResults.push({
            id: paper.id,
            type: "paper",
            title: paper.title,
            subtitle: paper.publication_year?.toString(),
            url: "/papers",
            icon: <BookOpen className="h-4 w-4" />,
            updatedAt: paper.updated_at,
            tags: paper.tags || [],
          });
        });
    }

    // Sort by updated date
    searchResults.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    setResults(searchResults.slice(0, 20));
    setIsSearching(false);
  }, [query, activeTab, pages, tasks, courses, resources, papers]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(performSearch, 300);
    return () => clearTimeout(timer);
  }, [performSearch]);

  const handleSelect = (result: SearchResult) => {
    navigate(result.url);
    setOpen(false);
    setQuery("");
    setResults([]);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "page":
        return "bg-blue-500/10 text-blue-500";
      case "task":
        return "bg-green-500/10 text-green-500";
      case "course":
        return "bg-purple-500/10 text-purple-500";
      case "resource":
        return "bg-orange-500/10 text-orange-500";
      case "paper":
        return "bg-red-500/10 text-red-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-full justify-start rounded-md bg-muted/50 text-sm font-normal text-muted-foreground shadow-none hover:bg-muted sm:pr-12 md:w-40 lg:w-64"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        Search...
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium opacity-100 sm:flex">
          <span className="text-xs">Ctrl</span>K
        </kbd>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl p-0">
          <DialogHeader className="px-4 pt-4 pb-0">
            <DialogTitle className="sr-only">Search</DialogTitle>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search across all content..."
                className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
              {query && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-4">
              <TabsTrigger value="all" className="rounded-none">
                All
              </TabsTrigger>
              <TabsTrigger value="pages" className="rounded-none">
                Notes
              </TabsTrigger>
              <TabsTrigger value="tasks" className="rounded-none">
                Tasks
              </TabsTrigger>
              <TabsTrigger value="courses" className="rounded-none">
                Courses
              </TabsTrigger>
              <TabsTrigger value="resources" className="rounded-none">
                Resources
              </TabsTrigger>
              <TabsTrigger value="papers" className="rounded-none">
                Papers
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              <ScrollArea className="h-[400px]">
                {isSearching ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner size="md" text="Searching..." />
                  </div>
                ) : results.length > 0 ? (
                  <div className="p-2 space-y-1">
                    {results.map((result) => (
                      <button
                        key={`${result.type}-${result.id}`}
                        onClick={() => handleSelect(result)}
                        className={cn(
                          "w-full flex items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-accent",
                          "focus:outline-none focus:bg-accent focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        )}
                      >
                        <div
                          className={cn(
                            "mt-0.5 rounded p-1.5",
                            getTypeColor(result.type)
                          )}
                        >
                          {result.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">
                              {result.title}
                            </span>
                            <Badge
                              variant="secondary"
                              className="text-[10px] capitalize"
                            >
                              {result.type}
                            </Badge>
                          </div>
                          {result.subtitle && (
                            <p className="text-sm text-muted-foreground truncate">
                              {result.subtitle}
                            </p>
                          )}
                          {result.tags && result.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {result.tags.slice(0, 3).map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="outline"
                                  className="text-[10px]"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {format(new Date(result.updatedAt), "MMM d, yyyy")}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : query.trim() ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Search className="h-8 w-8 mb-2 opacity-50" />
                    <p>No results found for &quot;{query}&quot;</p>
                    <p className="text-sm">Try different keywords or filters</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Search className="h-8 w-8 mb-2 opacity-50" />
                    <p>Start typing to search...</p>
                    <p className="text-sm mt-1">
                      Search across notes, tasks, courses, resources, and papers
                    </p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>

          <div className="border-t px-4 py-2 text-xs text-muted-foreground flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span>
                <kbd className="rounded border bg-muted px-1">↑</kbd>{" "}
                <kbd className="rounded border bg-muted px-1">↓</kbd> to navigate
              </span>
              <span>
                <kbd className="rounded border bg-muted px-1">↵</kbd> to select
              </span>
            </div>
            <span>{results.length} results</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
