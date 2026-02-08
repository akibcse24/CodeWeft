
import { ReactNode, useState, useEffect } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Code,
  Quote,
  ToggleLeft,
  AlertCircle,
  Copy,
  Link2,
  Trash2,
  Sparkles,
  Palette,
  RefreshCw,
  ChevronDown,
  Clock,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Block, BlockType } from "@/types/editor.types";
import { EDITOR_SHORTCUTS } from "@/lib/ShortcutRegistry";
import { formatDistanceToNow } from "date-fns";

interface BlockContextMenuProps {
  children: ReactNode;
  block: Block;
  onTurnInto: (type: BlockType) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onCopyLink: () => void;
  onColorChange: (textColor?: string, backgroundColor?: string) => void;
  onCopySyncedBlock: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

import { type LucideIcon } from "lucide-react";

interface TurnIntoOption {
  type: BlockType;
  icon: LucideIcon;
  label: string;
  shortcut?: string;
  description: string;
  preview: ReactNode;
}

const turnIntoOptions: TurnIntoOption[] = [
  {
    type: "paragraph",
    icon: Type,
    label: "Text",
    shortcut: EDITOR_SHORTCUTS.TURN_INTO_TEXT?.keys,
    description: "Just start writing with plain text.",
    preview: (
      <div className="p-2 space-y-2 bg-background border rounded-md">
        <div className="h-2 w-3/4 bg-muted rounded" />
        <div className="h-2 w-1/2 bg-muted rounded" />
      </div>
    )
  },
  {
    type: "heading1",
    icon: Heading1,
    label: "Heading 1",
    shortcut: EDITOR_SHORTCUTS.TURN_INTO_H1?.keys,
    description: "Big section heading.",
    preview: (
      <div className="p-2 bg-background border rounded-md">
        <div className="h-8 w-1/2 bg-muted rounded mb-2" />
        <div className="h-2 w-full bg-muted/30 rounded" />
      </div>
    )
  },
  {
    type: "heading2",
    icon: Heading2,
    label: "Heading 2",
    shortcut: EDITOR_SHORTCUTS.TURN_INTO_H2?.keys,
    description: "Medium section heading.",
    preview: (
      <div className="p-2 bg-background border rounded-md">
        <div className="h-6 w-1/2 bg-muted rounded mb-2" />
        <div className="h-2 w-full bg-muted/30 rounded" />
      </div>
    )
  },
  {
    type: "heading3",
    icon: Heading3,
    label: "Heading 3",
    shortcut: EDITOR_SHORTCUTS.TURN_INTO_H3?.keys,
    description: "Small section heading.",
    preview: (
      <div className="p-2 bg-background border rounded-md">
        <div className="h-5 w-1/2 bg-muted rounded mb-2" />
        <div className="h-2 w-full bg-muted/30 rounded" />
      </div>
    )
  },
  // Toggle Headings
  {
    type: "toggleHeading1",
    icon: ChevronDown,
    label: "Toggle Heading 1",
    description: "Big section heading that can be collapsed.",
    preview: (
      <div className="p-2 bg-background border rounded-md">
        <div className="flex items-center gap-1 mb-2">
          <ChevronDown className="h-6 w-6 text-muted-foreground" />
          <div className="h-8 w-1/2 bg-muted rounded" />
        </div>
        <div className="pl-7 h-2 w-full bg-muted/30 rounded" />
      </div>
    )
  },
  {
    type: "toggleHeading2",
    icon: ChevronDown,
    label: "Toggle Heading 2",
    description: "Medium section heading that can be collapsed.",
    preview: (
      <div className="p-2 bg-background border rounded-md">
        <div className="flex items-center gap-1 mb-2">
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
          <div className="h-6 w-1/2 bg-muted rounded" />
        </div>
        <div className="pl-6 h-2 w-full bg-muted/30 rounded" />
      </div>
    )
  },
  {
    type: "toggleHeading3",
    icon: ChevronDown,
    label: "Toggle Heading 3",
    description: "Small section heading that can be collapsed.",
    preview: (
      <div className="p-2 bg-background border rounded-md">
        <div className="flex items-center gap-1 mb-2">
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
          <div className="h-5 w-1/2 bg-muted rounded" />
        </div>
        <div className="pl-5 h-2 w-full bg-muted/30 rounded" />
      </div>
    )
  },
  {
    type: "bulletList",
    icon: List,
    label: "Bulleted list",
    shortcut: EDITOR_SHORTCUTS.TURN_INTO_BULLET?.keys,
    description: "Create a simple bulleted list.",
    preview: (
      <div className="p-2 bg-background border rounded-md space-y-2">
        <div className="flex gap-2 items-center">
          <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
          <div className="h-2 w-3/4 bg-muted rounded" />
        </div>
        <div className="flex gap-2 items-center">
          <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
          <div className="h-2 w-1/2 bg-muted rounded" />
        </div>
      </div>
    )
  },
  {
    type: "numberedList",
    icon: ListOrdered,
    label: "Numbered list",
    shortcut: EDITOR_SHORTCUTS.TURN_INTO_NUMBER?.keys,
    description: "Create a list with numbering.",
    preview: (
      <div className="p-2 bg-background border rounded-md space-y-2">
        <div className="flex gap-2 items-center">
          <span className="text-xs text-muted-foreground">1.</span>
          <div className="h-2 w-3/4 bg-muted rounded" />
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-xs text-muted-foreground">2.</span>
          <div className="h-2 w-1/2 bg-muted rounded" />
        </div>
      </div>
    )
  },
  {
    type: "todo",
    icon: CheckSquare,
    label: "To-do list",
    shortcut: EDITOR_SHORTCUTS.TURN_INTO_TODO?.keys,
    description: "Track tasks with a to-do list.",
    preview: (
      <div className="p-2 bg-background border rounded-md space-y-2">
        <div className="flex gap-2 items-center">
          <div className="h-3 w-3 border rounded" />
          <div className="h-2 w-3/4 bg-muted rounded" />
        </div>
        <div className="flex gap-2 items-center">
          <div className="h-3 w-3 border rounded bg-primary text-primary-foreground flex items-center justify-center">
            <div className="h-1.5 w-1.5 bg-current rounded-sm" />
          </div>
          <div className="h-2 w-1/2 bg-muted rounded line-through opacity-50" />
        </div>
      </div>
    )
  },
  {
    type: "toggle",
    icon: ToggleLeft,
    label: "Toggle list",
    shortcut: EDITOR_SHORTCUTS.TURN_INTO_TOGGLE?.keys,
    description: "Toggles can hide and show content inside.",
    preview: (
      <div className="p-2 bg-background border rounded-md">
        <div className="flex gap-1 items-center mb-1">
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
          <div className="h-2 w-3/4 bg-muted rounded" />
        </div>
        <div className="pl-5 space-y-1">
          <div className="h-2 w-1/2 bg-muted/50 rounded" />
          <div className="h-2 w-1/3 bg-muted/50 rounded" />
        </div>
      </div>
    )
  },
  {
    type: "code",
    icon: Code,
    label: "Code",
    shortcut: EDITOR_SHORTCUTS.TURN_INTO_CODE?.keys,
    description: "Capture a code snippet.",
    preview: (
      <div className="p-2 bg-muted rounded-md font-mono text-xs">
        <span className="text-blue-500">function</span> <span className="text-yellow-500">hello</span>() {"{"}
        <br />&nbsp;&nbsp;<span className="text-purple-500">console</span>.log(<span className="text-green-500">"world"</span>);
        <br />{"}"}
      </div>
    )
  },
  {
    type: "quote",
    icon: Quote,
    label: "Quote",
    shortcut: EDITOR_SHORTCUTS.TURN_INTO_QUOTE?.keys,
    description: "Capture a quote.",
    preview: (
      <div className="p-2 bg-background border rounded-md flex gap-2">
        <div className="w-1 h-full bg-foreground rounded-full" />
        <div className="italic text-muted-foreground text-sm">
          "The only way to do great work is to love what you do."
        </div>
      </div>
    )
  },
  {
    type: "callout",
    icon: AlertCircle,
    label: "Callout",
    description: "Make text stand out.",
    preview: (
      <div className="p-2 bg-muted/50 rounded-md flex gap-2 items-start">
        <Info className="h-4 w-4 text-foreground mt-0.5" />
        <div className="space-y-1">
          <div className="h-2 w-full bg-muted-foreground/20 rounded" />
          <div className="h-2 w-3/4 bg-muted-foreground/20 rounded" />
        </div>
      </div>
    )
  },
];

const textColors = [
  { value: "default", label: "Default", class: "" },
  { value: "gray", label: "Gray", class: "text-gray-500" },
  { value: "brown", label: "Brown", class: "text-amber-700" },
  { value: "orange", label: "Orange", class: "text-orange-500" },
  { value: "yellow", label: "Yellow", class: "text-yellow-500" },
  { value: "green", label: "Green", class: "text-green-500" },
  { value: "blue", label: "Blue", class: "text-blue-500" },
  { value: "purple", label: "Purple", class: "text-purple-500" },
  { value: "pink", label: "Pink", class: "text-pink-500" },
  { value: "red", label: "Red", class: "text-red-500" },
];

const backgroundColors = [
  { value: "default", label: "Default", class: "" },
  { value: "gray", label: "Gray background", class: "bg-gray-100 dark:bg-gray-800" },
  { value: "brown", label: "Brown background", class: "bg-amber-100 dark:bg-amber-900/30" },
  { value: "orange", label: "Orange background", class: "bg-orange-100 dark:bg-orange-900/30" },
  { value: "yellow", label: "Yellow background", class: "bg-yellow-100 dark:bg-yellow-900/30" },
  { value: "green", label: "Green background", class: "bg-green-100 dark:bg-green-900/30" },
  { value: "blue", label: "Blue background", class: "bg-blue-100 dark:bg-blue-900/30" },
  { value: "purple", label: "Purple background", class: "bg-purple-100 dark:bg-purple-900/30" },
  { value: "pink", label: "Pink background", class: "bg-pink-100 dark:bg-pink-900/30" },
  { value: "red", label: "Red background", class: "bg-red-100 dark:bg-red-900/30" },
];

function getBlockTypeLabel(type: BlockType): string {
  const option = turnIntoOptions.find(o => o.type === type);
  return option?.label || "Text";
}

function getBlockTypeIcon(type: BlockType) {
  const option = turnIntoOptions.find(o => o.type === type);
  return option?.icon || Type;
}

export function BlockContextMenu({
  children,
  block,
  onTurnInto,
  onDuplicate,
  onDelete,
  onCopyLink,
  onColorChange,
  onCopySyncedBlock,
  open,
  onOpenChange,
}: BlockContextMenuProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [lastUsedColor, setLastUsedColor] = useState<{ text?: string, bg?: string } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('lastUsedColor');
    if (stored) setLastUsedColor(JSON.parse(stored));
  }, []);

  const handleColorSelect = (text?: string, bg?: string) => {
    onColorChange(text, bg);
    const newVal = { text, bg };
    setLastUsedColor(newVal);
    localStorage.setItem('lastUsedColor', JSON.stringify(newVal));
  };

  const allActions = [
    // Turn Into Options
    ...turnIntoOptions.map(opt => ({
      id: `turn-${opt.type}`,
      label: `Turn into ${opt.label}`,
      icon: opt.icon,
      action: () => onTurnInto(opt.type),
      shortcut: opt.shortcut
    })),
    // Standard Actions
    { id: 'delete', label: 'Delete', icon: Trash2, action: onDelete, shortcut: EDITOR_SHORTCUTS.DELETE?.keys },
    { id: 'duplicate', label: 'Duplicate', icon: Copy, action: onDuplicate, shortcut: EDITOR_SHORTCUTS.DUPLICATE?.keys },
    { id: 'copy-link', label: 'Copy link', icon: Link2, action: onCopyLink, shortcut: EDITOR_SHORTCUTS.COPY_LINK?.keys },
    // Colors (simplified for search - maybe group or just match name)
    ...textColors.filter(c => c.value !== 'default').map(c => ({
      id: `color-${c.value}`,
      label: `Color: ${c.label}`,
      icon: Palette,
      action: () => handleColorSelect(c.value, block.backgroundColor),
      shortcut: undefined
    })),
    ...backgroundColors.filter(c => c.value !== 'default').map(c => ({
      id: `bg-${c.value}`,
      label: `Background: ${c.label}`,
      icon: Palette,
      action: () => handleColorSelect(block.textColor, c.value),
      shortcut: undefined
    })),
  ];

  const filteredActions = searchTerm
    ? allActions.filter(action => action.label.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  const BlockIcon = getBlockTypeIcon(block.type);

  // Helper to render turn into item with preview
  const renderTurnIntoItem = (option: TurnIntoOption) => (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <ContextMenuItem
          onClick={() => onTurnInto(option.type)}
          className={cn(block.type === option.type && "bg-accent", "cursor-pointer")}
        >
          <option.icon className="mr-2 h-4 w-4" />
          {option.label}
          {option.shortcut && <ContextMenuShortcut>{option.shortcut}</ContextMenuShortcut>}
        </ContextMenuItem>
      </HoverCardTrigger>
      <HoverCardContent side="right" className="w-64 p-3" align="start">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <option.icon className="h-4 w-4" />
            {option.label}
          </div>
          <div className="text-xs text-muted-foreground">
            {option.description}
          </div>
          <div className="pt-2 border-t">
            <div className="text-xs font-medium text-muted-foreground/70 mb-1.5 uppercase tracking-wider">Preview</div>
            <div className="ml-1 scale-95 origin-top-left opacity-80">
              {option.preview}
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );

  return (
    <ContextMenu open={open} onOpenChange={onOpenChange}>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-72">
        {/* Search */}
        <div className="px-2 py-1.5 border-b mb-1">
          <Input
            type="text"
            placeholder="Search actions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 text-sm border-none shadow-none focus-visible:ring-0 px-0"
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {searchTerm ? (
          <div className="max-h-80 overflow-y-auto">
            {filteredActions.length > 0 ? (
              filteredActions.map(action => (
                <ContextMenuItem key={action.id} onClick={action.action}>
                  <action.icon className="mr-2 h-4 w-4" />
                  {action.label}
                  {action.shortcut && <ContextMenuShortcut>{action.shortcut}</ContextMenuShortcut>}
                </ContextMenuItem>
              ))
            ) : (
              <div className="px-2 py-2 text-xs text-muted-foreground text-center">
                No actions found
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Last Used Color */}
            {lastUsedColor && (lastUsedColor.text || lastUsedColor.bg) && (
              <ContextMenuItem onClick={() => handleColorSelect(lastUsedColor.text, lastUsedColor.bg)}>
                <div className="mr-2 h-4 w-4 rounded-full border bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <div className={cn("h-2 w-2 rounded-full", lastUsedColor.bg ? lastUsedColor.bg.replace("bg-", "bg-") : "bg-foreground")} />
                </div>
                Last used color
              </ContextMenuItem>
            )}

            <ContextMenuItem disabled className="text-muted-foreground opacity-50">
              <BlockIcon className="mr-2 h-4 w-4" />
              {getBlockTypeLabel(block.type)}
            </ContextMenuItem>

            <ContextMenuSeparator />

            {/* Turn into submenu */}
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <RefreshCw className="mr-2 h-4 w-4" />
                Turn into
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-56 max-h-80 overflow-y-auto">
                {turnIntoOptions.map((option) => (
                  <div key={option.type}>
                    {renderTurnIntoItem(option)}
                  </div>
                ))}
              </ContextMenuSubContent>
            </ContextMenuSub>

            {/* Color submenu */}
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <Palette className="mr-2 h-4 w-4" />
                Color
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-56 max-h-96 overflow-y-auto">
                <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                  TEXT COLOR
                </div>
                {textColors.map((color) => (
                  <ContextMenuItem
                    key={`text-${color.value}`}
                    onClick={() => handleColorSelect(color.value === "default" ? undefined : color.value, block.backgroundColor)}
                    className={cn(block.textColor === color.value && "bg-accent")}
                  >
                    <span className={cn("mr-2 h-4 w-4 rounded border flex items-center justify-center text-xs font-bold", color.class)}>
                      A
                    </span>
                    {color.label}
                  </ContextMenuItem>
                ))}

                <ContextMenuSeparator />

                <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                  BACKGROUND COLOR
                </div>
                {backgroundColors.map((color) => (
                  <ContextMenuItem
                    key={`bg-${color.value}`}
                    onClick={() => handleColorSelect(block.textColor, color.value === "default" ? undefined : color.value)}
                    className={cn(block.backgroundColor === color.value && "bg-accent")}
                  >
                    <span className={cn("mr-2 h-4 w-4 rounded border", color.class)} />
                    {color.label}
                  </ContextMenuItem>
                ))}
              </ContextMenuSubContent>
            </ContextMenuSub>

            <ContextMenuSeparator />

            {/* Standard Actions */}
            <ContextMenuItem onClick={onCopyLink}>
              <Link2 className="mr-2 h-4 w-4" />
              Copy link to block
              <ContextMenuShortcut>{EDITOR_SHORTCUTS.COPY_LINK?.keys}</ContextMenuShortcut>
            </ContextMenuItem>

            <ContextMenuItem onClick={onDuplicate}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
              <ContextMenuShortcut>{EDITOR_SHORTCUTS.DUPLICATE?.keys}</ContextMenuShortcut>
            </ContextMenuItem>

            <ContextMenuItem onClick={onCopySyncedBlock}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Copy as Synced Block
            </ContextMenuItem>

            <ContextMenuSeparator />

            <ContextMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
              <ContextMenuShortcut>{EDITOR_SHORTCUTS.DELETE?.keys}</ContextMenuShortcut>
            </ContextMenuItem>

            {/* Ask AI */}
            <ContextMenuItem disabled>
              <Sparkles className="mr-2 h-4 w-4" />
              Ask AI
              <ContextMenuShortcut>{EDITOR_SHORTCUTS.ASK_AI?.keys}</ContextMenuShortcut>
            </ContextMenuItem>

            {/* Last Edited Footer */}
            <div className="mt-2 border-t pt-2 pb-1 px-2 text-[10px] text-muted-foreground/60 flex items-center gap-1.5 select-none">
              <Clock className="h-3 w-3" />
              <span>
                Last edited by You • {block.updatedAt ? formatDistanceToNow(new Date(block.updatedAt), { addSuffix: true }) : "Just now"}
              </span>
            </div>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
