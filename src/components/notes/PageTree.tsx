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
    <div>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div
          className={cn(
            "group flex items-center gap-1 py-1 px-2 rounded-md text-sm cursor-pointer transition-colors",
            "hover:bg-sidebar-accent",
            isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
          )}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
        >
          {hasChildren ? (
            <CollapsibleTrigger asChild>
              <button className="p-0.5 hover:bg-muted rounded">
                <ChevronRight className={cn(
                  "h-3 w-3 text-muted-foreground transition-transform",
                  isOpen && "rotate-90"
                )} />
              </button>
            </CollapsibleTrigger>
          ) : (
            <span className="w-4" />
          )}

          <button
            onClick={() => onSelectPage?.(node.id)}
            className="flex-1 flex items-center gap-2 min-w-0 text-left"
          >
            <span className="shrink-0">{node.icon || "📄"}</span>
            <span className="truncate">{node.title}</span>
            {node.is_favorite && (
              <Star className="h-3 w-3 text-warning fill-warning shrink-0" />
            )}
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-1 hover:bg-muted rounded opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onCreateSubpage(node.id)}>
                <FolderPlus className="h-4 w-4 mr-2" />
                Add sub-page
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleFavorite(node.id, node.is_favorite || false)}>
                <Star className="h-4 w-4 mr-2" />
                {node.is_favorite ? "Remove from favorites" : "Add to favorites"}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDeletePage(node.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            className="p-1 hover:bg-muted rounded opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onCreateSubpage(node.id);
            }}
            title="Add sub-page"
          >
            <Plus className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
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
    <div className="space-y-1">
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-xs font-medium text-sidebar-muted uppercase tracking-wider">
          Notes
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          onClick={() => onCreatePage()}
          title="New page"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {tree.length === 0 ? (
        <button
          onClick={() => onCreatePage()}
          className="w-full flex items-center gap-2 px-2 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent rounded-md transition-colors"
        >
          <FileText className="h-4 w-4" />
          <span>Create your first page</span>
        </button>
      ) : (
        tree.map(node => (
          <PageTreeItem
            key={node.id}
            node={node}
            level={0}
            onCreateSubpage={(parentId) => onCreatePage(parentId)}
            onDeletePage={onDeletePage}
            onToggleFavorite={onToggleFavorite}
            selectedPageId={selectedPageId}
            onSelectPage={onSelectPage}
          />
        ))
      )}
    </div>
  );
}
