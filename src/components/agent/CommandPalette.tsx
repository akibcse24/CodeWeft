import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Command as CommandIcon, Search, FileText, CheckSquare,
  BookOpen, Calendar, Settings, Home, Sparkles, X,
  Clock, Star, TrendingUp, Zap, Brain, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { agentTools } from "@/services/agent.service";
import { nluService } from "@/services/agents/nlu.service";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (command: string, params?: Record<string, unknown>) => void;
  recentCommands?: string[];
  userId: string;
}

interface CommandItem {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  action: string;
  params?: Record<string, unknown>;
  category: string;
  shortcut?: string;
}

export function CommandPalette({
  isOpen,
  onClose,
  onSelect,
  recentCommands = [],
  userId
}: CommandPaletteProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [commands, setCommands] = useState<CommandItem[]>([]);
  const [filteredCommands, setFilteredCommands] = useState<CommandItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Build command list from agent tools
  useEffect(() => {
    const buildCommands = (): CommandItem[] => {
      const items: CommandItem[] = [];

      // Navigation commands
      items.push(
        { id: "nav_notes", name: "Go to Notes", description: "Navigate to your notes page", icon: FileText, action: "navigate_to_page", params: { path: "/notes" }, category: "Navigation", shortcut: "⌘1" },
        { id: "nav_tasks", name: "Go to Tasks", description: "View and manage your tasks", icon: CheckSquare, action: "navigate_to_page", params: { path: "/tasks" }, category: "Navigation", shortcut: "⌘2" },
        { id: "nav_dashboard", name: "Go to Dashboard", description: "View your productivity dashboard", icon: Home, action: "navigate_to_page", params: { path: "/dashboard" }, category: "Navigation", shortcut: "⌘0" },
        { id: "nav_courses", name: "Go to Courses", description: "Manage your learning courses", icon: BookOpen, action: "navigate_to_page", params: { path: "/courses" }, category: "Navigation" },
        { id: "nav_ai", name: "Go to AI Assistant", description: "Open AI Agent Hub", icon: Brain, action: "navigate_to_page", params: { path: "/ai-assistant" }, category: "Navigation", shortcut: "⌘K ⌘K" }
      );

      // Task commands
      items.push(
        { id: "task_create", name: "Create Task", description: "Add a new task to your list", icon: CheckSquare, action: "create_task", category: "Tasks" },
        { id: "task_list", name: "View All Tasks", description: "See all your tasks", icon: CheckSquare, action: "list_tasks", category: "Tasks" },
        { id: "task_stats", name: "Task Statistics", description: "View productivity metrics", icon: TrendingUp, action: "get_productivity_data", category: "Tasks" }
      );

      // Note commands
      items.push(
        { id: "note_create", name: "Create Note", description: "Create a new note", icon: FileText, action: "create_note", category: "Notes" },
        { id: "note_list", name: "View All Notes", description: "Browse your notes", icon: FileText, action: "list_notes", category: "Notes" },
        { id: "note_search", name: "Search Notes", description: "Find notes by content", icon: Search, action: "search_content", params: { type: "notes" }, category: "Notes" }
      );

      // AI commands
      items.push(
        { id: "ai_help", name: "Ask AI for Help", description: "Get AI assistance", icon: Sparkles, action: "ask_ai", category: "AI Assistant" },
        { id: "ai_suggest", name: "Get Suggestions", description: "Receive personalized suggestions", icon: Zap, action: "get_suggestions", category: "AI Assistant" },
        { id: "ai_learn", name: "Learn Pattern", description: "Teach AI your preferences", icon: Brain, action: "learn_pattern", category: "AI Assistant" }
      );

      // Settings
      items.push(
        { id: "settings_open", name: "Open Settings", description: "Configure your preferences", icon: Settings, action: "navigate_to_page", params: { path: "/settings" }, category: "Settings" },
        { id: "settings_theme", name: "Change Theme", description: "Switch between light and dark mode", icon: Settings, action: "toggle_theme", category: "Settings" }
      );

      // Quick actions
      items.push(
        { id: "quick_pomodoro", name: "Start Pomodoro", description: "Begin a focused work session", icon: Clock, action: "start_pomodoro", category: "Quick Actions" },
        { id: "quick_stats", name: "View Stats", description: "See your activity statistics", icon: TrendingUp, action: "get_user_stats", category: "Quick Actions" },
        { id: "quick_favorites", name: "View Favorites", description: "Access your favorite items", icon: Star, action: "list_favorites", category: "Quick Actions" }
      );

      return items;
    };

    setCommands(buildCommands());
  }, []);

  // Filter commands based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      // Show recent commands and favorites when no search
      const recent = recentCommands
        .map(cmd => commands.find(c => c.action === cmd))
        .filter(Boolean) as CommandItem[];

      setFilteredCommands(recent.length > 0 ? recent : commands.slice(0, 10));
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = commands.filter(cmd =>
      cmd.name.toLowerCase().includes(query) ||
      cmd.description.toLowerCase().includes(query) ||
      cmd.category.toLowerCase().includes(query)
    );

    // Also try to parse natural language
    if (filtered.length === 0 && searchQuery.length > 3) {
      nluService.parseCommand(searchQuery, {
        userId,
        recentCommands: [],
        conversationHistory: []
      }).then(parsed => {
        if (parsed.confidence > 0.6) {
          const nlCommand: CommandItem = {
            id: `nl_${Date.now()}`,
            name: `Execute: "${searchQuery}"`,
            description: `Natural language command (${Math.round(parsed.confidence * 100)}% confident)`,
            icon: Sparkles,
            action: parsed.action,
            params: parsed.params,
            category: "Natural Language"
          };
          setFilteredCommands([nlCommand, ...filtered]);
        } else {
          setFilteredCommands(filtered);
        }
      });
    } else {
      setFilteredCommands(filtered);
    }

    setSelectedIndex(0);
  }, [searchQuery, commands, recentCommands, userId]);

  const executeCommand = useCallback((command: CommandItem) => {
    onSelect(command.action, command.params);
    onClose();
    setSearchQuery("");
  }, [onSelect, onClose]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        break;
      case "Enter":
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          executeCommand(filteredCommands[selectedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        onClose();
        break;
    }
  }, [isOpen, filteredCommands, selectedIndex, onClose, executeCommand]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);


  const categories = [...new Set(commands.map(c => c.category))];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-start justify-center pt-[20vh]"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="w-full max-w-2xl bg-card rounded-xl shadow-2xl border border-border overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
            <CommandIcon className="h-5 w-5 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type a command or search..."
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 text-lg placeholder:text-muted-foreground"
            />
            <Badge variant="secondary" className="text-xs">
              {filteredCommands.length} results
            </Badge>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Category Tabs */}
          {!searchQuery && (
            <div className="flex gap-1 px-4 py-2 border-b border-border overflow-x-auto">
              <Button
                variant={activeCategory === null ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setActiveCategory(null)}
              >
                All
              </Button>
              {categories.map(cat => (
                <Button
                  key={cat}
                  variant={activeCategory === cat ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>
          )}

          {/* Command List */}
          <div className="max-h-[50vh] overflow-y-auto py-2">
            {filteredCommands.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No commands found</p>
                <p className="text-sm mt-1">Try typing in natural language</p>
              </div>
            ) : (
              filteredCommands.map((command, index) => {
                if (activeCategory && command.category !== activeCategory) return null;

                const Icon = command.icon;
                const isSelected = index === selectedIndex;

                return (
                  <motion.button
                    key={command.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                      "hover:bg-muted focus:bg-muted focus:outline-none",
                      isSelected && "bg-muted"
                    )}
                    onClick={() => executeCommand(command)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{command.name}</span>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {command.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {command.description}
                      </p>
                    </div>

                    {command.shortcut && (
                      <kbd className="hidden sm:inline-block px-2 py-1 text-xs bg-muted rounded border border-border">
                        {command.shortcut}
                      </kbd>
                    )}

                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                  </motion.button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-background rounded border">↑↓</kbd>
                to navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-background rounded border">↵</kbd>
                to select
              </span>
            </div>
            <span>Press ⌘K anytime to open</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default CommandPalette;
