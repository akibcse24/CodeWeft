import { useState, useMemo, useCallback } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import {
  mainNavItems,
  studyItems,
  productivityItems,
  mlItems,
  githubNavItems,
  toolsNavItems
} from "@/constants/nav-items";
import {
  ChevronDown,
  Sparkles,
  Plus,
  MoreHorizontal,
  LogOut,
  User,
  Settings,
  Star,
  FileText,
  Moon,
  Search
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
  SidebarRail,
  SidebarMenuBadge,
} from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useCommandPalette } from "@/hooks/useCommandPalette";
import { useAuth } from "@/hooks/useAuth";
import { SyncStatus } from "@/components/SyncStatus";
import { useProfile } from "@/hooks/useProfile";
import { useTasks } from "@/hooks/useTasks";
import { usePages } from "@/hooks/usePages";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PageTree } from "@/components/notes/PageTree";
import { ThemeToggle } from "@/components/ThemeToggle";


// --- Helper Components ---

interface NavSectionProps {
  title: string;
  items: {
    title: string;
    url: string;
    icon: React.ElementType;
    badge?: string;
    color?: string
  }[];
  defaultOpen?: boolean;
}

function NavSection({ title, items, defaultOpen = false }: NavSectionProps) {
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  // Persistent state for collapsible sections
  const [isOpen, setIsOpen] = useState(() => {
    try {
      const saved = localStorage.getItem(`sidebar-section-${title}`);
      return saved ? JSON.parse(saved) : defaultOpen;
    } catch (e) {
      console.warn(`[Sidebar] Failed to parse sidebar-section-${title}:`, e);
      return defaultOpen;
    }
  });

  const hasActiveItem = items.some((item) => location.pathname === item.url);

  const toggleOpen = (open: boolean) => {
    setIsOpen(open);
    localStorage.setItem(`sidebar-section-${title}`, JSON.stringify(open));
  };

  // In collapsed mode, just show icons with premium styling
  if (isCollapsed) {
    return (
      <SidebarGroup className="py-2">
        <SidebarMenu className="space-y-1.5">
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild={item.url !== "/ai"}
                isActive={location.pathname === item.url}
                tooltip={item.title}
                className={cn(
                  "group/item relative overflow-hidden transition-all duration-300 rounded-xl h-10 w-10 mx-auto justify-center",
                  "hover:bg-sidebar-accent/60",
                  location.pathname === item.url && "bg-sidebar-accent shadow-sm border border-sidebar-border/50 text-primary"
                )}
                onClick={(e) => {
                  if (item.url === "/ai") {
                    e.preventDefault();
                    window.dispatchEvent(new Event("toggle-ai-bot"));
                  }
                }}
              >
                {item.url === "/ai" ? (
                  <div className="flex items-center justify-center cursor-pointer relative z-10 transition-transform duration-300 group-hover/item:scale-110">
                    <item.icon className={cn("h-4.5 w-4.5 transition-colors duration-300", location.pathname === item.url ? "text-primary" : "text-muted-foreground/70 group-hover/item:text-primary")} />
                    {location.pathname === item.url && (
                      <div className="absolute inset-0 bg-primary/10 rounded-xl blur-md -z-10 animate-pulse" />
                    )}
                  </div>
                ) : (
                  <Link to={item.url} className="flex items-center justify-center relative z-10 transition-transform duration-300 group-hover/item:scale-110">
                    <item.icon className={cn("h-4.5 w-4.5 transition-colors duration-300", location.pathname === item.url ? "text-primary" : "text-muted-foreground/70 group-hover/item:text-primary")} />
                    {location.pathname === item.url && (
                      <div className="absolute inset-0 bg-primary/10 rounded-xl blur-md -z-10 animate-pulse" />
                    )}
                  </Link>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>
    );
  }

  return (
    <Collapsible open={isOpen || hasActiveItem} onOpenChange={toggleOpen} className="group/collapsible">
      <SidebarGroup className="py-2">
        <SidebarGroupLabel asChild>
          <CollapsibleTrigger className="hover:bg-sidebar-accent/50 text-sidebar-foreground/60 hover:text-sidebar-foreground transition-all rounded-lg px-2 py-1.5 flex items-center group/trigger">
            <span className="text-[10px] font-bold tracking-[0.1em] uppercase opacity-80 group-hover/trigger:opacity-100">{title}</span>
            <div className="ml-auto flex items-center gap-2">
              <div className="h-px w-8 bg-gradient-to-r from-sidebar-border/0 to-sidebar-border/60 group-hover/trigger:w-12 transition-all duration-300" />
              <ChevronDown className="h-3.5 w-3.5 transition-transform duration-300 group-data-[state=open]/collapsible:rotate-180 opacity-50" />
            </div>
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarMenu className="mt-1.5 space-y-1">
            <AnimatePresence mode="popLayout" initial={false}>
              {items.map((item, idx) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03, duration: 0.2 }}
                >
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild={item.url !== "/ai"}
                      isActive={location.pathname === item.url}
                      tooltip={item.title}
                      className={cn(
                        "group/item relative overflow-hidden transition-all duration-300 rounded-[var(--sidebar-item-radius)] h-10 px-3",
                        "hover:bg-sidebar-accent/60 hover:translate-x-1",
                        location.pathname === item.url && "bg-sidebar-accent/80 text-primary font-semibold shadow-sm ring-1 ring-sidebar-border/50"
                      )}
                      onClick={(e) => {
                        if (item.url === "/ai") {
                          e.preventDefault();
                          window.dispatchEvent(new Event("toggle-ai-bot"));
                        }
                      }}
                    >
                      {item.url === "/ai" ? (
                        <div className="flex items-center gap-3 w-full cursor-pointer relative z-10">
                          <div className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-300 group-hover/item:scale-110",
                            location.pathname === item.url ? "bg-primary/20 text-primary shadow-inner" : "bg-sidebar-accent/50 text-muted-foreground/80"
                          )}>
                            <item.icon className="h-4 w-4" />
                          </div>
                          <span className="text-sm tracking-tight">{item.title}</span>
                          <div className="ml-auto">
                            <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                          </div>
                        </div>
                      ) : (
                        <Link to={item.url} className="flex items-center gap-3 w-full relative z-10">
                          <div className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-300 group-hover/item:scale-110",
                            location.pathname === item.url ? "bg-primary/20 text-primary shadow-inner ring-1 ring-primary/20" : "bg-sidebar-accent/50 text-muted-foreground/80 rotate-0 group-hover/item:rotate-[-5deg]"
                          )}>
                            <item.icon className="h-4 w-4" />
                          </div>
                          <span className="text-sm tracking-tight">{item.title}</span>

                          {location.pathname === item.url && (
                            <motion.div
                              layoutId="nav-active-indicator"
                              className="absolute left-[-12px] top-2 bottom-2 w-1 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                            />
                          )}
                        </Link>
                      )}
                    </SidebarMenuButton>
                    {item.badge && (
                      <SidebarMenuBadge className="bg-primary/10 text-primary border border-primary/20 text-[10px] h-4.5 px-1.5 rounded-full font-bold shadow-sm">
                        {item.badge}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                </motion.div>
              ))}
            </AnimatePresence>
          </SidebarMenu>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}

