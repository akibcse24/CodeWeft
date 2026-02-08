import { useState, useMemo, useCallback } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import {
  Code2,
  Database,
  FileText,
  FolderKanban,
  GitBranch,
  Github,
  LayoutDashboard,
  Settings,
  Shield,
  FlaskConical,
  Bot,
  BarChart3,
  Play,
  GraduationCap,
  Home,
  Moon,
  CheckSquare,
  BookOpen,
  Timer,
  Brain,
  Search,
  ChevronDown,
  Sparkles,
  Monitor,
  Archive,
  Terminal,
  Brush,
  Globe,
  Book,
  Box,
  Briefcase,
  TrendingUp,
  Hammer,
  BarChart2,
  Wrench,
  Keyboard,
  Palette,
  Command,
  Plus,
  MoreHorizontal,
  LogOut,
  User,
  Bell,
  Star
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
  SidebarSeparator,
  SidebarRail,
  SidebarMenuBadge,
  SidebarMenuAction,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/hooks/use-theme";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PageTree } from "@/components/notes/PageTree";
import { useTasks } from "@/hooks/useTasks";
import { usePages } from "@/hooks/usePages";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useCommandPalette } from "@/hooks/useCommandPalette";
import { useAuth } from "@/hooks/useAuth";
import { SyncStatus } from "@/components/SyncStatus";
import { useProfile } from "@/hooks/useProfile";

// --- Configuration Data ---

export const mainNavItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Tasks", url: "/tasks", icon: CheckSquare },
];

export const studyItems = [
  { title: "Notes", url: "/notes", icon: FileText },
  { title: "Courses", url: "/courses", icon: GraduationCap },
  { title: "DSA Problems", url: "/dsa", icon: Code2 },
  { title: "Algo Visualizer", url: "/algo-visualizer", icon: BarChart2 },
  { title: "Code Type", url: "/code-type", icon: Keyboard },
  { title: "Resources", url: "/resources", icon: BookOpen },
  { title: "Flashcards", url: "/flashcards", icon: Brain },
  { title: "Growth Hub", url: "/growth-hub", icon: TrendingUp },
];

export const productivityItems = [
  { title: "Pomodoro", url: "/pomodoro", icon: Timer },
  { title: "Zen Room", url: "/zen-room", icon: Moon },
  { title: "Habits", url: "/habits", icon: Sparkles },
  { title: "Projects", url: "/projects", icon: FolderKanban },
  { title: "Builder Hub", url: "/builder-hub", icon: Hammer },
];

export const mlItems = [
  { title: "ML Notes", url: "/ml-notes", icon: FlaskConical },
  { title: "Papers", url: "/papers", icon: FileText },
  { title: "Datasets", url: "/datasets", icon: Database },
];

export const githubNavItems = [
  { title: "Git Operations", url: "/github/operations", icon: GitBranch },
  { title: "Repositories", url: "/github/repositories", icon: Github },
  { title: "Code Editor", url: "/github/editor", icon: Code2 },
  { title: "Branches", url: "/github/branches", icon: GitBranch },
  { title: "Gists", url: "/github/gists", icon: Code2 },
  { title: "Actions", url: "/github/actions", icon: Play },
  { title: "Codespaces", url: "/github/codespaces", icon: Monitor },
  { title: "Backups", url: "/github/backup", icon: Archive },
];

