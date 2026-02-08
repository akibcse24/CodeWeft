import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bold, Italic, Strikethrough, Code, Link as LinkIcon,
  Highlighter, Type, ChevronDown, MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AIInlineActions } from "./AIInlineActions";

interface InlineToolbarProps {
  containerRef: React.RefObject<HTMLElement>;
  onFormatChange?: () => void;
  onTurnInto?: (type: string) => void;
  onComment?: () => void;
}

const HIGHLIGHT_COLORS = [
  { name: "Yellow", value: "rgb(250, 245, 133)" },
  { name: "Green", value: "rgb(186, 245, 186)" },
  { name: "Blue", value: "rgb(186, 218, 255)" },
  { name: "Pink", value: "rgb(255, 186, 218)" },
  { name: "Purple", value: "rgb(218, 186, 255)" },
  { name: "Orange", value: "rgb(255, 218, 186)" },
];

const TEXT_COLORS = [
  { name: "Default", value: "inherit" },
  { name: "Gray", value: "rgb(120, 119, 116)" },
  { name: "Red", value: "rgb(224, 62, 62)" },
  { name: "Orange", value: "rgb(227, 137, 17)" },
  { name: "Yellow", value: "rgb(203, 145, 47)" },
  { name: "Green", value: "rgb(68, 131, 97)" },
  { name: "Blue", value: "rgb(51, 126, 169)" },
  { name: "Purple", value: "rgb(144, 101, 176)" },
  { name: "Pink", value: "rgb(193, 76, 138)" },
];

const TURN_INTO_OPTIONS = [
  { label: "Text", type: "paragraph" },
  { label: "Heading 1", type: "heading1" },
  { label: "Heading 2", type: "heading2" },
  { label: "Heading 3", type: "heading3" },
  { label: "To-do list", type: "todo" },
  { label: "Bullet list", type: "bulletList" },
  { label: "Numbered list", type: "numberedList" },
  { label: "Toggle list", type: "toggle" },
  { label: "Code", type: "code" },
  { label: "Quote", type: "quote" },
  { label: "Callout", type: "callout" },
];

