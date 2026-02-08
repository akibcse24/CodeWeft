import React from 'react';
import { Plus, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface BlockHandlesProps {
  onAddBlock: () => void;
  onDragStart?: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
  isVisible: boolean;
  className?: string;
}

export function BlockHandles({
  onAddBlock,
  dragHandleProps,
  isVisible,
  className
}: BlockHandlesProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full flex items-center gap-0.5 pr-1",
        "pointer-events-none",
        isVisible && "pointer-events-auto",
        className
      )}
    >
      {/* Add block button */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onAddBlock();
        }}
        className={cn(
          "flex items-center justify-center h-6 w-6 rounded-md",
          "text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50",
          "transition-colors duration-150"
        )}
        title="Add block below"
      >
        <Plus className="h-4 w-4" />
      </button>

      {/* Drag handle */}
      <button
        type="button"
        {...dragHandleProps}
        className={cn(
          "flex items-center justify-center h-6 w-6 rounded-md cursor-grab active:cursor-grabbing",
          "text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50",
          "transition-colors duration-150"
        )}
        title="Drag to move"
      >
        <GripVertical className="h-4 w-4" />
      </button>
    </motion.div>
  );
}
