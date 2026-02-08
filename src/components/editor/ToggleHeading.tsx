import { ReactNode, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToggleHeadingProps {
  level: 1 | 2 | 3;
  content: string;
  isOpen: boolean;
  onToggle: () => void;
  onContentChange: (content: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLElement>) => void;
  onFocus: () => void;
  readOnly?: boolean;
  children?: ReactNode;
}

const headingStyles = {
  1: "text-3xl font-bold",
  2: "text-2xl font-semibold",
  3: "text-xl font-medium",
};

const placeholders = {
  1: "Toggle Heading 1",
  2: "Toggle Heading 2",
  3: "Toggle Heading 3",
};

export function ToggleHeading({
  level,
  content,
  isOpen,
  onToggle,
  onContentChange,
  onKeyDown,
  onFocus,
  readOnly = false,
  children,
}: ToggleHeadingProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <button
          onClick={() => !readOnly && onToggle()}
          className="mt-1 p-0.5 hover:bg-muted rounded transition-colors"
          disabled={readOnly}
        >
          <ChevronDown
            className={cn(
              "h-5 w-5 transition-transform",
              !isOpen && "-rotate-90"
            )}
          />
        </button>
        <div
          contentEditable={!readOnly}
          suppressContentEditableWarning
          onBlur={(e) => onContentChange(e.currentTarget.innerHTML)}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
          className={cn(
            "outline-none w-full",
            headingStyles[level]
          )}
          data-placeholder={placeholders[level]}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="ml-7 pl-4 border-l-2 border-muted"
          >
            {children || (
              <div className="text-sm text-muted-foreground py-2">
                Click to add nested content...
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