export function InlineToolbar({ containerRef, onFormatChange, onTurnInto, onComment }: InlineToolbarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [selectedText, setSelectedText] = useState("");
  const toolbarRef = useRef<HTMLDivElement>(null);
  const selectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate position based on selection
  const updatePosition = useCallback(() => {
    const selection = window.getSelection();
    
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      return null;
    }

    const range = selection.getRangeAt(0);
    const container = containerRef.current;

    if (!container || !container.contains(range.commonAncestorContainer)) {
      return null;
    }

    const rect = range.getBoundingClientRect();
    const toolbarWidth = 380;
    const toolbarHeight = 48;
    const padding = 8;

    // Calculate optimal position - prefer above selection
    let top = rect.top - toolbarHeight - padding;
    let left = rect.left + (rect.width / 2) - (toolbarWidth / 2);

    // Ensure toolbar stays within viewport
    if (top < padding) {
      top = rect.bottom + padding; // Show below if no room above
    }

    if (left < padding) {
      left = padding;
    } else if (left + toolbarWidth > window.innerWidth - padding) {
      left = window.innerWidth - toolbarWidth - padding;
    }

    return { top, left, text: selection.toString() };
  }, [containerRef]);

  useEffect(() => {
    const handleSelectionChange = () => {
      // Debounce selection changes
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
      }

      selectionTimeoutRef.current = setTimeout(() => {
        const result = updatePosition();
        
        if (result) {
          setPosition({ top: result.top, left: result.left });
          setSelectedText(result.text);
          setIsVisible(true);
        } else {
          setIsVisible(false);
          setShowLinkInput(false);
          setSelectedText("");
        }
      }, 100);
    };

    const handleMouseUp = () => {
      // Small delay to ensure selection is complete
      setTimeout(handleSelectionChange, 10);
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    document.addEventListener("mouseup", handleMouseUp);
    
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      document.removeEventListener("mouseup", handleMouseUp);
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
      }
    };
  }, [updatePosition]);

  const applyFormat = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    onFormatChange?.();
  }, [onFormatChange]);

  const isFormatActive = useCallback((command: string) => {
    try {
      return document.queryCommandState(command);
    } catch {
      return false;
    }
  }, []);

  const handleInlineCode = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const selectedText = range.toString();
      const code = document.createElement("code");
      code.className = "px-1.5 py-0.5 rounded bg-muted font-mono text-sm text-primary";
      code.textContent = selectedText;
      range.deleteContents();
      range.insertNode(code);
      
      // Move cursor after the code element
      range.setStartAfter(code);
      range.setEndAfter(code);
      selection.removeAllRanges();
      selection.addRange(range);
      
      onFormatChange?.();
    }
  }, [onFormatChange]);

  const handleLink = useCallback(() => {
    if (linkUrl) {
      applyFormat("createLink", linkUrl);
      setShowLinkInput(false);
      setLinkUrl("");
    } else {
      setShowLinkInput(true);
    }
  }, [linkUrl, applyFormat]);

  const handleAIReplace = useCallback((newText: string) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(newText));
      onFormatChange?.();
    }
    setIsVisible(false);
  }, [onFormatChange]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={toolbarRef}
        initial={{ opacity: 0, y: 8, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.96 }}
        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="fixed z-[9999] flex items-center gap-0.5 p-1.5 bg-popover border border-border shadow-xl rounded-lg"
        style={{
          top: position.top,
          left: position.left,
        }}
        onMouseDown={(e) => e.preventDefault()}
      >
        {/* Turn Into Menu */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs font-medium hover:bg-accent"
            >
              <span className="hidden sm:inline">Turn into</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-44 p-1" align="start" sideOffset={8}>
            <div className="flex flex-col">
              {TURN_INTO_OPTIONS.map((item) => (
                <Button
                  key={item.type}
                  variant="ghost"
                  size="sm"
                  className="justify-start h-8 px-2 text-sm font-normal"
                  onClick={() => {
                    onTurnInto?.(item.type);
                    setIsVisible(false);
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <div className="w-px h-5 bg-border mx-0.5" />

        {/* Format buttons */}
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-7 w-7", isFormatActive("bold") && "bg-accent text-accent-foreground")}
          onClick={() => applyFormat("bold")}
          title="Bold (⌘B)"
        >
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-7 w-7", isFormatActive("italic") && "bg-accent text-accent-foreground")}
          onClick={() => applyFormat("italic")}
          title="Italic (⌘I)"
        >
          <Italic className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-7 w-7", isFormatActive("strikeThrough") && "bg-accent text-accent-foreground")}
          onClick={() => applyFormat("strikeThrough")}
          title="Strikethrough"
        >
          <Strikethrough className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={handleInlineCode}
          title="Inline code (⌘E)"
        >
          <Code className="h-3.5 w-3.5" />
        </Button>

        <div className="w-px h-5 bg-border mx-0.5" />

        {/* Link input or button */}
        {showLinkInput ? (
          <div className="flex items-center gap-1 animate-in slide-in-from-left-2">
            <Input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleLink();
                if (e.key === "Escape") setShowLinkInput(false);
              }}
              placeholder="Paste link..."
              className="h-7 w-36 text-xs"
              autoFocus
            />
            <Button size="sm" className="h-7 px-2 text-xs" onClick={handleLink}>
              Add
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setShowLinkInput(true)}
            title="Add link (⌘K)"
          >
            <LinkIcon className="h-3.5 w-3.5" />
          </Button>
        )}

        <div className="w-px h-5 bg-border mx-0.5" />

        {/* Highlight color picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" title="Highlight">
              <Highlighter className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start" sideOffset={8}>
            <div className="grid grid-cols-3 gap-1.5">
              {HIGHLIGHT_COLORS.map((color) => (
                <button
                  key={color.name}
                  className="w-6 h-6 rounded border border-border/50 hover:scale-110 transition-transform shadow-sm"
                  style={{ backgroundColor: color.value }}
                  onClick={() => applyFormat("hiliteColor", color.value)}
                  title={color.name}
                />
              ))}
              <button
                className="w-6 h-6 rounded border border-border/50 text-xs font-medium hover:bg-muted flex items-center justify-center"
                onClick={() => applyFormat("removeFormat")}
                title="Remove formatting"
              >
                ✕
              </button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Text color picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" title="Text color">
              <Type className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start" sideOffset={8}>
            <div className="grid grid-cols-3 gap-1.5">
              {TEXT_COLORS.map((color) => (
                <button
                  key={color.name}
                  className="w-6 h-6 rounded border border-border/50 hover:scale-110 transition-transform flex items-center justify-center font-bold text-xs"
                  onClick={() => applyFormat("foreColor", color.value)}
                  style={{ color: color.value === "inherit" ? undefined : color.value }}
                  title={color.name}
                >
                  A
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <div className="w-px h-5 bg-border mx-0.5" />

        {/* AI Actions */}
        <AIInlineActions 
          selectedText={selectedText}
          onReplace={handleAIReplace}
          onClose={() => setIsVisible(false)}
        />

        <div className="w-px h-5 bg-border mx-0.5" />

        {/* Comment button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => {
            onComment?.();
            setIsVisible(false);
          }}
          title="Add comment"
        >
          <MessageSquare className="h-3.5 w-3.5" />
        </Button>
      </motion.div>
    </AnimatePresence>
  );
}
