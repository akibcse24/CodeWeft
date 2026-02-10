import { Block, BlockType, Comment } from "@/types/editor.types";
// Re-export types for backward compatibility
export type { Block, BlockType, Comment } from "@/types/editor.types";
import { SyncedBlock } from "./SyncedBlock";
import React, { useState, useCallback, useRef, KeyboardEvent, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Table, AlertCircle, Lightbulb, GripVertical, Plus, Trash2,
  Link, ToggleLeft, Bookmark, Info, ChevronDown, ChevronRight, Columns2, Columns3,
  Database, FileText, CheckSquare, ListOrdered, Type, Heading1, Heading2,
  Heading3, List, Code, Calculator, Image, Minus, Quote,
  Layout, HelpCircle, File, MessageSquare, FileStack, Network, Sparkles, Wand2, Highlighter,
  Copy, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import katex from "katex";
import "katex/dist/katex.min.css";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useAI } from "@/hooks/useAI";
import { useAuth } from "@/hooks/useAuth";
import { runAgentLoop } from "@/services/agent.service";
import { extractTextFromBlocks } from "@/lib/block-utils";
import { InlineToolbar } from "./InlineToolbar";
import { BlockContextMenu } from "./BlockContextMenu";
import { getTextColorClass, getBackgroundColorClass } from "@/lib/editor-utils";
import { LanguageSelector } from "./LanguageSelector";
import { ToggleHeading } from "./ToggleHeading";
import { ColumnLayout } from "./ColumnLayout";
import { toast } from "@/hooks/use-toast";
import {
  updateBlocksRecursive,
  deleteBlockRecursive,
  addBlockAfterRecursive,
  duplicateBlockRecursive,
  findBlockRecursive
} from "@/lib/block-utils";
import { EDITOR_SHORTCUTS, matchesShortcut } from "@/lib/ShortcutRegistry";

// Import enhanced Notion-like components
import { BlockTypeSelector } from './BlockTypeSelector';
import { CodeLanguageSelector } from './CodeLanguageSelector';
import { SlashCommandMenu as NotionSlashMenu } from './SlashCommandMenu';
import { DiagramBlock } from './blocks/DiagramBlock';
import { TableBlock } from './blocks/TableBlock';
import { DatabaseViewBlock } from './blocks/DatabaseViewBlock';
import { BookmarkBlock } from './blocks/BookmarkBlock';
// import { Comment, BlockType, Block } from '@/types/editor.types'; // Removed duplicate
import { WikiLinkMenu } from './WikiLinkMenu';
import { MentionMenu } from './MentionMenu';
import { useTextSelection } from '@/hooks/useTextSelection';
import { AIAssistant } from './AIAssistant';
import { sanitizeHtml } from "@/lib/sanitize";

import { Tables } from "@/integrations/supabase/types";




type Page = Tables<"pages">;


interface BlockEditorProps {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
  readOnly?: boolean;
  pages?: Page[]; // For wiki linking
  onNavigate?: (pageId: string) => void;
  onCreatePage?: (title: string) => void; // For proper client-side navigation
}

const blockTypes = [
  { type: "paragraph" as const, icon: "Type", label: "Text", shortcut: "p", description: "Plain text paragraph", category: "basic" as const },
  { type: "heading1" as const, icon: "Heading1", label: "Heading 1", shortcut: "h1", description: "Large section heading", category: "text" as const },
  { type: "heading2" as const, icon: "Heading2", label: "Heading 2", shortcut: "h2", description: "Medium section heading", category: "text" as const },
  { type: "heading3" as const, icon: "Heading3", label: "Heading 3", shortcut: "h3", description: "Small section heading", category: "text" as const },
  { type: "todo" as const, icon: "CheckSquare", label: "To-do", shortcut: "todo", description: "Checkbox item", category: "list" as const },
  { type: "bulletList" as const, icon: "List", label: "Bullet List", shortcut: "ul", description: "Unordered list", category: "list" as const },
  { type: "numberedList" as const, icon: "ListOrdered", label: "Numbered List", shortcut: "ol", description: "Ordered list", category: "list" as const },
  { type: "quote" as const, icon: "Quote", label: "Quote", shortcut: "quote", description: "Quoted text", category: "text" as const },
  { type: "code" as const, icon: "Code", label: "Code Block", shortcut: "code", description: "Syntax highlighted code", category: "advanced" as const },
  { type: "math" as const, icon: "Calculator", label: "Math Equation", shortcut: "math", description: "LaTeX formula", category: "advanced" as const },
  { type: "callout" as const, icon: "AlertCircle", label: "Callout", shortcut: "callout", description: "Highlighted note", category: "advanced" as const },
  { type: "toggle" as const, icon: "ChevronRight", label: "Toggle", shortcut: "toggle", description: "Collapsible content", category: "advanced" as const },
  { type: "columns2" as const, icon: "Columns2", label: "2 Columns", shortcut: "col2", description: "Two column layout", category: "layout" as const },
  { type: "columns3" as const, icon: "Columns3", label: "3 Columns", shortcut: "col3", description: "Three column layout", category: "layout" as const },
  { type: "table" as const, icon: "Table", label: "Table", shortcut: "table", description: "Interactive table", category: "database" as const },
  { type: "database-view" as const, icon: "Database", label: "Database View", shortcut: "db", description: "Linked database", category: "database" as const },
  { type: "bookmark" as const, icon: "Bookmark", label: "Bookmark", shortcut: "book", description: "Web link preview", category: "media" as const },
  { type: "file" as const, icon: "FileText", label: "File", shortcut: "file", description: "Upload file", category: "media" as const },
  { type: "divider" as const, icon: "Minus", label: "Divider", shortcut: "hr", description: "Horizontal line", category: "basic" as const },
  { type: "diagram" as const, icon: "FileStack", label: "Diagram", shortcut: "diagram", description: "Mermaid diagram", category: "advanced" as const },
  { type: "synced_container" as const, icon: "Network", label: "Paste Synced Block", shortcut: "sync", description: "Paste mirror of copied block", category: "advanced" as const },
  { type: "ai-summarize" as const, icon: "Sparkles", label: "AI Summarize", shortcut: "sum", description: "Summarize this note", category: "advanced" as const },
  { type: "ai-continue" as const, icon: "Wand2", label: "AI Continue", shortcut: "cont", description: "Let AI continue writing", category: "advanced" as const },
  { type: "ai-improve" as const, icon: "Highlighter", label: "AI Improve", shortcut: "imp", description: "Better clarity & style", category: "advanced" as const },
];


function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

// Local SlashCommandMenu removed in favor of imported NotionSlashMenu

interface BlockItemContentProps {
  block: Block;
  onChange: (updates: Partial<Block>) => void;
  onDelete: () => void;
  onAddAfter: (type?: BlockType) => void;
  onDuplicate: () => void;
  onTurnInto: (type: BlockType) => void;
  onCopyLink: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => void;
  onPaste?: (e: React.ClipboardEvent) => void;
  isActive: boolean;
  onFocus: () => void;
  readOnly?: boolean;
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
  dropSide?: "left" | "right" | "top" | "bottom" | "inside" | null;
  isDragOver?: boolean;
  // State handlers needed for recursive calls
  activeBlockId: string | null;
  setActiveBlockId: (id: string | null) => void;
  updateBlock: (id: string, updates: Partial<Block>) => void;
  deleteBlock: (id: string) => void;
  addBlockAfter: (id: string, type?: BlockType) => void;
  duplicateBlock: (id: string) => void;
  turnBlockInto: (id: string, type: BlockType) => void;
  copyBlockLink: (id: string) => void;
  handleKeyDown: (id: string, e: React.KeyboardEvent<HTMLElement>) => void;
  dragOverId: string | null;
  copySyncedBlock: (id: string) => void;
  onCopySyncedBlock: () => void;
  getBlock: (id: string) => Block | undefined;
  onNavigate?: (pageId: string) => void;
  onCreatePage?: (title: string) => void;
  // Context menu control
  contextMenuOpen?: boolean;
  onContextMenuOpenChange?: (open: boolean) => void;
  handleInput?: (id: string, e: React.FormEvent<HTMLElement>) => void;
  onInput?: (e: React.FormEvent<HTMLElement>) => void;
}

interface SortableBlockItemProps {
  block: Block;
  onChange: (updates: Partial<Block>) => void;
  onDelete: () => void;
  onAddAfter: (type?: BlockType) => void;
  onDuplicate: () => void;
  onTurnInto: (type: BlockType) => void;
  onCopyLink: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => void;
  onPaste?: (e: React.ClipboardEvent) => void;
  isActive: boolean;
  onFocus: () => void;
  readOnly?: boolean;
  dropSide?: "top" | "bottom" | "left" | "right" | "inside" | null;
  isDragOver?: boolean;
  // Selection state
  isSelected?: boolean;
  onToggleSelection?: (isCtrlClick: boolean, isShiftClick: boolean) => void;
  // State handlers needed for recursive calls
  activeBlockId: string | null;
  setActiveBlockId: (id: string | null) => void;
  updateBlock: (id: string, updates: Partial<Block>) => void;
  deleteBlock: (id: string) => void;
  addBlockAfter: (id: string, type?: BlockType) => void;
  duplicateBlock: (id: string) => void;
  turnBlockInto: (id: string, type: BlockType) => void;
  copyBlockLink: (id: string) => void;
  handleKeyDown: (id: string, e: React.KeyboardEvent<HTMLElement>) => void;
  dragOverId: string | null;
  copySyncedBlock: (id: string) => void;
  onCopySyncedBlock: () => void;
  getBlock: (id: string) => Block | undefined;
  onNavigate?: (pageId: string) => void;
  onCreatePage?: (title: string) => void;
  // Context menu control
  contextMenuOpen?: boolean;
  onContextMenuOpenChange?: (open: boolean) => void;
  handleInput?: (id: string, e: React.FormEvent<HTMLElement>) => void;
}