export const toolsNavItems = [
  { title: "AI Assistant", url: "/ai", icon: Bot },
  { title: "DevBox", url: "/devbox", icon: Terminal },
  { title: "Whiteboard", url: "/whiteboard", icon: Brush },
  { title: "Interview Hub", url: "/interview-hub", icon: Briefcase },
  { title: "API Client", url: "/api-client", icon: Globe },
  { title: "Regex Lab", url: "/regex-lab", icon: FlaskConical },
  { title: "Theme Forge", url: "/theme-forge", icon: Palette },
  { title: "Dev Utils", url: "/dev-utils", icon: Wrench },
  { title: "Cheat Sheets", url: "/cheat-sheets", icon: Book },
  { title: "Asset Studio", url: "/asset-studio", icon: Box },
  { title: "Graph View", url: "/graph", icon: FolderKanban },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Secrets Vault", url: "/secrets", icon: Shield },
  { title: "Settings", url: "/settings", icon: Settings },
];

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
    const saved = localStorage.getItem(`sidebar-section-${title}`);
    return saved ? JSON.parse(saved) : defaultOpen;
  });

  const hasActiveItem = items.some((item) => location.pathname === item.url);

  const toggleOpen = (open: boolean) => {
    setIsOpen(open);
    localStorage.setItem(`sidebar-section-${title}`, JSON.stringify(open));
  };

  // In collapsed mode, just show icons without collapsible groups
  if (isCollapsed) {
    return (
      <SidebarGroup className="py-1">
        <SidebarMenu className="space-y-0.5">
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild={item.url !== "/ai"}
                isActive={location.pathname === item.url}
                tooltip={item.title}
                className="group/item relative overflow-hidden transition-all duration-200 hover:bg-sidebar-accent/40 rounded-lg h-9 justify-center"
                onClick={(e) => {
                  if (item.url === "/ai") {
                    e.preventDefault();
                    window.dispatchEvent(new Event("toggle-ai-bot"));
                  }
                }}
              >
                {item.url === "/ai" ? (
                  <div className="flex items-center justify-center cursor-pointer">
                    <item.icon className={cn("h-4 w-4 transition-colors duration-200 text-muted-foreground/70 group-hover/item:text-foreground", item.color, location.pathname === item.url && "text-primary")} />
                  </div>
                ) : (
                  <Link to={item.url} className="flex items-center justify-center">
                    <item.icon className={cn("h-4 w-4 transition-colors duration-200 text-muted-foreground/70 group-hover/item:text-foreground", item.color, location.pathname === item.url && "text-primary")} />
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
      <SidebarGroup className="py-1">
        <SidebarGroupLabel asChild>
          <CollapsibleTrigger className="hover:bg-sidebar-accent/30 text-sidebar-foreground/50 hover:text-sidebar-foreground transition-all rounded-md px-2 py-1">
            <span className="text-[10px] font-semibold tracking-wider uppercase">{title}</span>
            <ChevronDown className="ml-auto h-3.5 w-3.5 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180 opacity-70" />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarMenu className="mt-1 space-y-0.5">
            {items.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild={item.url !== "/ai"}
                  isActive={location.pathname === item.url}
                  tooltip={item.title}
                  className="group/item relative overflow-hidden transition-all duration-200 hover:bg-sidebar-accent/40 rounded-lg h-9"
                  onClick={(e) => {
                    if (item.url === "/ai") {
                      e.preventDefault();
                      window.dispatchEvent(new Event("toggle-ai-bot"));
                    }
                  }}
                >
                  {item.url === "/ai" ? (
                    <div className="flex items-center gap-2 w-full cursor-pointer">
                      <item.icon className={cn("h-4 w-4 transition-colors duration-200 text-muted-foreground/70 group-hover/item:text-foreground", item.color, location.pathname === item.url && "text-primary")} />
                      <span className="font-medium text-muted-foreground/90 group-hover/item:text-foreground transition-colors text-[13px]">{item.title}</span>
                    </div>
                  ) : (
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className={cn("h-4 w-4 transition-colors duration-200 text-muted-foreground/70 group-hover/item:text-foreground", item.color, location.pathname === item.url && "text-primary")} />
                      <span className="font-medium text-muted-foreground/90 group-hover/item:text-foreground transition-colors text-[13px]">{item.title}</span>
                      {location.pathname === item.url && (
                        <motion.div
                          layoutId="active-nav-indicator"
                          className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-primary rounded-full"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                        />
                      )}
                    </Link>
                  )}
                </SidebarMenuButton>
                {item.badge && (
                  <SidebarMenuBadge className="bg-primary/5 text-primary text-[10px] h-4 min-w-4 px-1 rounded-full font-mono border border-primary/10">
                    {item.badge}
                  </SidebarMenuBadge>
                )}
              </SidebarMenuItem>
            ))}
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
  const { user } = useAuth();
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
    const saved = localStorage.getItem("sidebar-notes-open");
    return saved ? JSON.parse(saved) : true;
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
    <Sidebar collapsible="icon" className={cn("bg-sidebar-background/80 backdrop-blur-xl border-r border-sidebar-border/50 transition-all duration-300", className)}>
      {/* Header */}
      <SidebarHeader className="pb-4 pt-5 px-4 bg-transparent z-20">
        <div className={`flex items-center gap-3 mb-2 group p-2 rounded-xl transition-all duration-200 ${isCollapsed ? "-ml-2 justify-center" : "-ml-2"}`}>
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-purple-600/80 rounded-xl blur-md opacity-20 group-hover:opacity-40 transition-opacity duration-300" />
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sidebar-accent to-background border border-white/10 shadow-lg group-hover:scale-105 transition-transform duration-300">
              <img src="/logo.png" alt="CW" className="h-6 w-6 object-contain" />
            </div>
          </div>

          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex flex-col overflow-hidden"
              >
                <div className="flex items-center gap-1.5 transition-colors duration-200">
                  <span className="font-bold text-sm tracking-tight text-foreground/90 truncate">CodeWeft</span>
                </div>
                <span className="text-[10px] text-muted-foreground/70 uppercase tracking-widest font-semibold truncate">Learning Hub</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className={cn("ml-auto transition-opacity duration-200", isCollapsed ? "opacity-0 w-0" : "opacity-100")}>
          <SyncStatus />
        </div>

        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative group/search cursor-pointer mt-2"
            onClick={() => setIsOpen(true)}
          >
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60 group-hover/search:text-primary transition-colors" />
            <div
              className="h-9 bg-sidebar-accent/20 border border-sidebar-border/30 group-hover/search:border-primary/20 group-hover/search:bg-sidebar-accent/40 group-hover/search:shadow-sm pl-9 pr-2 text-xs transition-all duration-200 text-muted-foreground/80 group-hover/search:text-foreground flex items-center rounded-lg select-none backdrop-blur-sm"
            >
              Search...
            </div>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
              <span className="text-[10px] text-muted-foreground/40 bg-background/20 px-1.5 py-0.5 rounded border border-white/5 font-mono">⌘K</span>
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
        <SidebarGroup>
          <SidebarMenu className="gap-1">
            {dynamicMainNavItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === item.url}
                  tooltip={item.title}
                  className={cn(
                    "group relative overflow-hidden transition-all duration-300 hover:bg-sidebar-accent/40 data-[active=true]:bg-gradient-to-r data-[active=true]:from-primary/10 data-[active=true]:to-transparent data-[active=true]:text-primary rounded-lg py-2.5",
                    isCollapsed && "justify-center px-2"
                  )}
                >
                  <Link to={item.url} className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-2")}>
                    <item.icon className={cn("h-[18px] w-[18px] text-muted-foreground/70 group-hover:text-primary transition-colors duration-200 flex-shrink-0", location.pathname === item.url && "text-primary")} />
                    {!isCollapsed && <span className="font-medium tracking-tight">{item.title}</span>}
                    {location.pathname === item.url && (
                      <motion.div
                        layoutId="active-nav-glow"
                        className="absolute inset-0 bg-primary/5 -z-10 rounded-lg"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      />
                    )}
                  </Link>
                </SidebarMenuButton>
                {!isCollapsed && 'badge' in item && item.badge && (
                  <SidebarMenuBadge className="bg-primary/90 text-primary-foreground text-[10px] h-4 min-w-4 px-1 rounded shadow-lg shadow-primary/20 font-bold">
                    {item.badge}
                  </SidebarMenuBadge>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {/* Notes Tree */}
        {!isCollapsed && (
          <Collapsible open={notesOpen} onOpenChange={toggleNotesOpen} className="group/notes">
            <SidebarGroup className="py-1">
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="hover:bg-sidebar-accent/30 text-sidebar-foreground/50 hover:text-sidebar-foreground transition-all rounded-md px-2 py-1">
                  <span className="text-[10px] font-semibold tracking-wider uppercase">Knowledge Base</span>
                  <div className="ml-auto flex items-center gap-1">
                    <div
                      role="button"
                      onClick={(e) => { e.stopPropagation(); handleCreatePage(); }}
                      className="opacity-0 group-hover/notes:opacity-100 hover:bg-sidebar-accent hover:text-primary rounded p-0.5 transition-all duration-200"
                    >
                      <Plus className="h-3 w-3" />
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 group-data-[state=open]/notes:rotate-180 opacity-70" />
                  </div>
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <div className="pl-0 mt-1 space-y-0.5">
                  <PageTree
                    pages={pages}
                    onCreatePage={handleCreatePage}
                    onDeletePage={handleDeletePage}
                    onToggleFavorite={handleToggleFavorite}
                    onSelectPage={handleSelectPage}
                  />
                </div>
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
      <SidebarFooter className="border-t border-sidebar-border/30 p-2 bg-sidebar/30 backdrop-blur-xl z-20">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className={cn(
                    "data-[state=open]:bg-sidebar-accent/50 data-[state=open]:text-sidebar-accent-foreground transition-all duration-200 hover:bg-sidebar-accent/40 rounded-xl",
                    isCollapsed && "justify-center px-2"
                  )}
                >
                  <Avatar className="h-8 w-8 rounded-lg border border-white/10 shadow-sm ring-1 ring-black/5 flex-shrink-0">
                    <AvatarImage src={profile?.avatar_url || ''} alt={profile?.username || 'User'} />
                    <AvatarFallback className="rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary text-xs font-bold">
                      {profile?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <>
                      <div className="grid flex-1 text-left text-sm leading-tight ml-1 overflow-hidden">
                        <span className="truncate font-semibold text-sm">{profile?.username || user?.email?.split('@')[0] || "User"}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          {user?.email || "Not signed in"}
                        </span>
                      </div>
                      <MoreHorizontal className="ml-auto size-4 text-muted-foreground/50 flex-shrink-0" />
                    </>
                  )}
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-60 rounded-xl shadow-2xl border-white/10 bg-sidebar/90 backdrop-blur-2xl p-2 mb-1"
                side="bottom"
                align="end"
                sideOffset={8}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-3 px-2 py-2.5 text-left text-sm bg-gradient-to-br from-sidebar-accent/50 to-transparent rounded-lg mb-1 border border-white/5">
                    <Avatar className="h-9 w-9 rounded-lg border border-white/10">
                      <AvatarImage src={profile?.avatar_url || ''} alt={profile?.username || 'User'} />
                      <AvatarFallback className="rounded-lg">
                        {profile?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-bold">{profile?.username || user?.email?.split('@')[0] || "User"}</span>
                      <span className="truncate text-xs text-muted-foreground/80">{user?.email || "Not signed in"}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/5 my-1" />
                <DropdownMenuItem className="cursor-pointer focus:bg-sidebar-accent/50" onClick={() => navigate('/settings')}>
                  <User className="mr-2 h-4 w-4 text-muted-foreground" />
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer focus:bg-sidebar-accent/50" onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/5 my-1" />
                <div className="flex items-center justify-between px-2 py-2 hover:bg-sidebar-accent/30 rounded-md transition-colors">
                  <span className="text-xs text-muted-foreground font-medium">Appearance</span>
                  <ThemeToggle className="scale-90 origin-right hover:bg-transparent shadow-none border-none p-0 h-auto" />
                </div>
                <DropdownMenuSeparator className="bg-white/5 my-1" />
                <DropdownMenuItem className="text-red-500/80 hover:text-red-600 hover:bg-red-500/10 focus:bg-red-500/10 focus:text-red-600 cursor-pointer transition-colors">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
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
