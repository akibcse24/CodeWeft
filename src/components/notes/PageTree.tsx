import { useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight, FileText, Plus, Star, MoreHorizontal,
  Trash2, FolderPlus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tables } from "@/integrations/supabase/types";

type Page = Tables<"pages">;

interface PageTreeProps {
  pages: Page[];
  onCreatePage: (parentId?: string) => void;
  onDeletePage: (id: string) => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
  selectedPageId?: string | null;
  onSelectPage?: (id: string) => void;
}

interface TreeNode extends Page {
  children: TreeNode[];
}

function buildTree(pages: Page[]): TreeNode[] {
  const pageMap = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  // Initialize all pages as tree nodes
  pages.forEach(page => {
    pageMap.set(page.id, { ...page, children: [] });
  });

  // Build tree structure
  pages.forEach(page => {
    const node = pageMap.get(page.id)!;
    if (page.parent_id && pageMap.has(page.parent_id)) {
      pageMap.get(page.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  // Sort by title (alphabetical) for stability
  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => a.title.localeCompare(b.title));
    nodes.forEach(node => sortNodes(node.children));
  };
  sortNodes(roots);

  return roots;
}

interface PageTreeItemProps {
  node: TreeNode;
  level: number;
  onCreateSubpage: (parentId: string) => void;
  onDeletePage: (id: string) => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
  selectedPageId?: string | null;
  onSelectPage?: (id: string) => void;
}

function PageTreeItem({
  node,
  level,
  onCreateSubpage,
  onDeletePage,
  onToggleFavorite,
  selectedPageId,
  onSelectPage
}: PageTreeItemProps) {
  const [isOpen, setIsOpen] = useState(level === 0);
  const hasChildren = node.children.length > 0;
  const location = useLocation();
  const isActive = selectedPageId === node.id || location.pathname === `/notes/${node.id}`;

  return (
    <div className="relative">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div
          className={cn(
            "group flex items-center gap-1.5 py-1.5 px-2 rounded-lg text-sm cursor-pointer transition-all duration-300 relative",
            "hover:bg-primary/5 hover:translate-x-0.5",
            isActive ? "bg-primary/10 text-primary font-semibold shadow-sm" : "text-muted-foreground/80 hover:text-foreground"
          )}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
        >
          {isActive && (
            <motion.div
              layoutId="page-tree-active"
              className="absolute left-0 w-0.5 h-4 bg-primary rounded-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            />
          )}

          {hasChildren ? (
            <CollapsibleTrigger asChild>
              <button className="p-1 hover:bg-primary/10 rounded-md transition-colors text-muted-foreground/60 hover:text-primary">
                <ChevronRight className={cn(
                  "h-3.5 w-3.5 transition-transform duration-300",
                  isOpen && "rotate-90 text-primary"
                )} />
              </button>
            </CollapsibleTrigger>
          ) : (
            <div className="w-5.5 flex items-center justify-center">
              <div className="h-1 w-1 rounded-full bg-sidebar-border opacity-50" />
            </div>
          )}

          <button
            onClick={() => onSelectPage?.(node.id)}
            className="flex-1 flex items-center gap-2.5 min-w-0 text-left"
          >
            <span className="shrink-0 text-base">{node.icon || "📄"}</span>
            <span className="truncate text-[13px] tracking-tight">{node.title}</span>
            {node.is_favorite && (
              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 shrink-0" />
            )}
          </button>

          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pr-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-1 hover:bg-primary/10 rounded-md transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 rounded-xl shadow-2xl bg-sidebar/95 backdrop-blur-xl border-sidebar-border/50">
                <DropdownMenuItem onClick={() => onCreateSubpage(node.id)} className="rounded-lg">
                  <FolderPlus className="h-4 w-4 mr-2 opacity-70" />
                  Add sub-page
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleFavorite(node.id, node.is_favorite || false)} className="rounded-lg">
                  <Star className="h-4 w-4 mr-2 opacity-70" />
                  {node.is_favorite ? "Remove from favorites" : "Add to favorites"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-500 focus:text-red-500 focus:bg-red-500/10 rounded-lg"
                  onClick={() => onDeletePage(node.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              className="p-1 hover:bg-primary/10 rounded-md transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onCreateSubpage(node.id);
              }}
              title="Add sub-page"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {hasChildren && (
          <CollapsibleContent>
            <div className="space-y-0.5">
              {node.children.map(child => (
                <PageTreeItem
                  key={child.id}
                  node={child}
                  level={level + 1}
                  onCreateSubpage={onCreateSubpage}
                  onDeletePage={onDeletePage}
                  onToggleFavorite={onToggleFavorite}
                  selectedPageId={selectedPageId}
                  onSelectPage={onSelectPage}
                />
              ))}
            </div>
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  );
}

export function PageTree({
  pages,
  onCreatePage,
  onDeletePage,
  onToggleFavorite,
  selectedPageId,
  onSelectPage
}: PageTreeProps) {
  const tree = useMemo(() => buildTree(pages), [pages]);

  return (
    <div className="space-y-1 overflow-hidden">
      {tree.length === 0 ? (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => onCreatePage()}
          className="w-full flex items-center gap-3 px-3 py-3 text-sm text-muted-foreground/60 hover:text-primary hover:bg-primary/5 rounded-xl transition-all border border-dashed border-sidebar-border/50 mx-auto"
        >
          <div className="h-8 w-8 rounded-lg bg-sidebar-accent/50 flex items-center justify-center">
            <Plus className="h-4 w-4" />
          </div>
          <span className="font-medium">Craft your first page</span>
        </motion.button>
      ) : (
        <div className="space-y-0.5">
          {tree.map((node, idx) => (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <PageTreeItem
                node={node}
                level={0}
                onCreateSubpage={(parentId) => onCreatePage(parentId)}
                onDeletePage={onDeletePage}
                onToggleFavorite={onToggleFavorite}
                selectedPageId={selectedPageId}
                onSelectPage={onSelectPage}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