const SortableBlockItem = React.forwardRef<HTMLDivElement, SortableBlockItemProps>((props, ref) => {
  const {
    block, isActive, onFocus, readOnly, isDragOver, dropSide, isSelected,
    onChange, onDelete, onAddAfter, onDuplicate, onTurnInto, onCopyLink, onKeyDown, onPaste,
    activeBlockId, setActiveBlockId, updateBlock, deleteBlock, addBlockAfter,
    duplicateBlock, turnBlockInto, copyBlockLink, handleKeyDown, dragOverId,
    copySyncedBlock, onCopySyncedBlock, onNavigate, contextMenuOpen, onContextMenuOpenChange,
    onToggleSelection, handleInput
  } = props;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSorting,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSorting ? 0.5 : 1,
  };

  const setRef = useCallback((node: HTMLDivElement | null) => {
    setNodeRef(node);
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    }
  }, [setNodeRef, ref]);

  const handleClick = (e: React.MouseEvent) => {
    // Handle multi-selection
    if (onToggleSelection && (e.ctrlKey || e.metaKey || e.shiftKey)) {
      e.preventDefault();
      e.stopPropagation();
      onToggleSelection(e.ctrlKey || e.metaKey, e.shiftKey);
    } else {
      onFocus();
    }
  };

  return (
    <div
      ref={setRef}
      style={style}
      id={`block-${block.id}`}
      onClick={handleClick}
      className={cn(
        "relative rounded-lg transition-all",
        isSelected && "ring-2 ring-primary/30 bg-primary/5",
        !isSelected && isActive && "bg-muted/30"
      )}
    >
      {isSelected && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-lg" />
      )}
      <BlockItemContent
        {...{ block, onChange, onDelete, onAddAfter, onDuplicate, onTurnInto, onCopyLink, onKeyDown, onPaste, isActive, onFocus, readOnly, dropSide, isDragOver, onCopySyncedBlock, contextMenuOpen, onContextMenuOpenChange }}
        {...props} // Spread all recursive handlers
        onInput={handleInput ? (e) => handleInput(block.id, e) : undefined}
        dragHandleProps={{ ...attributes, ...listeners }}
      />

      <AnimatePresence initial={false}>
        {((block.type !== "toggle" && !block.type.startsWith("toggleHeading")) || block.isOpen) && block.children && block.children.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="ml-6 mt-1 flex flex-col gap-1 border-l-2 border-primary/10 pl-4 hover:border-primary/30 transition-colors overflow-hidden min-w-0 flex-shrink-0"
            style={{ minWidth: '100px' }}
          >
            <SortableContext items={block.children.map(b => b.id)} strategy={verticalListSortingStrategy}>
              {block.children.map((childBlock) => (
                <SortableBlockItem
                  key={childBlock.id}
                  {...props}
                  block={childBlock}
                  isActive={activeBlockId === childBlock.id}
                  onFocus={() => setActiveBlockId(childBlock.id)}
                  isDragOver={dragOverId === childBlock.id}
                  dropSide={dragOverId === childBlock.id ? props.dropSide : null}
                  onChange={(u) => updateBlock(childBlock.id, u)}
                  onDelete={() => deleteBlock(childBlock.id)}
                  onAddAfter={(t) => addBlockAfter(childBlock.id, t)}
                  onDuplicate={() => duplicateBlock(childBlock.id)}
                  onTurnInto={(t) => turnBlockInto(childBlock.id, t)}
                  onCopyLink={() => copyBlockLink(childBlock.id)}
                  onCopySyncedBlock={() => copySyncedBlock(childBlock.id)}
                  onKeyDown={(e) => handleKeyDown(childBlock.id, e)}
                />
              ))}
            </SortableContext>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
SortableBlockItem.displayName = "SortableBlockItem";

function BlockItemContent({
  block,
  onChange,
  onDelete,
  onAddAfter,
  onDuplicate,
  onTurnInto,
  onCopyLink,
  onKeyDown,
  isActive,
  onFocus,
  readOnly = false,
  isDragging = false,
  dragHandleProps,
  dropSide = null,
  isDragOver = false,
  activeBlockId,
  setActiveBlockId,
  updateBlock,
  deleteBlock,
  addBlockAfter,
  duplicateBlock,
  turnBlockInto,
  copyBlockLink,
  copySyncedBlock,
  handleKeyDown: handleGlobalKeyDown,
  dragOverId,
  onCopySyncedBlock,
  getBlock,
  onNavigate,
  contextMenuOpen,
  onContextMenuOpenChange,
  onPaste,
  onInput,
  handleInput
}: BlockItemContentProps & { dragHandleProps?: React.HTMLAttributes<HTMLButtonElement> }) {
  const recursionHandlers = {
    activeBlockId,
    setActiveBlockId,
    updateBlock,
    deleteBlock,
    addBlockAfter,
    duplicateBlock,
    turnBlockInto,
    copyBlockLink,
    copySyncedBlock,
    handleKeyDown: handleGlobalKeyDown,
    handleInput,
    dragOverId,
    onChange,
    onDelete,
    onAddAfter,
    onDuplicate,
    onTurnInto,
    onCopyLink,
    onCopySyncedBlock,
    onKeyDown,
    getBlock,
    onNavigate,
    contextMenuOpen,
    onContextMenuOpenChange,
  };

  const contentRef = useRef<HTMLDivElement>(null);
  const [showImageInput, setShowImageInput] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [tempUrl, setTempUrl] = useState("");

  const handleContentClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const wikiLink = target.closest('.wiki-link[data-page-id]');
    if (wikiLink) {
      e.preventDefault();
      const pageId = wikiLink.getAttribute('data-page-id');
      if (pageId) {
        if (onNavigate) {
          onNavigate(pageId);
        } else {
          // Fallback: update URL without page reload
          window.history.pushState({}, '', `/notes?page=${pageId}`);
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
      }
    }
  };

  const handleContentChange = useCallback((newContent: string) => {
    onChange({ ...block, content: newContent });
  }, [block, onChange]);

  useEffect(() => {
    if (contentRef.current && onInput) {
      const handler = (e: Event) => onInput(e as unknown as React.FormEvent<HTMLElement>);
      contentRef.current.addEventListener('input', handler);
      return () => contentRef.current?.removeEventListener('input', handler);
    }
  }, [onInput, block.type]);

  useEffect(() => {
    if (isActive && !readOnly && contentRef.current && document.activeElement !== contentRef.current) {
      contentRef.current.focus();
    }
  }, [isActive, block.type, readOnly]);

  const hasComments = block.comments && block.comments.length > 0;

  const renderMath = (latex: string) => {
    try {
      return katex.renderToString(latex, { throwOnError: false, displayMode: true });
    } catch {
      return latex;
    }
  };

  const handleImageSubmit = () => {
    if (tempUrl) {
      onChange({ ...block, imageUrl: tempUrl, content: tempUrl });
      setShowImageInput(false);
      setTempUrl("");
    }
  };

  const handleLinkSubmit = () => {
    if (tempUrl) {
      onChange({ ...block, linkUrl: tempUrl, linkTitle: block.content || tempUrl });
      setShowLinkInput(false);
      setTempUrl("");
    }
  };

  const renderContent = () => {
    switch (block.type) {
      case "heading1":
        return (
          <div
            ref={contentRef}
            contentEditable={!readOnly}
            suppressContentEditableWarning
            onBlur={(e) => handleContentChange(e.currentTarget.innerHTML)}
            onKeyDown={onKeyDown}
            onFocus={onFocus}
            onClick={handleContentClick}
            onPaste={onPaste}
            className="text-3xl font-bold outline-none w-full"
            data-placeholder="Heading 1"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.content) }}
          />

        );
      case "heading2":
        return (
          <div
            ref={contentRef}
            contentEditable={!readOnly}
            suppressContentEditableWarning
            onBlur={(e) => handleContentChange(e.currentTarget.innerHTML)}
            onKeyDown={onKeyDown}
            onFocus={onFocus}
            onClick={handleContentClick}
            onPaste={onPaste}
            className="text-2xl font-semibold outline-none w-full"
            data-placeholder="Heading 2"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.content) }}
          />

        );
      case "heading3":
        return (
          <div
            ref={contentRef}
            contentEditable={!readOnly}
            suppressContentEditableWarning
            onBlur={(e) => handleContentChange(e.currentTarget.innerHTML)}
            onKeyDown={onKeyDown}
            onFocus={onFocus}
            onClick={handleContentClick}
            onPaste={onPaste}
            className="text-xl font-medium outline-none w-full"
            data-placeholder="Heading 3"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.content) }}
          />

        );
      case "bulletList":
        return (
          <div className="flex items-start gap-2">
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-foreground shrink-0" />
            <div
              ref={contentRef}
              contentEditable={!readOnly}
              suppressContentEditableWarning
              onBlur={(e) => handleContentChange(e.currentTarget.innerHTML)}
              onKeyDown={onKeyDown}
              onFocus={onFocus}
              onClick={handleContentClick}
              onPaste={onPaste}
              className="outline-none w-full"
              data-placeholder="List item"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.content) }}
            />

          </div>
        );
      case "numberedList":
        return (
          <div className="flex items-start gap-2">
            <span className="text-muted-foreground shrink-0 font-medium">1.</span>
            <div
              ref={contentRef}
              contentEditable={!readOnly}
              suppressContentEditableWarning
              onBlur={(e) => handleContentChange(e.currentTarget.innerHTML)}
              onKeyDown={onKeyDown}
              onFocus={onFocus}
              onClick={handleContentClick}
              onPaste={onPaste}
              className="outline-none w-full"
              data-placeholder="List item"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.content) }}
            />

          </div>
        );
      case "todo":
        return (
          <div className="flex items-start gap-2">
            <button
              onClick={() => !readOnly && onChange({ ...block, checked: !block.checked })}
              className={cn(
                "mt-1 h-4 w-4 rounded border shrink-0 flex items-center justify-center transition-colors",
                block.checked ? "bg-primary border-primary" : "border-muted-foreground hover:border-primary"
              )}
            >
              {block.checked && <CheckSquare className="h-3 w-3 text-primary-foreground" />}
            </button>
            <div
              ref={contentRef}
              contentEditable={!readOnly}
              suppressContentEditableWarning
              onBlur={(e) => handleContentChange(e.currentTarget.innerHTML)}
              onKeyDown={onKeyDown}
              onFocus={onFocus}
              onClick={handleContentClick}
              onPaste={onPaste}
              className={cn(
                "outline-none w-full",
                block.checked && "line-through text-muted-foreground"
              )}
              data-placeholder="To-do item"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.content) }}
            />

          </div>
        );
      case "toggle":
        return (
          <div className="flex items-start gap-2">
            <button
              contentEditable={false}
              onClick={() => !readOnly && onChange({ ...block, isOpen: !block.isOpen })}
              className="mt-1 p-0.5 hover:bg-muted rounded transition-colors"
            >
              <ChevronRight className={cn("h-4 w-4 transition-transform", block.isOpen && "rotate-90")} />
            </button>
            <div
              ref={contentRef}
              contentEditable={!readOnly}
              suppressContentEditableWarning
              onBlur={(e) => handleContentChange(e.currentTarget.innerHTML)}
              onKeyDown={onKeyDown}
              onFocus={onFocus}
              onClick={handleContentClick}
              onPaste={onPaste}
              className="outline-none w-full"
              data-placeholder="Toggle"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.content) }}
            />

          </div>
        );
      case "synced_container":
      case "synced-container":
        return (
          <div className="relative group">
            <SyncedBlock
              block={block}
              originalBlock={block.metadata?.originalBlockId ? getBlock(block.metadata.originalBlockId as string) : undefined}
              renderBlock={(b) => (
                <SortableBlockItem
                  key={b.id}
                  block={b}
                  onChange={(updated) => updateBlock(b.id, updated)} // Update original block
                  onDelete={() => deleteBlock(b.id)}
                  onAddAfter={(type) => addBlockAfter(b.id, type)}
                  onDuplicate={() => duplicateBlock(b.id)}
                  onTurnInto={(type) => turnBlockInto(b.id, type)}
                  onCopyLink={() => copyBlockLink(b.id)}
                  copySyncedBlock={copySyncedBlock}
                  onCopySyncedBlock={() => copySyncedBlock(b.id)}
                  onKeyDown={(e) => handleGlobalKeyDown(b.id, e)}
                  isActive={activeBlockId === b.id}
                  onFocus={() => setActiveBlockId(b.id)}
                  {...recursionHandlers}
                />
              )}
            />
            {/* Render children if it acts as a container too? Usually synced block is a mirror. 
                 If we allow adding children TO a synced block (wrapping it), we might render them below?
                 For now, assume Synced Block is a leaf/mirror. 
                 If it has children, they are children of the ORIGINAL block (handled by SortableBlockItem recursion). 
                 So we don't need to render block.children here unless it's a separate container.
             */}
          </div>
        );
      case "code":
        return (
          <div className="rounded-lg overflow-hidden border">
            <div className="bg-muted px-3 py-1.5 border-b flex items-center justify-between">
              <LanguageSelector
                value={block.language || "javascript"}
                onChange={(value) => onChange({ ...block, language: value })}
                onCopy={() => navigator.clipboard.writeText(block.content)}
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => navigator.clipboard.writeText(block.content)}
                disabled={readOnly}
              >
                <Plus className="h-4 w-4 rotate-45" />
              </Button>
            </div>
            <CodeMirror
              value={block.content}
              height="auto"
              minHeight="100px"
              extensions={[block.language === "python" ? python() : javascript()]}
              onChange={(value) => handleContentChange(value)}
              className="text-sm"
              theme="dark"
              readOnly={readOnly}
            />
          </div>
        );
      case "toggleHeading1":
        return (
          <ToggleHeading
            level={1}
            content={block.content}
            isOpen={block.isOpen ?? false}
            onToggle={() => onChange({ ...block, isOpen: !block.isOpen })}
            onContentChange={handleContentChange}
            onKeyDown={onKeyDown}
            onFocus={onFocus}
            readOnly={readOnly}
          />
        );
      case "toggleHeading2":
        return (
          <ToggleHeading
            level={2}
            content={block.content}
            isOpen={block.isOpen ?? false}
            onToggle={() => onChange({ ...block, isOpen: !block.isOpen })}
            onContentChange={handleContentChange}
            onKeyDown={onKeyDown}
            onFocus={onFocus}
            readOnly={readOnly}
          />
        );
      case "toggleHeading3":
        return (
          <ToggleHeading
            level={3}
            content={block.content}
            isOpen={block.isOpen ?? false}
            onToggle={() => onChange({ ...block, isOpen: !block.isOpen })}
            onContentChange={handleContentChange}
            onKeyDown={onKeyDown}
            onFocus={onFocus}
            readOnly={readOnly}
          />
        );
      case "columns2":
        return (
          <ColumnLayout
            columns={2}
            columnData={block.columns}
            renderBlock={(b) => (
              <SortableBlockItem
                key={b.id}
                block={b}
                onChange={(updated) => {
                  const newCols = [...(block.columns || [[], []])];
                  newCols[0] = newCols[0].map(item => item.id === b.id ? { ...item, ...updated } : item);
                  newCols[1] = newCols[1].map(item => item.id === b.id ? { ...item, ...updated } : item);
                  onChange({ ...block, columns: newCols });
                }}
                onDelete={() => {
                  const newCols = [...(block.columns || [[], []])];
                  newCols[0] = newCols[0].filter(item => item.id !== b.id);
                  newCols[1] = newCols[1].filter(item => item.id !== b.id);
                  onChange({ ...block, columns: newCols });
                }}
                onAddAfter={() => {
                  const newCols = [...(block.columns || [[], []])];
                  const colIdx = newCols[0].some(item => item.id === b.id) ? 0 : 1;
                  const itemIdx = newCols[colIdx].findIndex(item => item.id === b.id);
                  const newBlock = { id: generateId(), type: "paragraph" as const, content: "" };
                  newCols[colIdx].splice(itemIdx + 1, 0, newBlock);
                  onChange({ ...block, columns: newCols });
                }}
                onDuplicate={() => {
                  const newCols = [...(block.columns || [[], []])];
                  const colIdx = newCols[0].some(item => item.id === b.id) ? 0 : 1;
                  const itemIdx = newCols[colIdx].findIndex(item => item.id === b.id);
                  const newBlock = { ...b, id: generateId() };
                  newCols[colIdx].splice(itemIdx + 1, 0, newBlock);
                  onChange({ ...block, columns: newCols });
                }}
                onTurnInto={(type) => turnBlockInto(b.id, type)}
                onCopyLink={() => copyBlockLink(b.id)}
                copySyncedBlock={copySyncedBlock}
                onCopySyncedBlock={() => copySyncedBlock(b.id)}
                onKeyDown={(e) => handleGlobalKeyDown(b.id, e)}
                isActive={activeBlockId === b.id}
                onFocus={() => setActiveBlockId(b.id)}
                // Pass handlers for recursion
                activeBlockId={activeBlockId}
                setActiveBlockId={setActiveBlockId}
                updateBlock={updateBlock}
                deleteBlock={deleteBlock}
                addBlockAfter={addBlockAfter}
                duplicateBlock={duplicateBlock}
                turnBlockInto={turnBlockInto}
                copyBlockLink={copyBlockLink}
                handleKeyDown={handleGlobalKeyDown}
                dragOverId={dragOverId}
                getBlock={getBlock}
                onNavigate={onNavigate}
              />
            )}
            readOnly={readOnly}
          />
        );
      case "columns3":
        return (
          <ColumnLayout
            columns={3}
            columnData={block.columns}
            renderBlock={(b) => (
              <SortableBlockItem
                key={b.id}
                block={b}
                onChange={(updated) => {
                  const newCols = [...(block.columns || [[], [], []])];
                  newCols[0] = newCols[0].map(item => item.id === b.id ? { ...item, ...updated } : item);
                  newCols[1] = newCols[1].map(item => item.id === b.id ? { ...item, ...updated } : item);
                  newCols[2] = newCols[2].map(item => item.id === b.id ? { ...item, ...updated } : item);
                  onChange({ ...block, columns: newCols });
                }}
                onDelete={() => {
                  const newCols = [...(block.columns || [[], [], []])];
                  newCols[0] = newCols[0].filter(item => item.id !== b.id);
                  newCols[1] = newCols[1].filter(item => item.id !== b.id);
                  newCols[2] = newCols[2].filter(item => item.id !== b.id);
                  onChange({ ...block, columns: newCols });
                }}
                onAddAfter={() => {
                  const newCols = [...(block.columns || [[], [], []])];
                  const colIdx = newCols[0].some(item => item.id === b.id) ? 0 : newCols[1].some(item => item.id === b.id) ? 1 : 2;
                  const itemIdx = newCols[colIdx].findIndex(item => item.id === b.id);
                  const newBlock = { id: generateId(), type: "paragraph" as const, content: "" };
                  newCols[colIdx].splice(itemIdx + 1, 0, newBlock);
                  onChange({ ...block, columns: newCols });
                }}
                onDuplicate={() => {
                  const newCols = [...(block.columns || [[], [], []])];
                  const colIdx = newCols[0].some(item => item.id === b.id) ? 0 : newCols[1].some(item => item.id === b.id) ? 1 : 2;
                  const itemIdx = newCols[colIdx].findIndex(item => item.id === b.id);
                  const newBlock = { ...b, id: generateId() };
                  newCols[colIdx].splice(itemIdx + 1, 0, newBlock);
                  onChange({ ...block, columns: newCols });
                }}
                onTurnInto={(type) => turnBlockInto(b.id, type)}
                onCopyLink={() => copyBlockLink(b.id)}
                copySyncedBlock={copySyncedBlock}
                onCopySyncedBlock={() => copySyncedBlock(b.id)}
                onKeyDown={(e) => handleGlobalKeyDown(b.id, e)}
                isActive={activeBlockId === b.id}
                onFocus={() => setActiveBlockId(b.id)}
                // Pass handlers for recursion
                activeBlockId={activeBlockId}
                setActiveBlockId={setActiveBlockId}
                updateBlock={updateBlock}
                deleteBlock={deleteBlock}
                addBlockAfter={addBlockAfter}
                duplicateBlock={duplicateBlock}
                turnBlockInto={turnBlockInto}
                copyBlockLink={copyBlockLink}
                handleKeyDown={handleGlobalKeyDown}
                dragOverId={dragOverId}
                getBlock={getBlock}
                onNavigate={onNavigate}
              />
            )}
            readOnly={readOnly}
          />
        );
      case "math":
        return (
          <div className="space-y-2">
            <Input
              type="text"
              value={block.content}
              onChange={(e) => handleContentChange(e.target.value)}
              onKeyDown={onKeyDown}
              onFocus={onFocus}
              placeholder="Enter LaTeX formula... (e.g., x = \frac{-b \pm \sqrt{b^2-4ac}}{2a})"
              className="w-full font-mono text-sm"
              disabled={readOnly}
            />
            {block.content && (
              <div
                className="p-4 bg-muted/50 rounded-md overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: renderMath(block.content) }}
              />

            )}
          </div>
        );
      case "image":
        if (!block.imageUrl && !showImageInput) {
          return (
            <div
              onClick={() => !readOnly && setShowImageInput(true)}
              className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
            >
              <Image className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Click to add an image URL</p>
            </div>
          );
        }
        if (showImageInput) {
          return (
            <div className="space-y-2">
              <Input
                type="url"
                value={tempUrl}
                onChange={(e) => setTempUrl(e.target.value)}
                placeholder="Paste image URL..."
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleImageSubmit}>Add Image</Button>
                <Button size="sm" variant="outline" onClick={() => setShowImageInput(false)}>Cancel</Button>
              </div>
            </div>
          );
        }
        return (
          <div className="relative group">
            <img
              src={block.imageUrl}
              alt={block.content || "Image"}
              className="max-w-full rounded-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x300?text=Image+Error";
              }}
            />
            {!readOnly && (
              <button
                onClick={() => onChange({ ...block, imageUrl: undefined })}
                className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        );
      case "link":
        if (!block.linkUrl && !showLinkInput) {
          return (
            <div
              onClick={() => !readOnly && setShowLinkInput(true)}
              className="border rounded-lg p-4 flex items-center gap-3 cursor-pointer hover:border-primary transition-colors"
            >
              <Link className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Click to add a link</p>
            </div>
          );
        }
        if (showLinkInput) {
          return (
            <div className="space-y-2">
              <Input
                type="url"
                value={tempUrl}
                onChange={(e) => setTempUrl(e.target.value)}
                placeholder="Paste link URL..."
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleLinkSubmit}>Add Link</Button>
                <Button size="sm" variant="outline" onClick={() => setShowLinkInput(false)}>Cancel</Button>
              </div>
            </div>
          );
        }
        return (
          <a
            href={block.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block border rounded-lg p-4 hover:border-primary transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-muted">
                <Link className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate group-hover:text-primary transition-colors">
                  {block.linkTitle || block.linkUrl}
                </p>
                <p className="text-xs text-muted-foreground truncate">{block.linkUrl}</p>
              </div>
            </div>
          </a>
        );
      case "quote":
        return (
          <div className="border-l-4 border-primary pl-4 py-1">
            <div
              ref={contentRef}
              contentEditable={!readOnly}
              suppressContentEditableWarning
              onBlur={(e) => handleContentChange(e.currentTarget.innerHTML)}
              onKeyDown={onKeyDown}
              onFocus={onFocus}
              onClick={handleContentClick}
              onPaste={onPaste}
              className="outline-none w-full italic text-muted-foreground text-lg"
              data-placeholder="Quote"
              dangerouslySetInnerHTML={{ __html: block.content }}
            />
          </div>
        );
      case "divider":
        return <hr className="border-border my-4" />;
      case "callout": {
        const calloutStyles = {
          info: "bg-info/10 border-info text-info",
          warning: "bg-warning/10 border-warning text-warning",
          tip: "bg-success/10 border-success text-success",
          error: "bg-destructive/10 border-destructive text-destructive",
        };
        const CalloutIcons = {
          info: Info,
          warning: AlertCircle,
          tip: Lightbulb,
          error: AlertCircle,
        };
        const CalloutIcon = CalloutIcons[block.calloutType || "info"];
        return (
          <div className={cn(
            "flex gap-3 p-4 rounded-lg border-l-4",
            calloutStyles[block.calloutType || "info"]
          )}>
            <CalloutIcon className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              {!readOnly && (
                <select
                  value={block.calloutType || "info"}
                  onChange={(e) => onChange({ ...block, calloutType: e.target.value as "info" | "warning" | "tip" | "error" })}
                  className="text-xs bg-transparent border-none outline-none cursor-pointer mb-1 font-medium"
                >
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="tip">Tip</option>
                  <option value="error">Error</option>
                </select>
              )}
              <div
                ref={contentRef}
                contentEditable={!readOnly}
                suppressContentEditableWarning
                onBlur={(e) => handleContentChange(e.currentTarget.innerHTML)}
                onKeyDown={onKeyDown}
                onFocus={onFocus}
                onClick={handleContentClick}
                onPaste={onPaste}
                className="outline-none w-full text-foreground"
                data-placeholder="Callout text"
                dangerouslySetInnerHTML={{ __html: block.content }}
              />
            </div>
          </div>
        );
      }
      case "diagram":
        return (
          <DiagramBlock
            content={block.content}
            onChange={(content) => handleContentChange(content)}
            onFocus={onFocus}
            isFocused={isActive}
            readOnly={readOnly}
          />
        );
      case "table":
        return (
          <TableBlock
            block={block}
            onUpdate={(updates) => onChange({ ...block, ...updates })}
            onFocus={onFocus}
            isFocused={isActive}
          />
        );
      case "database-view":
        return (
          <DatabaseViewBlock
            block={block}
            onUpdate={(updates) => onChange({ ...block, ...updates })}
            onFocus={onFocus}
            isFocused={isActive}
          />
        );
      case "bookmark":
        return (
          <BookmarkBlock
            block={block}
            onUpdate={(updates) => onChange({ ...block, ...updates })}
            onFocus={onFocus}
            isFocused={isActive}
          />
        );
      default:
        return (
          <div
            ref={contentRef}
            contentEditable={!readOnly}
            suppressContentEditableWarning
            onBlur={(e) => handleContentChange(e.currentTarget.innerHTML)}
            onKeyDown={onKeyDown}
            onFocus={onFocus}
            onClick={handleContentClick}
            onPaste={onPaste}
            className="outline-none w-full min-h-[24px]"
            data-placeholder="Press 'space' for AI, '/' for commands"
            dangerouslySetInnerHTML={{ __html: block.content }}
          />
        );
    }
  };

  if (readOnly) {
    return (
      <div
        className={cn(
          "group/content relative w-full rounded-md transition-all duration-200",
          isActive && "bg-muted/30 ring-1 ring-primary/5 shadow-sm",
          isDragOver && dropSide === "top" && "border-t-2 border-primary/50",
          isDragOver && dropSide === "bottom" && "border-b-2 border-primary/50",
          getTextColorClass(block.textColor),
          getBackgroundColorClass(block.backgroundColor)
        )}
        style={{
          marginLeft: `${(Number(block.metadata?.indent) || 0) * 24}px`
        }}
      >
        {renderContent()}

        {hasComments && (
          <div className="absolute -right-8 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-40 group-hover/content:opacity-100 transition-opacity cursor-help">
            <MessageSquare className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] font-bold text-primary">{block.comments?.length}</span>
          </div>
        )}
      </div>
    );
  }

  const handleColorChange = (textColor?: string, backgroundColor?: string) => {
    onChange({ ...block, textColor, backgroundColor });
  };

  return (
    <BlockContextMenu
      block={block}
      onTurnInto={onTurnInto}
      onDuplicate={onDuplicate}
      onDelete={onDelete}
      onCopyLink={onCopyLink}
      onColorChange={handleColorChange}
      onCopySyncedBlock={onCopySyncedBlock}
      open={contextMenuOpen}
      onOpenChange={onContextMenuOpenChange}
    >
      <motion.div
        layout
        id={`block-${block.id}`}
        className={cn(
          "group relative py-1 rounded-lg transition-colors overflow-visible flex items-start gap-1",
          getTextColorClass(block.textColor),
          getBackgroundColorClass(block.backgroundColor)
        )}
      >
        {/* Drop Indicator Lines */}
        {isDragOver && dropSide === "top" && (
          <div className="absolute left-0 right-0 -top-0.5 h-[2px] bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)] z-[101] rounded-full" />
        )}
        {isDragOver && dropSide === "bottom" && (
          <div className="absolute left-0 right-0 -bottom-0.5 h-[2px] bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)] z-[101] rounded-full" />
        )}
        {isDragOver && dropSide === "inside" && (
          <div className="absolute inset-0 bg-primary/10 border-2 border-primary/30 rounded-lg z-[101] pointer-events-none" />
        )}

        {/* Block Handles - Left Side */}
        <div className={cn(
          "flex items-center gap-0.5 transition-opacity duration-150 select-none shrink-0 pt-0.5",
          isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}>
          <button
            onClick={() => onAddAfter()}
            className="flex items-center justify-center h-6 w-6 rounded text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/60 transition-colors"
            title="Add block below"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            {...dragHandleProps}
            onClick={(e) => {
              e.stopPropagation();
              if (onContextMenuOpenChange) {
                onContextMenuOpenChange(true);
              }
            }}
            className="flex items-center justify-center h-6 w-6 rounded cursor-grab active:cursor-grabbing touch-none text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/60 transition-colors"
            title="Drag to move or click for menu"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        </div>

        {/* Block Content */}
        <div className="flex-1 min-w-0">
          {renderContent()}
        </div>
      </motion.div>
    </BlockContextMenu>
  );
}