// --- Main Sidebar Component ---

interface AppSidebarProps {
  className?: string;
}

export function AppSidebar({ className }: AppSidebarProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { pages, favoritePages, createPage, deletePage, toggleFavorite } = usePages();
  const { tasks } = useTasks(); // Fetch tasks
  const { setIsOpen } = useCommandPalette();

  // Calculate active task count
  const activeTaskCount = useMemo(() =>
    Array.isArray(tasks) ? tasks.filter(t => t.status !== 'completed').length : 0
    , [tasks]);

  // Update mainNavItems with dynamic badge
  const dynamicMainNavItems = useMemo(() => mainNavItems.map(item => {
    if (item.title === "Tasks") {
      return { ...item, badge: activeTaskCount > 0 ? activeTaskCount.toString() : undefined };
    }
    return item;
  }), [activeTaskCount]);

  const [notesOpen, setNotesOpen] = useState(() => {
    try {
      const saved = localStorage.getItem("sidebar-notes-open");
      return saved ? JSON.parse(saved) : true;
    } catch (e) {
      console.warn("[Sidebar] Failed to parse sidebar-notes-open:", e);
      return true;
    }
  });

  const toggleNotesOpen = (open: boolean) => {
    setNotesOpen(open);
    localStorage.setItem("sidebar-notes-open", JSON.stringify(open));
  }

  const handleCreatePage = useCallback(async (parentId?: string) => {
    const result = await createPage.mutateAsync({
      title: "Untitled",
      icon: "📝",
      parent_id: parentId,
    });
    navigate(`/notes`);
    toast({ title: "New page created" });
  }, [createPage, navigate, toast]);

  const handleDeletePage = useCallback(async (id: string) => {
    await deletePage.mutateAsync(id);
    toast({ title: "Page moved to trash" });
  }, [deletePage, toast]);

  const handleToggleFavorite = useCallback(async (id: string, isFavorite: boolean) => {
    await toggleFavorite.mutateAsync({ id, isFavorite });
  }, [toggleFavorite]);

  const handleSelectPage = useCallback((pageId: string) => {
    navigate(`/notes`);
    sessionStorage.setItem("selectedPageId", pageId);
    window.dispatchEvent(new Event("storage"));
  }, [navigate]);

  return (
    <Sidebar collapsible="icon" className={cn("sidebar-glass border-r border-sidebar-border/30 transition-all duration-500 ease-in-out", className)}>
      {/* Header */}
      <SidebarHeader className="pb-4 pt-6 px-4 bg-transparent z-20 space-y-5">
        <div className={cn(
          "flex items-center gap-3 group p-1 relative rounded-2xl transition-all duration-500",
          isCollapsed ? "justify-center" : "px-2"
        )}>
          <div className="relative flex-shrink-0">
            <div className="absolute inset-[-4px] bg-gradient-to-br from-primary via-purple-500 to-indigo-600 rounded-2xl blur-lg opacity-0 group-hover:opacity-40 transition-all duration-700 animate-pulse" />
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sidebar-background to-sidebar-accent border border-white/20 shadow-xl group-hover:scale-110 group-hover:rotate-[5deg] transition-all duration-500 ring-1 ring-black/5">
              <img src="/logo.png" alt="CW" className="h-7 w-7 object-contain drop-shadow-md" />
            </div>
          </div>

          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -15, filter: "blur(10px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: -15, filter: "blur(10px)" }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="flex flex-col overflow-hidden"
              >
                <div className="flex items-center gap-2">
                  <span className="font-black text-base tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60">CodeWeft</span>
                  <div className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[8px] font-black uppercase tracking-widest border border-primary/20">PRO</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] text-muted-foreground/80 uppercase tracking-[0.2em] font-bold">Learning OS</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!isCollapsed && (
            <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <SyncStatus />
            </div>
          )}
        </div>

        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative group/search cursor-pointer overflow-hidden rounded-xl"
            onClick={() => setIsOpen(true)}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-purple-500/5 opacity-0 group-hover/search:opacity-100 transition-opacity duration-300" />
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/40 group-hover/search:text-primary group-hover/search:scale-110 transition-all duration-300" />
            <div
              className="h-11 bg-sidebar-accent/30 border border-sidebar-border/50 group-hover/search:border-primary/30 group-hover/search:bg-sidebar-accent/50 group-hover/search:shadow-[0_0_20px_-5px_rgba(var(--primary),0.1)] pl-10 pr-4 text-sm transition-all duration-300 text-muted-foreground/60 group-hover/search:text-foreground flex items-center select-none backdrop-blur-md font-medium"
            >
              Search Command...
            </div>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none opacity-40 group-hover/search:opacity-100 transition-opacity">
              <span className="text-[10px] font-bold tracking-tighter bg-sidebar-background/80 border border-sidebar-border/50 px-1.5 py-0.5 rounded shadow-sm">⌘K</span>
            </div>
          </motion.div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-3 gap-2 overflow-x-hidden scrollbar-thin scrollbar-thumb-sidebar-accent/50 scrollbar-track-transparent pb-10">

        {/* Dynamic Favorites Section */}
        {(!isCollapsed && favoritePages && favoritePages.length > 0) && (
          <SidebarGroup className="py-2">
            <SidebarGroupLabel className="text-[10px] font-semibold tracking-wider uppercase text-sidebar-foreground/40 px-2 mb-1 flex items-center justify-between">
              Favorites
              <Star className="h-3 w-3 text-yellow-500/40" />
            </SidebarGroupLabel>
            <SidebarMenu>
              {favoritePages.map((page) => (
                <SidebarMenuItem key={page.id}>
                  <SidebarMenuButton
                    tooltip={page.title}
                    className="hover:bg-sidebar-accent/40 hover:translate-x-1 transition-all duration-200 rounded-lg group"
                    onClick={() => handleSelectPage(page.id)}
                  >
                    <span className="text-sm mr-2 group-hover:scale-110 transition-transform duration-200">{page.icon || "📄"}</span>
                    <span className="truncate text-sm font-medium opacity-90 group-hover:opacity-100">{page.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* Separator if favorites exist */}
        {(!isCollapsed && favoritePages && favoritePages.length > 0) && (
          <div className="px-2 py-1">
            <div className="h-px bg-gradient-to-r from-transparent via-sidebar-border/60 to-transparent" />
          </div>
        )}

        {/* Main Navigation */}
        <SidebarGroup className="py-2">
          <SidebarMenu className="gap-1.5">
            {dynamicMainNavItems.map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    tooltip={item.title}
                    className={cn(
                      "group relative overflow-hidden transition-all duration-300 rounded-[var(--sidebar-item-radius)] h-11 px-3",
                      "hover:bg-sidebar-accent/70 hover:translate-x-1",
                      location.pathname === item.url && "bg-sidebar-accent shadow-sm border border-sidebar-border/50 text-primary"
                    )}
                  >
                    <Link to={item.url} className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-3")}>
                      <div className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-500",
                        location.pathname === item.url ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-110" : "bg-sidebar-accent/50 text-muted-foreground/70 group-hover:scale-110 group-hover:bg-sidebar-accent group-hover:text-primary"
                      )}>
                        <item.icon className="h-[18px] w-[18px]" />
                      </div>
                      {!isCollapsed && <span className="font-semibold tracking-tight text-sm">{item.title}</span>}
                      {location.pathname === item.url && (
                        <motion.div
                          layoutId="main-nav-glow"
                          className="absolute inset-0 bg-primary/5 -z-10 rounded-xl"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        />
                      )}
                    </Link>
                  </SidebarMenuButton>
                  {!isCollapsed && 'badge' in item && item.badge && (
                    <SidebarMenuBadge className="bg-primary text-primary-foreground text-[10px] h-4.5 px-2 rounded-full shadow-lg shadow-primary/30 font-black border-2 border-sidebar-background">
                      {item.badge}
                    </SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              </motion.div>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <div className="sidebar-section-divider" />

        {/* Notes Tree */}
        {!isCollapsed && (
          <Collapsible open={notesOpen} onOpenChange={toggleNotesOpen} className="group/notes py-2">
            <SidebarGroup className="py-0">
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="hover:bg-sidebar-accent/50 text-sidebar-foreground/60 hover:text-sidebar-foreground transition-all rounded-lg px-2 py-1.5 flex items-center group/trigger">
                  <span className="text-[10px] font-bold tracking-[0.1em] uppercase opacity-80 group-hover/trigger:opacity-100">Knowledge Network</span>
                  <div className="ml-auto flex items-center gap-2">
                    <div
                      role="button"
                      onClick={(e) => { e.stopPropagation(); handleCreatePage(); }}
                      className="opacity-0 group-hover/notes:opacity-100 hover:bg-primary/20 hover:text-primary rounded-md p-1 transition-all duration-300"
                    >
                      <Plus className="h-3 w-3" />
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 transition-transform duration-300 group-data-[state=open]/notes:rotate-180 opacity-50" />
                  </div>
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="pl-2 mt-2 space-y-1 relative"
                >
                  <div className="absolute left-3.5 top-0 bottom-4 w-px bg-gradient-to-b from-sidebar-border/60 to-transparent" />
                  <PageTree
                    pages={pages}
                    onCreatePage={handleCreatePage}
                    onDeletePage={handleDeletePage}
                    onToggleFavorite={handleToggleFavorite}
                    onSelectPage={handleSelectPage}
                  />
                </motion.div>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}

        {isCollapsed && (
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Notes" className="hover:bg-sidebar-accent/40">
                  <FileText className="h-4 w-4 text-emerald-500" />
                  <span>Notes</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}

        <div className="px-2 py-2">
          <div className="h-px bg-gradient-to-r from-transparent via-sidebar-border/40 to-transparent" />
        </div>

        <NavSection title="Study Lab" items={studyItems} />
        <NavSection title="Productivity" items={productivityItems} />
        <NavSection title="Intelligence" items={mlItems} />
        <NavSection title="Repository" items={githubNavItems} />
        <NavSection title="Toolkit" items={toolsNavItems} />

      </SidebarContent>

      {/* Footer / User Profile */}
      <SidebarFooter className="border-t border-sidebar-border/30 p-3 bg-sidebar-background/40 backdrop-blur-2xl z-20">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className={cn(
                    "data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground transition-all duration-300 hover:bg-sidebar-accent/60 rounded-xl h-14",
                    isCollapsed && "justify-center px-2"
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-9 w-9 rounded-xl border border-white/10 shadow-lg ring-1 ring-black/5">
                      <AvatarImage src={profile?.avatar_url || ''} alt={profile?.username || 'User'} />
                      <AvatarFallback className="rounded-xl bg-gradient-to-br from-primary/20 via-purple-500/10 to-indigo-500/20 text-primary text-xs font-black">
                        {profile?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-sidebar-background p-0.5 shadow-sm">
                      <div className="h-full w-full rounded-full bg-emerald-500 border border-sidebar-background group-hover:animate-pulse" />
                    </div>
                  </div>
                  {!isCollapsed && (
                    <>
                      <div className="grid flex-1 text-left text-sm leading-tight ml-2 overflow-hidden">
                        <span className="truncate font-bold text-sm tracking-tight">{profile?.username || user?.email?.split('@')[0] || "User"}</span>
                        <span className="truncate text-[10px] text-muted-foreground/80 font-medium uppercase tracking-wider">
                          Personal Workspace
                        </span>
                      </div>
                      <div className="ml-auto opacity-40 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="size-4" />
                      </div>
                    </>
                  )}
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-64 rounded-2xl shadow-2xl border-white/10 bg-sidebar/95 backdrop-blur-3xl p-2 mb-2 ring-1 ring-black/10"
                side="top"
                align="start"
                sideOffset={12}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-3 px-3 py-3 text-left text-sm bg-gradient-to-br from-primary/5 to-transparent rounded-xl mb-1 border border-white/5">
                    <Avatar className="h-10 w-10 rounded-xl border border-white/10 shadow-md">
                      <AvatarImage src={profile?.avatar_url || ''} alt={profile?.username || 'User'} />
                      <AvatarFallback className="rounded-xl font-bold bg-sidebar-accent">
                        {profile?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-black text-base">{profile?.username || user?.email?.split('@')[0] || "User"}</span>
                      <span className="truncate text-xs text-muted-foreground/70 font-medium">{user?.email || "Not signed in"}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/5 my-2" />
                <div className="grid grid-cols-2 gap-1 mb-2">
                  <DropdownMenuItem className="cursor-pointer focus:bg-primary/10 focus:text-primary rounded-lg flex flex-col items-center justify-center py-3 gap-1 border border-transparent hover:border-primary/10 transition-all" onClick={() => navigate('/settings')}>
                    <User className="h-4 w-4" />
                    <span className="text-[10px] font-bold">Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer focus:bg-primary/10 focus:text-primary rounded-lg flex flex-col items-center justify-center py-3 gap-1 border border-transparent hover:border-primary/10 transition-all" onClick={() => navigate('/settings')}>
                    <Settings className="h-4 w-4" />
                    <span className="text-[10px] font-bold">Settings</span>
                  </DropdownMenuItem>
                </div>
                <DropdownMenuSeparator className="bg-white/5 my-2" />
                <div className="flex items-center justify-between px-3 py-2.5 hover:bg-sidebar-accent/50 rounded-xl transition-all border border-transparent hover:border-white/5 mx-1">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-semibold">Night Mode</span>
                  </div>
                  <ThemeToggle className="scale-90 origin-right hover:bg-transparent shadow-none border-none p-0 h-auto" />
                </div>
                <DropdownMenuSeparator className="bg-white/5 my-2" />
                <DropdownMenuItem
                  className="text-red-500/90 font-bold hover:text-red-500 hover:bg-red-500/10 focus:bg-red-500/10 focus:text-red-500 rounded-xl cursor-pointer transition-all mx-1 py-2.5"
                  onClick={() => signOut()}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail className="hover:bg-primary/50 transition-colors opacity-0 hover:opacity-100 w-1" />
    </Sidebar>
  );
}