export function BlockEditor({ blocks, onChange, readOnly = false, pages = [], onNavigate, onCreatePage }: BlockEditorProps) {
  const { askAI } = useAI();
  const { user } = useAuth();
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashSearchTerm, setSlashSearchTerm] = useState("");

  const [wikiMenuOpen, setWikiMenuOpen] = useState(false);
  const [wikiSearchTerm, setWikiSearchTerm] = useState("");
  const [wikiMenuIndex, setWikiMenuIndex] = useState(0);

  const [mentionMenuOpen, setMentionMenuOpen] = useState(false);
  const [mentionSearchTerm, setMentionSearchTerm] = useState("");
  const [mentionMenuIndex, setMentionMenuIndex] = useState(0);

  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentingBlockId, setCommentingBlockId] = useState<string | null>(null);

  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [selectedMenuIndex, setSelectedMenuIndex] = useState(0);
  const [dragActiveId, setDragActiveId] = useState<string | null>(null);
  const [dropSide, setDropSide] = useState<"top" | "bottom" | "left" | "right" | "inside" | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [contextMenuOpen, setContextMenuOpen] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize history when blocks change from parent
  useEffect(() => {
    if (historyRef.current.length === 0 ||
      JSON.stringify(historyRef.current[historyIndexRef.current]) !== JSON.stringify(blocks)) {
      if (historyIndexRef.current === 0) {
        historyRef.current = [blocks];
      }
    }
  }, [blocks]);

  // Manual AI Trigger
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [manualAiPos, setManualAiPos] = useState<{ x: number, y: number } | undefined>(undefined);

  // Multi-selection state
  const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(new Set());
  const [lastSelectedBlockId, setLastSelectedBlockId] = useState<string | null>(null);

  // AI Selection
  const {
    text: selectedText,
    position: selectionPosition,
    isVisible: isSelectionVisible,
    clearSelection
  } = useTextSelection(containerRef);

  // History for undo/redo
  const historyRef = useRef<Block[][]>([blocks]);
  const historyIndexRef = useRef<number>(0);
  const isUndoingRef = useRef<boolean>(false);

  const handleAIReplace = useCallback((text: string) => {
    document.execCommand('insertText', false, text);
    clearSelection();
  }, [clearSelection]);

  const handleAIInsert = useCallback((text: string) => {
    document.execCommand('insertText', false, text);
    clearSelection();
  }, [clearSelection]);

  // Block selection helpers
  const toggleBlockSelection = useCallback((blockId: string, isCtrlClick: boolean, isShiftClick: boolean) => {
    setSelectedBlockIds(prev => {
      const newSelection = new Set(prev);

      if (isShiftClick && lastSelectedBlockId) {
        // Shift+click: select range
        const allBlockIds = blocks.map(b => b.id);
        const startIdx = allBlockIds.indexOf(lastSelectedBlockId);
        const endIdx = allBlockIds.indexOf(blockId);
        const [minIdx, maxIdx] = [Math.min(startIdx, endIdx), Math.max(startIdx, endIdx)];

        for (let i = minIdx; i <= maxIdx; i++) {
          newSelection.add(allBlockIds[i]);
        }
      } else if (isCtrlClick || isShiftClick) {
        // Ctrl+click or Cmd+click: toggle selection
        if (newSelection.has(blockId)) {
          newSelection.delete(blockId);
        } else {
          newSelection.add(blockId);
          setLastSelectedBlockId(blockId);
        }
      } else {
        // Regular click: select only this block
        newSelection.clear();
        newSelection.add(blockId);
        setLastSelectedBlockId(blockId);
      }

      return newSelection;
    });
  }, [blocks, lastSelectedBlockId]);

  const clearBlockSelection = useCallback(() => {
    setSelectedBlockIds(new Set());
    setLastSelectedBlockId(null);
  }, []);

  // History management
  const addToHistory = useCallback((newBlocks: Block[]) => {
    if (isUndoingRef.current) return;

    // Remove any future history if we're not at the end
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    }

    // Add new state
    historyRef.current.push(newBlocks);
    historyIndexRef.current = historyRef.current.length - 1;

    // Limit history size
    if (historyRef.current.length > 50) {
      historyRef.current.shift();
      historyIndexRef.current--;
    }
  }, []);

  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      isUndoingRef.current = true;
      historyIndexRef.current--;
      const previousBlocks = historyRef.current[historyIndexRef.current];
      onChange(previousBlocks);
      setTimeout(() => {
        isUndoingRef.current = false;
      }, 0);
    }
  }, [onChange]);

  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      isUndoingRef.current = true;
      historyIndexRef.current++;
      const nextBlocks = historyRef.current[historyIndexRef.current];
      onChange(nextBlocks);
      setTimeout(() => {
        isUndoingRef.current = false;
      }, 0);
    }
  }, [onChange]);

  // Indent/Outdent helpers
  const indentBlock = useCallback((blockId: string) => {
    const blockIndex = blocks.findIndex(b => b.id === blockId);
    if (blockIndex <= 0) return;

    const currentBlock = blocks[blockIndex];
    const prevBlock = blocks[blockIndex - 1];

    // Move current block as child of previous block
    const newPrevBlock = {
      ...prevBlock,
      children: [...(prevBlock.children || []), currentBlock],
      isOpen: true
    };

    const newBlocks = [...blocks];
    newBlocks[blockIndex - 1] = newPrevBlock;
    newBlocks.splice(blockIndex, 1);

    addToHistory(newBlocks);
    onChange(newBlocks);
  }, [blocks, onChange, addToHistory]);

  const outdentBlock = useCallback((blockId: string) => {
    // Find parent block that contains this block as a child
    let parentBlock: Block | null = null;
    let parentIndex = -1;
    let childIndex = -1;

    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      if (b.children) {
        const idx = b.children.findIndex(child => child.id === blockId);
        if (idx !== -1) {
          parentBlock = b;
          parentIndex = i;
          childIndex = idx;
          break;
        }
      }
    }

    if (!parentBlock || childIndex === -1) return;

    const blockToMove = parentBlock.children![childIndex];

    // Remove from parent
    const newParentBlock = {
      ...parentBlock,
      children: parentBlock.children!.filter((_, idx) => idx !== childIndex)
    };

    // Insert after parent
    const newBlocks = [...blocks];
    newBlocks[parentIndex] = newParentBlock;
    newBlocks.splice(parentIndex + 1, 0, blockToMove);

    addToHistory(newBlocks);
    onChange(newBlocks);
  }, [blocks, onChange, addToHistory]);

  // Merge blocks helper
  const mergeWithPrevious = useCallback((blockId: string) => {
    const currentIndex = blocks.findIndex(b => b.id === blockId);
    if (currentIndex <= 0) return false;

    const currentBlock = blocks[currentIndex];
    const prevBlock = blocks[currentIndex - 1];

    // Merge content
    const mergedContent = prevBlock.content + (currentBlock.content ? " " + currentBlock.content : "");

    const newBlocks = [...blocks];
    newBlocks[currentIndex - 1] = { ...prevBlock, content: mergedContent };
    newBlocks.splice(currentIndex, 1);

    addToHistory(newBlocks);
    onChange(newBlocks);

    // Focus previous block
    setTimeout(() => {
      setActiveBlockId(prevBlock.id);
      const prevBlockElement = document.getElementById(`block-${prevBlock.id}`);
      if (prevBlockElement) {
        const contentDiv = prevBlockElement.querySelector('[contenteditable="true"]') as HTMLElement;
        if (contentDiv) {
          contentDiv.focus();
          // Move cursor to end
          const range = document.createRange();
          const selection = window.getSelection();
          range.selectNodeContents(contentDiv);
          range.collapse(false);
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }
    }, 50);

    return true;
  }, [blocks, onChange, addToHistory]);

  // Convert inline markdown to HTML
  const parseInlineMarkdown = useCallback((text: string): string => {
    let html = text;

    // Bold: **text** or __text__
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

    // Italic: *text* or _text_ (but not already processed bold)
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');

    // Inline code: `code`
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Links: [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>');

    // Strikethrough: ~~text~~
    html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');

    return html;
  }, []);

  // Markdown paste parser
  const parseMarkdownToBlocks = useCallback((markdown: string): Block[] => {
    const lines = markdown.split('\n');
    const newBlocks: Block[] = [];
    let currentListType: 'bulletList' | 'numberedList' | null = null;
    let currentListItems: Block[] = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let codeBlockLang = 'javascript';

    const flushList = () => {
      if (currentListItems.length > 0) {
        // Add all list items as individual blocks
        newBlocks.push(...currentListItems);
        currentListItems = [];
        currentListType = null;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Handle empty lines
      if (!trimmed) {
        if (inCodeBlock) {
          codeBlockContent.push('');
        } else {
          flushList();
        }
        continue;
      }

      // Code blocks
      if (trimmed.startsWith('```')) {
        if (!inCodeBlock) {
          // Starting code block
          inCodeBlock = true;
          codeBlockContent = [];
          codeBlockLang = trimmed.slice(3).trim() || 'javascript';
          flushList();
        } else {
          // Ending code block
          inCodeBlock = false;
          newBlocks.push({
            id: generateId(),
            type: 'code',
            content: codeBlockContent.join('\n'),
            language: codeBlockLang
          });
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        continue;
      }

      // Headers
      if (trimmed.startsWith('# ')) {
        flushList();
        newBlocks.push({
          id: generateId(),
          type: 'heading1',
          content: parseInlineMarkdown(trimmed.slice(2))
        });
        continue;
      }
      if (trimmed.startsWith('## ')) {
        flushList();
        newBlocks.push({
          id: generateId(),
          type: 'heading2',
          content: parseInlineMarkdown(trimmed.slice(3))
        });
        continue;
      }
      if (trimmed.startsWith('### ')) {
        flushList();
        newBlocks.push({
          id: generateId(),
          type: 'heading3',
          content: parseInlineMarkdown(trimmed.slice(4))
        });
        continue;
      }
      if (trimmed.startsWith('#### ')) {
        flushList();
        newBlocks.push({
          id: generateId(),
          type: 'heading3',
          content: parseInlineMarkdown(trimmed.slice(5))
        });
        continue;
      }

      // Todo checkboxes
      if (trimmed.match(/^- \[[ xX]\] /)) {
        flushList();
        const checked = trimmed.match(/^- \[[xX]\]/) !== null;
        const content = parseInlineMarkdown(trimmed.slice(6));
        newBlocks.push({ id: generateId(), type: 'todo', content, checked });
        continue;
      }

      // Bullet lists
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const content = parseInlineMarkdown(trimmed.slice(2));
        currentListItems.push({ id: generateId(), type: 'bulletList', content });
        continue;
      }

      // Numbered lists
      const numberedMatch = trimmed.match(/^(\d+)\.\s(.+)$/);
      if (numberedMatch) {
        const content = parseInlineMarkdown(numberedMatch[2]);
        currentListItems.push({ id: generateId(), type: 'numberedList', content });
        continue;
      }

      // Blockquote
      if (trimmed.startsWith('> ')) {
        flushList();
        newBlocks.push({
          id: generateId(),
          type: 'quote',
          content: parseInlineMarkdown(trimmed.slice(2))
        });
        continue;
      }

      // Divider
      if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
        flushList();
        newBlocks.push({ id: generateId(), type: 'divider', content: '' });
        continue;
      }

      // Toggle (custom syntax: >!)
      if (trimmed.startsWith('>!')) {
        flushList();
        newBlocks.push({
          id: generateId(),
          type: 'toggle',
          content: parseInlineMarkdown(trimmed.slice(2).trim()),
          isOpen: false
        });
        continue;
      }

      // Default to paragraph
      flushList();
      newBlocks.push({
        id: generateId(),
        type: 'paragraph',
        content: parseInlineMarkdown(trimmed)
      });
    }

    // Flush any remaining list items
    flushList();

    // Handle unclosed code block
    if (inCodeBlock && codeBlockContent.length > 0) {
      newBlocks.push({
        id: generateId(),
        type: 'code',
        content: codeBlockContent.join('\n'),
        language: codeBlockLang
      });
    }

    return newBlocks;
  }, [parseInlineMarkdown]);

  const handlePaste = useCallback((e: React.ClipboardEvent, blockId: string) => {
    const text = e.clipboardData.getData('text');
    const currentBlock = blocks.find(b => b.id === blockId);

    if (!currentBlock || !text) return;

    // Check if it looks like markdown with block-level patterns
    const hasBlockMarkdown = /^(#{1,6}\s|^-\s|^\*\s|^\d+\.\s|^>\s|^```|^---|^\*\*\*|^___|^-\s*\[[\sxX]\]\s)/m.test(text);

    // Check for inline markdown patterns
    const hasInlineMarkdown = /(\*\*.*?\*\*|__.*?__|\*.*?\*|_.*?_|`[^`]+`|\[.*?\]\(.*?\)|~~.*?~~)/.test(text);

    // Single line paste with inline markdown - convert inline only
    if (!text.includes('\n') && hasInlineMarkdown) {
      e.preventDefault();
      const html = parseInlineMarkdown(text);
      document.execCommand('insertHTML', false, html);
      return;
    }

    // Multi-line markdown paste
    if (hasBlockMarkdown && text.includes('\n')) {
      e.preventDefault();
      const parsedBlocks = parseMarkdownToBlocks(text);

      if (parsedBlocks.length > 0) {
        const currentIndex = blocks.findIndex(b => b.id === blockId);
        const newBlocks = [...blocks];

        // If current block is empty, replace it entirely
        // Otherwise, merge first parsed block with current content
        if (!currentBlock.content || currentBlock.content === '<br>' || currentBlock.content === '') {
          newBlocks[currentIndex] = parsedBlocks[0];
        } else {
          // Keep current block type but append parsed content
          const firstBlock = parsedBlocks[0];
          newBlocks[currentIndex] = {
            ...currentBlock,
            content: currentBlock.content + ' ' + firstBlock.content
          };
        }

        // Insert remaining blocks after
        if (parsedBlocks.length > 1) {
          newBlocks.splice(currentIndex + 1, 0, ...parsedBlocks.slice(1));
        }

        addToHistory(newBlocks);
        onChange(newBlocks);
      }
    }
  }, [blocks, onChange, addToHistory, parseMarkdownToBlocks, parseInlineMarkdown]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const updateBlock = useCallback((id: string, updates: Partial<Block>) => {
    onChange(updateBlocksRecursive(blocks, id, updates));
  }, [blocks, onChange]);

  const deleteBlock = useCallback((id: string) => {
    onChange(deleteBlockRecursive(blocks, id));
  }, [blocks, onChange]);

  const duplicateBlock = useCallback((id: string) => {
    onChange(duplicateBlockRecursive(blocks, id, generateId()));
  }, [blocks, onChange]);

  const turnBlockInto = useCallback((id: string, type: BlockType) => {
    updateBlock(id, { type });
  }, [updateBlock]);

  const getBlock = useCallback((id: string) => {
    return findBlockRecursive(blocks, id);
  }, [blocks]);

  const copyBlockLink = useCallback((id: string) => {
    const url = `${window.location.origin}/notes?block=${id}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied",
      description: "Block link copied to clipboard",
    });
  }, []);

  const copySyncedBlock = useCallback((id: string) => {
    localStorage.setItem('synced_block_clipboard', id);
    toast({
      title: "Block copied",
      description: "Use '/Paste Synced Block' to insert mirror.",
    });
  }, []);

  const addBlockAfter = useCallback((id: string, type: BlockType = "paragraph") => {
    const newBlock: Block = { id: generateId(), type, content: "" };
    onChange(addBlockAfterRecursive(blocks, id, newBlock));
    setActiveBlockId(newBlock.id);
  }, [blocks, onChange]);

  const handleGlobalInput = useCallback((blockId: string, e: React.FormEvent<HTMLElement>) => {
    const text = (e.currentTarget?.textContent || "").replace(/\u200B/g, "").trim();
    if (slashMenuOpen) {
      if (text.startsWith("/")) {
        setSlashSearchTerm(text.substring(1));
      } else {
        setSlashMenuOpen(false);
      }
    }
    if (wikiMenuOpen) {
      const match = text.match(/\[\[([^\]]*)$/);
      if (match) {
        setWikiSearchTerm(match[1]);
      } else {
        setWikiMenuOpen(false);
      }
    }
    if (mentionMenuOpen) {
      const match = text.match(/@([^@\s]*)$/);
      if (match) {
        setMentionSearchTerm(match[1]);
      } else {
        setMentionMenuOpen(false);
      }
    }
  }, [slashMenuOpen, wikiMenuOpen, mentionMenuOpen]);



  const handleGlobalKeyDown = useCallback((blockId: string, e: React.KeyboardEvent<HTMLElement>) => {
    const block = findBlockRecursive(blocks, blockId);
    if (!block) return;

    const currentText = (e.currentTarget?.textContent || "").replace(/\u200B/g, "").trim();

    // Input rules (Markdown replacements on Space)
    if (e.key === " " && !e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey) {
      if (currentText === "#") { e.preventDefault(); updateBlock(blockId, { type: "heading1", content: "" }); return; }
      if (currentText === "##") { e.preventDefault(); updateBlock(blockId, { type: "heading2", content: "" }); return; }
      if (currentText === "###") { e.preventDefault(); updateBlock(blockId, { type: "heading3", content: "" }); return; }
      if (currentText === ">") { e.preventDefault(); updateBlock(blockId, { type: "quote", content: "" }); return; }
      if (currentText === ">!") { e.preventDefault(); updateBlock(blockId, { type: "toggle", content: "" }); return; }
      if (currentText === "-" || currentText === "*") { e.preventDefault(); updateBlock(blockId, { type: "bulletList", content: "" }); return; }
      if (currentText === "1.") { e.preventDefault(); updateBlock(blockId, { type: "numberedList", content: "" }); return; }
      if (currentText === "[]" || currentText === "[ ]") { e.preventDefault(); updateBlock(blockId, { type: "todo", content: "" }); return; }
    }

    // Input rules (Code Block & Divider on Enter)
    if (e.key === "Enter" && !e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey && !slashMenuOpen && !wikiMenuOpen && !mentionMenuOpen) {
      if (currentText === "```") {
        e.preventDefault();
        updateBlock(blockId, { type: "code", content: "", language: "javascript" });
        return;
      }
      if (currentText.startsWith("```") && currentText.length > 3) {
        const lang = currentText.slice(3).trim();
        e.preventDefault();
        updateBlock(blockId, { type: "code", content: "", language: lang || "javascript" });
        return;
      }
      if (currentText === "---" || currentText === "***" || currentText === "___") {
        e.preventDefault();
        // For divider, we turn current into divider AND add a block after.
        // We can do this by applying both transformations to the blocks array.
        let newBlocks = updateBlocksRecursive(blocks, blockId, { type: "divider", content: "" });
        const nextBlock = {
          id: generateId(),
          type: "paragraph" as BlockType,
          content: "",
          metadata: { indent: 0 }
        };
        newBlocks = addBlockAfterRecursive(newBlocks, blockId, nextBlock);
        onChange(newBlocks);
        return;
      }
    }

    // Keyboard shortcuts for formatting
    if (matchesShortcut(e, EDITOR_SHORTCUTS.BOLD)) {
      e.preventDefault();
      document.execCommand("bold", false);
    }
    if (matchesShortcut(e, EDITOR_SHORTCUTS.ITALIC)) {
      e.preventDefault();
      document.execCommand("italic", false);
    }
    if (matchesShortcut(e, EDITOR_SHORTCUTS.UNDERLINE)) {
      e.preventDefault();
      document.execCommand("underline", false);
    }

    // Handle slash command
    if (matchesShortcut(e, EDITOR_SHORTCUTS.SLASH_MENU)) {
      e.preventDefault();
      setSlashMenuOpen(true);
      setSlashSearchTerm(block.content.startsWith("/") ? block.content.substring(1) : "");
      setSelectedMenuIndex(0);
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setMenuPosition({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX });
      return;
    }

    // Also trigger slash menu on "/" when block is empty
    if (e.key === "/" && currentText === "" && !slashMenuOpen) {
      e.preventDefault();
      e.stopPropagation();

      // Manually update content since we prevented default
      updateBlock(blockId, { content: "/" });

      setSlashMenuOpen(true);
      setSlashSearchTerm("");
      setSelectedMenuIndex(0);
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setMenuPosition({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX });
    }

    // Handle Enter to create new block
    if (e.key === "Enter" && !e.shiftKey && !slashMenuOpen) {
      e.preventDefault();
      addBlockAfter(blockId);
    }

    // Handle Arrow Up/Down to navigate between blocks
    if (e.key === "ArrowUp" && !e.shiftKey && !slashMenuOpen && !wikiMenuOpen && !mentionMenuOpen) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        // If cursor is at the beginning of the block
        if (range.startOffset === 0) {
          e.preventDefault();
          const currentIndex = blocks.findIndex(b => b.id === blockId);
          if (currentIndex > 0) {
            const prevBlockId = blocks[currentIndex - 1].id;
            setTimeout(() => {
              setActiveBlockId(prevBlockId);
              const prevBlockElement = document.getElementById(`block-${prevBlockId}`);
              if (prevBlockElement) {
                const contentDiv = prevBlockElement.querySelector('[contenteditable="true"]') as HTMLElement;
                if (contentDiv) {
                  contentDiv.focus();
                  // Move cursor to end
                  const range = document.createRange();
                  const selection = window.getSelection();
                  range.selectNodeContents(contentDiv);
                  range.collapse(false);
                  selection?.removeAllRanges();
                  selection?.addRange(range);
                }
              }
            }, 10);
          }
        }
      }
    }

    if (e.key === "ArrowDown" && !e.shiftKey && !slashMenuOpen && !wikiMenuOpen && !mentionMenuOpen) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const textContent = (e.target as HTMLElement).innerText || "";
        // If cursor is at the end of the block
        if (range.endOffset === textContent.length) {
          e.preventDefault();
          const currentIndex = blocks.findIndex(b => b.id === blockId);
          if (currentIndex < blocks.length - 1) {
            const nextBlockId = blocks[currentIndex + 1].id;
            setTimeout(() => {
              setActiveBlockId(nextBlockId);
              const nextBlockElement = document.getElementById(`block-${nextBlockId}`);
              if (nextBlockElement) {
                const contentDiv = nextBlockElement.querySelector('[contenteditable="true"]') as HTMLElement;
                if (contentDiv) {
                  contentDiv.focus();
                  // Move cursor to start
                  const range = document.createRange();
                  const selection = window.getSelection();
                  range.selectNodeContents(contentDiv);
                  range.collapse(true);
                  selection?.removeAllRanges();
                  selection?.addRange(range);
                }
              }
            }, 10);
          }
        }
      }
    }

    // Handle Backspace - merge with previous or delete empty block
    const textContent = (e.target as HTMLElement).innerText || "";
    const selection = window.getSelection();
    const isAtStart = !selection || selection.anchorOffset === 0;

    if (e.key === "Backspace" && isAtStart && textContent !== "") {
      e.preventDefault();
      // Try to merge with previous block
      if (mergeWithPrevious(blockId)) {
        return;
      }
    }

    if (e.key === "Backspace" && textContent === "" && blocks.length > 1) {
      e.preventDefault();
      // Find the index of the current block
      const blockIndex = blocks.findIndex(b => b.id === blockId);
      if (blockIndex > 0) {
        const prevBlockId = blocks[blockIndex - 1].id;
        deleteBlock(blockId);
        // Focus the previous block after deletion
        setTimeout(() => {
          setActiveBlockId(prevBlockId);
          const prevBlockElement = document.getElementById(`block-${prevBlockId}`);
          if (prevBlockElement) {
            const contentDiv = prevBlockElement.querySelector('[contenteditable="true"]') as HTMLElement;
            if (contentDiv) {
              contentDiv.focus();
              // Move cursor to end
              const range = document.createRange();
              const selection = window.getSelection();
              range.selectNodeContents(contentDiv);
              range.collapse(false);
              selection?.removeAllRanges();
              selection?.addRange(range);
            }
          }
        }, 50);
      } else {
        deleteBlock(blockId);
      }
    }

    // Close menus on Escape
    if (e.key === "Escape") {
      setSlashMenuOpen(false);
      setWikiMenuOpen(false);
      setMentionMenuOpen(false);
    }

    // Handle Wiki Link trigger [[
    if (e.key === "[" && !slashMenuOpen && !wikiMenuOpen) {
      const selection = window.getSelection();
      if (selection && selection.anchorNode && selection.anchorOffset > 0) {
        const textBefore = selection.anchorNode.textContent || "";
        const charBefore = textBefore[selection.anchorOffset - 1];
        if (charBefore === "[") {
          setWikiMenuOpen(true);
          setWikiSearchTerm("");
          setWikiMenuIndex(0);
          const rect = selection.getRangeAt(0).getBoundingClientRect();
          setMenuPosition({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX });
          return;
        }
      }
    }

    // Handle @ Mention trigger
    if (e.key === "@" && !slashMenuOpen && !wikiMenuOpen && !mentionMenuOpen) {
      setMentionMenuOpen(true);
      setMentionSearchTerm("");
      setMentionMenuIndex(0);
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const rect = selection.getRangeAt(0).getBoundingClientRect();
        setMenuPosition({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX });
      }
    }

    // Duplicate block with Ctrl+D
    if (matchesShortcut(e, EDITOR_SHORTCUTS.DUPLICATE)) {
      e.preventDefault();
      duplicateBlock(blockId);
    }

    // Copy link
    if (matchesShortcut(e, EDITOR_SHORTCUTS.COPY_LINK)) {
      e.preventDefault();
      copyBlockLink(blockId);
    }

    // Delete block
    if (matchesShortcut(e, EDITOR_SHORTCUTS.DELETE)) {
      e.preventDefault();
      const currentIndex = blocks.findIndex(b => b.id === blockId);
      if (currentIndex >= 0) {
        // Focus next block if available, otherwise previous
        const nextBlockId = currentIndex < blocks.length - 1
          ? blocks[currentIndex + 1].id
          : currentIndex > 0
            ? blocks[currentIndex - 1].id
            : null;

        deleteBlock(blockId);

        if (nextBlockId) {
          setTimeout(() => {
            setActiveBlockId(nextBlockId);
            const nextBlockElement = document.getElementById(`block-${nextBlockId}`);
            if (nextBlockElement) {
              const contentDiv = nextBlockElement.querySelector('[contenteditable="true"]') as HTMLElement;
              if (contentDiv) {
                contentDiv.focus();
                // Move cursor to start if going forward, end if going backward
                const range = document.createRange();
                const selection = window.getSelection();
                const textContent = contentDiv.textContent || "";
                if (currentIndex < blocks.length - 1) {
                  range.collapse(true); // Start
                } else {
                  range.collapse(false); // End
                }
                selection?.removeAllRanges();
                selection?.addRange(range);
              }
            }
          }, 50);
        }
      }
    }

    // Ask AI
    if (matchesShortcut(e, EDITOR_SHORTCUTS.ASK_AI)) {
      e.preventDefault();
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setManualAiPos({ x: rect.left, y: rect.bottom + 10 });
        setAiAssistantOpen(true);
      }
    }

    // Inline Code (Ctrl+E)
    if (matchesShortcut(e, EDITOR_SHORTCUTS.INLINE_CODE)) {
      e.preventDefault();
      document.execCommand("italic", false);
      const currentContent = block.content || "";
      if (!currentContent.startsWith("`") && !currentContent.endsWith("`")) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const selectedText = range.toString();
          if (selectedText) {
            document.execCommand("insertText", false, `\`${selectedText}\``);
          }
        }
      }
    }

    // Add Link (Ctrl+K)
    if (matchesShortcut(e, EDITOR_SHORTCUTS.ADD_LINK)) {
      e.preventDefault();
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const selectedText = range.toString();
        const url = prompt("Enter URL:", selectedText.startsWith("http") ? selectedText : "https://");
        if (url) {
          const linkHtml = `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">${selectedText || url}</a>`;
          document.execCommand("insertHTML", false, linkHtml);
        }
      }
    }

    // Turn into shortcuts (Ctrl+Alt+0-9)
    if (e.ctrlKey && e.altKey && !e.shiftKey && !e.metaKey && e.key >= "0" && e.key <= "9") {
      e.preventDefault();
      const keyToType: Record<string, BlockType> = {
        "0": "paragraph",
        "1": "heading1",
        "2": "heading2",
        "3": "heading3",
        "4": "todo",
        "5": "bulletList",
        "6": "numberedList",
        "7": "toggle",
        "8": "code",
        "9": "quote",
      };
      const targetType = keyToType[e.key];
      if (targetType) {
        turnBlockInto(blockId, targetType);
      }
    }

    // Toggle shortcut (Ctrl+Alt+T)
    if (matchesShortcut(e, EDITOR_SHORTCUTS.TURN_INTO_TOGGLE)) {
      e.preventDefault();
      turnBlockInto(blockId, "toggle");
    }

    // Handle Indentation with Tab
    if (matchesShortcut(e, EDITOR_SHORTCUTS.INDENT) || matchesShortcut(e, EDITOR_SHORTCUTS.OUTDENT)) {
      e.preventDefault();
      if (e.shiftKey) {
        // Outdent
        outdentBlock(blockId);
      } else {
        // Indent
        indentBlock(blockId);
      }
    }

    // Undo/Redo
    if (matchesShortcut(e, EDITOR_SHORTCUTS.UNDO)) {
      e.preventDefault();
      undo();
    }
    if (matchesShortcut(e, EDITOR_SHORTCUTS.REDO)) {
      e.preventDefault();
      redo();
    }

    // Select all blocks (Ctrl+A when block is focused)
    if (matchesShortcut(e, EDITOR_SHORTCUTS.SELECT_ALL)) {
      e.preventDefault();
      const selection = window.getSelection();
      const target = e.target as HTMLElement;

      // If there's text selected in the block, select all text
      if (selection && selection.toString().length > 0) {
        // Let default behavior handle text selection
        return;
      }

      // Otherwise, select all blocks
      if (target.isContentEditable) {
        setSelectedBlockIds(new Set(blocks.map(b => b.id)));
      }
    }

    // Alt+Up/Down for moving blocks
    if (matchesShortcut(e, EDITOR_SHORTCUTS.MOVE_UP)) {
      e.preventDefault();
      const currentIndex = blocks.findIndex(b => b.id === blockId);
      const newIndex = Math.max(0, currentIndex - 1);
      if (newIndex !== currentIndex) {
        onChange(arrayMove(blocks, currentIndex, newIndex));
      }
    }
    if (matchesShortcut(e, EDITOR_SHORTCUTS.MOVE_DOWN)) {
      e.preventDefault();
      const currentIndex = blocks.findIndex(b => b.id === blockId);
      const newIndex = Math.min(blocks.length - 1, currentIndex + 1);
      if (newIndex !== currentIndex) {
        onChange(arrayMove(blocks, currentIndex, newIndex));
      }
    }

    // Navigate slash menu with arrow keys
    if (slashMenuOpen) {
      const filteredTypes = blockTypes.filter(
        bt => bt.label.toLowerCase().includes(slashSearchTerm.toLowerCase()) ||
          bt.shortcut.includes(slashSearchTerm.toLowerCase())
      );

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedMenuIndex(prev => Math.min(prev + 1, filteredTypes.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedMenuIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredTypes[selectedMenuIndex]) {
          handleSlashSelect(filteredTypes[selectedMenuIndex].type);
        }
      }
    }

    // Navigate Wiki menu
    if (wikiMenuOpen) {
      const filteredPages = pages.filter(p => p.title.toLowerCase().includes(wikiSearchTerm.toLowerCase())).slice(0, 10);

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setWikiMenuIndex(prev => Math.min(prev + 1, filteredPages.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setWikiMenuIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredPages[wikiMenuIndex]) {
          handleWikiSelect(filteredPages[wikiMenuIndex], blockId);
        }
      }
    }

    // Navigate Mention menu
    if (mentionMenuOpen) {
      const filtered = pages.filter(p => p.title.toLowerCase().includes(mentionSearchTerm.toLowerCase())).slice(0, 10);

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionMenuIndex(prev => Math.min(prev + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionMenuIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[mentionMenuIndex]) {
          handleMentionSelect(filtered[mentionMenuIndex], blockId);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks, addBlockAfter, deleteBlock, slashMenuOpen, slashSearchTerm, selectedMenuIndex, wikiMenuOpen, wikiSearchTerm, wikiMenuIndex, mentionMenuOpen, mentionSearchTerm, mentionMenuIndex, pages, onChange]);

  const recursionHandlers = {
    activeBlockId,
    setActiveBlockId,
    updateBlock,
    deleteBlock,
    addBlockAfter,
    duplicateBlock,
    turnBlockInto,
    copyBlockLink,
    copySyncedBlock,
    handleKeyDown: handleGlobalKeyDown,
    handleInput: handleGlobalInput,
    getBlock,
    dragOverId
  };

  // Update search terms based on content changes - REMOVED (Handled by handleGlobalInput now)
  /*
  useEffect(() => {
    if ((!slashMenuOpen && !wikiMenuOpen) || !activeBlockId) return;
    // ...
  }, ...); 
  */

  const handleWikiSelect = useCallback((page: { id: string; title: string }, blockId: string) => {
    const block = findBlockRecursive(blocks, blockId);
    if (!block) return;

    // Replace [[query with a clickable link using data-page-id for client-side navigation
    const content = block.content;
    const lastBracketIndex = content.lastIndexOf("[[");
    if (lastBracketIndex !== -1) {
      const newContent = content.substring(0, lastBracketIndex) +
        `<a href="/notes?page=${page.id}" data-page-id="${page.id}" class="wiki-link text-primary hover:underline font-medium" contenteditable="false">${page.title}</a>&nbsp;` +
        content.substring(lastBracketIndex + 2 + wikiSearchTerm.length);

      updateBlock(blockId, { content: newContent });
    } else {
      // Fallback if regex fails (just append)
      updateBlock(blockId, { content: block.content + `<a href="/notes?page=${page.id}" data-page-id="${page.id}" class="wiki-link text-primary hover:underline font-medium" contenteditable="false">${page.title}</a>&nbsp;` });
    }
    setWikiMenuOpen(false);
  }, [blocks, wikiSearchTerm, updateBlock]);

  const handleMentionSelect = useCallback((page: { id: string; title: string; icon?: string }, blockId: string) => {
    const block = findBlockRecursive(blocks, blockId);
    if (!block) return;

    // Replace @query with a mention badge that links to the page
    const content = block.content;
    const lastAtIndex = content.lastIndexOf("@");
    if (lastAtIndex !== -1) {
      const mentionHtml = `<a href="/notes?page=${page.id}" data-page-id="${page.id}" class="wiki-link inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium cursor-pointer hover:bg-primary/20 transition-colors" contenteditable="false">${page.icon || '📄'} ${page.title}</a>&nbsp;`;
      const newContent = content.substring(0, lastAtIndex) +
        mentionHtml +
        content.substring(lastAtIndex + 1 + mentionSearchTerm.length);

      updateBlock(blockId, { content: newContent });
    }
    setMentionMenuOpen(false);
  }, [blocks, mentionSearchTerm, updateBlock]);

  const handleAddComment = useCallback((blockId: string, content: string) => {
    const block = findBlockRecursive(blocks, blockId);
    if (!block) return;

    const newComment: Comment = {
      id: Math.random().toString(36).substring(7),
      content,
      author: "You", // In a real app, this would be the authenticated user
      createdAt: new Date().toISOString(),
    };

    const newComments = [...(block.comments || []), newComment];
    updateBlock(blockId, { comments: newComments });
    setCommentDialogOpen(false);
    setCommentText("");
  }, [blocks, updateBlock]);

  const handleSlashSelect = useCallback((type: BlockType) => {
    if (activeBlockId) {
      if (type === "synced_container" || type === "synced-container") {
        const syncedId = localStorage.getItem('synced_block_clipboard');
        if (syncedId) {
          updateBlock(activeBlockId, {
            type: "synced_container",
            content: "",
            metadata: { originalBlockId: syncedId }
          });
          toast({ description: "Synced block created." });
        } else {
          toast({ variant: "destructive", description: "No block in clipboard to sync." });
        }
      } else if (type === "ai-summarize" || type === "ai-continue" || type === "ai-improve") {
        const text = extractTextFromBlocks(blocks);
        const targetBlockId = generateId();
        const action = type === "ai-summarize" ? "summarize" : type === "ai-continue" ? "continue" : "improve";

        const initialContent = type === "ai-summarize" ? "Summarizing..." : type === "ai-continue" ? "Thinking..." : "Improving...";

        const newBlock: Block = {
          id: targetBlockId,
          type: "paragraph",
          content: initialContent,
          metadata: { isAiGenerated: true }
        };

        const currentBlock = findBlockRecursive(blocks, activeBlockId);
        if (currentBlock && (currentBlock.content === "/" || currentBlock.content === "")) {
          updateBlock(activeBlockId, { ...newBlock, id: activeBlockId });
        } else {
          onChange(addBlockAfterRecursive(blocks, activeBlockId, newBlock));
        }

        const actualId = (currentBlock && (currentBlock.content === "/" || currentBlock.content === "")) ? activeBlockId : targetBlockId;

        // Perform AI action
        const performAI = async () => {
          try {
            const systemPrompt = "You are a helpful writing assistant.";
            let userPrompt = "";
            if (action === "summarize") userPrompt = `Summarize this text concisely:\n\n${text}`;
            else if (action === "continue") userPrompt = `Continue writing this text naturally:\n\n${text}`;
            else if (action === "improve") userPrompt = `Improve this text for clarity and style:\n\n${text}`;

            const response = await runAgentLoop([
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ], user?.id || "");

            let resultText = "";
            if (Symbol.asyncIterator in response) {
              for await (const chunk of response as AsyncIterable<{ choices: Array<{ delta?: { content: string } }> }>) {
                resultText += chunk.choices[0]?.delta?.content || "";
                updateBlock(actualId, { content: resultText });
              }
            } else {
              resultText = (response as { choices: Array<{ message: { content: string } }> }).choices[0].message.content;
              updateBlock(actualId, { content: resultText });
            }
          } catch (error) {
            console.error("AI Error", error);
            updateBlock(actualId, { content: "Failed to generate content. Please try again." });
          }
        };

        performAI();


      } else {
        const block = findBlockRecursive(blocks, activeBlockId);
        if (block) {
          updateBlock(activeBlockId, { type, content: "" });
        }
      }
    }
    setSlashMenuOpen(false);
    setSlashSearchTerm("");
    setSelectedMenuIndex(0);
  }, [activeBlockId, blocks, updateBlock, askAI, onChange]);

  const handleDragStart = (event: DragStartEvent) => {
    setDragActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over, activatorEvent, active } = event;
    if (over && active.id !== over.id) {
      setDragOverId(over.id as string);
      const overElement = document.getElementById(`block-${over.id}`);
      if (overElement) {
        const rect = overElement.getBoundingClientRect();
        const eventMouse = activatorEvent as MouseEvent;
        const mouseX = eventMouse.clientX;
        const mouseY = eventMouse.clientY;
        const relativeX = mouseX - rect.left;
        const relativeY = mouseY - rect.top;

        const thresholdY = rect.height * 0.25; // 25% for top/bottom detection
        const thresholdX = 40; // 40px left indentation for nesting

        if (relativeY > thresholdY && relativeY < (rect.height - thresholdY) && relativeX > thresholdX) {
          setDropSide("inside");
        } else if (relativeY < rect.height / 2) {
          setDropSide("top");
        } else {
          setDropSide("bottom");
        }
      }
    } else {
      setDragOverId(null);
      setDropSide(null);
    }
  };

  const traverseAndRemove = (nodes: Block[], id: string): { nodes: Block[], removed: Block | null } => {
    let removedBlock: Block | null = null;
    const newNodes = nodes.filter(node => {
      if (node.id === id) {
        removedBlock = node;
        return false;
      }
      if (node.children) {
        const result = traverseAndRemove(node.children, id);
        node.children = result.nodes;
        if (result.removed) removedBlock = result.removed;
      }
      return true;
    });
    return { nodes: newNodes, removed: removedBlock };
  };

  const traverseAndInsert = (nodes: Block[], targetId: string, blockToInsert: Block, position: 'top' | 'bottom' | 'inside'): Block[] => {
    let newNodes: Block[] = [];
    for (const node of nodes) {
      if (node.id === targetId) {
        if (position === 'top') {
          newNodes.push(blockToInsert);
          newNodes.push(node);
        } else if (position === 'bottom') {
          newNodes.push(node);
          newNodes.push(blockToInsert);
        } else if (position === 'inside') {
          newNodes.push({
            ...node,
            children: [...(node.children || []), blockToInsert],
            isOpen: true
          });
        }
      } else {
        if (node.children) {
          newNodes.push({
            ...node,
            children: traverseAndInsert(node.children, targetId, blockToInsert, position)
          });
        } else {
          newNodes.push(node);
        }
      }
    }
    return newNodes;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const finalDropSide = dropSide;

    setDragActiveId(null);
    setDragOverId(null);
    setDropSide(null);

    if (over && active.id !== over.id) {
      if (finalDropSide === 'inside' || finalDropSide === 'top' || finalDropSide === 'bottom') {
        const { nodes: cleanedBlocks, removed } = traverseAndRemove(blocks, active.id as string);
        if (removed) {
          const newBlocks = traverseAndInsert(cleanedBlocks, over.id as string, removed, finalDropSide as 'top' | 'bottom' | 'inside');
          onChange(newBlocks);
        }
      } else if (finalDropSide === 'left' || finalDropSide === 'right') {
        // Dynamic Column Creation
        const { nodes: cleanedBlocks, removed } = traverseAndRemove(blocks, active.id as string);
        if (removed) {
          const insertAsColumns = (nodes: Block[]): Block[] => {
            return nodes.map(node => {
              if (node.id === over.id) {
                return {
                  id: generateId(),
                  type: "columns2",
                  content: "",
                  columns: finalDropSide === "left"
                    ? [[removed], [node]]
                    : [[node], [removed]]
                };
              }
              if (node.children) {
                return { ...node, children: insertAsColumns(node.children) };
              }
              return node;
            });
          };
          onChange(insertAsColumns(cleanedBlocks));
        }
      }
    }
  };


  if (readOnly) {
    return (
      <div className="space-y-2">
        {blocks.map(block => (
          <BlockItemContent
            key={block.id}
            block={block}
            onChange={() => { }}
            onDelete={() => { }}
            onAddAfter={() => { }}
            onDuplicate={() => { }}
            onTurnInto={() => { }}
            onCopyLink={() => { }}
            onCopySyncedBlock={() => { }}
            onKeyDown={() => { }}
            isActive={false}
            onFocus={() => { }}
            readOnly={true}
            {...recursionHandlers}
          />
        ))}
      </div>
    );
  }

  const activeBlock = dragActiveId ? blocks.find(b => b.id === dragActiveId) : null;

  return (
    <div className="relative" ref={containerRef}>
      <InlineToolbar
        containerRef={containerRef as React.RefObject<HTMLElement>}
        onTurnInto={(type) => activeBlockId && turnBlockInto(activeBlockId, type as BlockType)}
        onComment={() => {
          if (activeBlockId) {
            setCommentingBlockId(activeBlockId);
            setCommentDialogOpen(true);
          }
        }}
      />

      {/* Multi-selection toolbar */}
      <AnimatePresence>
        {selectedBlockIds.size > 1 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 bg-background/95 backdrop-blur-md border rounded-full shadow-xl"
          >
            <span className="text-xs font-medium text-muted-foreground">
              {selectedBlockIds.size} selected
            </span>
            <div className="w-px h-4 bg-border" />
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => {
                // Delete all selected
                const newBlocks = blocks.filter(b => !selectedBlockIds.has(b.id));
                addToHistory(newBlocks);
                onChange(newBlocks);
                clearBlockSelection();
              }}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Delete
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => {
                // Duplicate all selected
                const selectedBlocks = blocks.filter(b => selectedBlockIds.has(b.id));
                const newBlocks = [...blocks];
                selectedBlocks.forEach(block => {
                  const deepClone = (b: Block): Block => ({
                    ...b,
                    id: Math.random().toString(36).substring(2, 9),
                    children: b.children?.map(deepClone)
                  });
                  const index = newBlocks.findIndex(b => b.id === block.id);
                  if (index !== -1) {
                    newBlocks.splice(index + 1, 0, deepClone(block));
                  }
                });
                addToHistory(newBlocks);
                onChange(newBlocks);
                clearBlockSelection();
              }}
            >
              <Copy className="h-3.5 w-3.5 mr-1" />
              Duplicate
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={clearBlockSelection}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="min-h-[200px] pb-32"
        onClick={(e) => {
          // Only trigger if clicking on the empty space below blocks
          if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('clickable-area')) {
            // Create a new block at the end
            const newBlockId = generateId();
            onChange([...blocks, { id: newBlockId, type: "paragraph", content: "" }]);
            // Focus the new block after a short delay
            setTimeout(() => {
              setActiveBlockId(newBlockId);
              const newBlockElement = document.getElementById(`block-${newBlockId}`);
              if (newBlockElement) {
                const contentDiv = newBlockElement.querySelector('[contenteditable="true"]') as HTMLElement;
                if (contentDiv) {
                  contentDiv.focus();
                }
              }
            }, 50);
          }
        }}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
            <AnimatePresence mode="popLayout">
              {blocks.map(block => (
                <SortableBlockItem
                  key={block.id}
                  block={block}
                  onChange={(updated) => updateBlock(block.id, updated)}
                  onDelete={() => deleteBlock(block.id)}
                  onAddAfter={() => addBlockAfter(block.id)}
                  onDuplicate={() => duplicateBlock(block.id)}
                  onTurnInto={(type) => turnBlockInto(block.id, type)}
                  onCopyLink={() => copyBlockLink(block.id)}
                  onCopySyncedBlock={() => copySyncedBlock(block.id)}
                  onKeyDown={(e) => handleGlobalKeyDown(block.id, e)}
                  onPaste={(e) => handlePaste(e as unknown as React.ClipboardEvent, block.id)}
                  isActive={activeBlockId === block.id}
                  onFocus={() => {
                    setActiveBlockId(block.id);
                    clearBlockSelection();
                  }}
                  dropSide={dragOverId === block.id ? dropSide : null}
                  isDragOver={dragOverId === block.id}
                  isSelected={selectedBlockIds.has(block.id)}
                  onToggleSelection={(isCtrl, isShift) => toggleBlockSelection(block.id, isCtrl, isShift)}
                  contextMenuOpen={contextMenuOpen === block.id}
                  onContextMenuOpenChange={(open) => setContextMenuOpen(open ? block.id : null)}
                  {...recursionHandlers}
                />
              ))}
            </AnimatePresence>
          </SortableContext>

          <DragOverlay>
            {activeBlock && (
              <div className="bg-background border rounded-lg shadow-lg p-2 opacity-80">
                <BlockItemContent
                  block={{ ...activeBlock, children: [] }} // Don't render children in overlay for performance
                  onChange={() => { }}
                  onDelete={() => { }}
                  onAddAfter={() => { }}
                  onDuplicate={() => { }}
                  onTurnInto={() => { }}
                  onCopyLink={() => { }}
                  onCopySyncedBlock={() => { }}
                  onKeyDown={() => { }}
                  isActive={false}
                  onFocus={() => { }}
                  readOnly={true}
                  isDragging
                  {...recursionHandlers}
                />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {blocks.length === 0 && (
        <Button
          variant="ghost"
          onClick={() => onChange([{ id: generateId(), type: "paragraph", content: "" }])}
          className="w-full justify-start text-muted-foreground"
        >
          <Plus className="mr-2 h-4 w-4" /> Add a block
        </Button>
      )}

      <AnimatePresence>
        {slashMenuOpen && (
          <NotionSlashMenu
            isOpen={slashMenuOpen}
            commands={blockTypes.map(bt => ({
              id: bt.type,
              label: bt.label,
              description: bt.description,
              icon: bt.icon,
              keywords: [bt.type, bt.shortcut],
              category: bt.category,
              action: () => handleSlashSelect(bt.type)
            })).filter(cmd =>
              cmd.label.toLowerCase().includes(slashSearchTerm.toLowerCase()) ||
              cmd.keywords.some(k => k.toLowerCase().includes(slashSearchTerm.toLowerCase()))
            )}
            selectedIndex={selectedMenuIndex}
            searchQuery={slashSearchTerm}
            onSearchChange={setSlashSearchTerm}
            onSelectCommand={(index) => {
              const filtered = blockTypes.map(bt => ({
                id: bt.type,
                label: bt.label,
                description: bt.description,
                icon: bt.icon,
                keywords: [bt.type, bt.shortcut],
                category: bt.category,
                action: () => handleSlashSelect(bt.type)
              })).filter(cmd =>
                cmd.label.toLowerCase().includes(slashSearchTerm.toLowerCase()) ||
                cmd.keywords.some(k => k.toLowerCase().includes(slashSearchTerm.toLowerCase()))
              );
              if (filtered[index]) {
                handleSlashSelect(filtered[index].id as BlockType);
              }
            }}
            onClose={() => setSlashMenuOpen(false)}
            position={{ x: menuPosition.left, y: menuPosition.top + 24 }}
          />
        )}
        {mentionMenuOpen && (
          <MentionMenu
            isOpen={mentionMenuOpen}
            searchTerm={mentionSearchTerm}
            pages={pages}
            onSelect={(page) => activeBlockId && handleMentionSelect(page, activeBlockId)}
            position={menuPosition}
            selectedIndex={mentionMenuIndex}
          />
        )}
        {commentDialogOpen && commentingBlockId && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-[109]"
              onClick={() => setCommentDialogOpen(false)}
            />
            <div
              className="fixed z-[110] bg-background border shadow-2xl rounded-xl p-3 w-80 backdrop-blur-md ring-1 ring-primary/20"
              style={{
                top: menuPosition.top + 40,
                left: Math.min(menuPosition.left, window.innerWidth - 340)
              }}
            >
              <div className="flex flex-col gap-2">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="w-full min-h-[80px] bg-muted/50 border-none focus:ring-1 ring-primary/30 rounded-lg p-2 text-sm resize-none outline-none"
                  autoFocus
                />
                <div className="flex justify-end gap-2 text-xs">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-muted-foreground"
                    onClick={() => setCommentDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 px-3 font-semibold"
                    onClick={() => handleAddComment(commentingBlockId, commentText)}
                  >
                    Comment
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
        {wikiMenuOpen && (
          <WikiLinkMenu
            isOpen={wikiMenuOpen}
            searchTerm={wikiSearchTerm}
            pages={pages}
            onSelect={(page) => activeBlockId && handleWikiSelect(page, activeBlockId)}
            position={menuPosition}
            selectedIndex={wikiMenuIndex}
            onCreatePage={onCreatePage}
          />
        )}

        {(isSelectionVisible && selectionPosition) && (
          <AIAssistant
            selectedText={selectedText}
            onReplace={handleAIReplace}
            onInsert={handleAIInsert}
            position={selectionPosition}
            onClose={clearSelection}
          />
        )}
        {aiAssistantOpen && manualAiPos && !isSelectionVisible && (
          <AIAssistant
            selectedText={""}
            onReplace={(text) => {
              // Insert text at cursor
              document.execCommand('insertText', false, text);
              setAiAssistantOpen(false);
            }}
            onInsert={(text) => {
              // Insert text at cursor
              document.execCommand('insertText', false, text);
              setAiAssistantOpen(false);
            }}
            position={manualAiPos}
            onClose={() => setAiAssistantOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
