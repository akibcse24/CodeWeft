import React from "react";
import { cn } from "@/lib/utils";
import { Block } from "./BlockEditor";

interface ColumnLayoutProps {
  columns: 2 | 3;
  columnData?: Block[][];
  renderBlock: (block: Block) => React.ReactNode;
  readOnly?: boolean;
}

export function ColumnLayout({
  columns,
  columnData = [],
  renderBlock,
  readOnly = false,
}: ColumnLayoutProps) {
  // Ensure we have the correct number of columns
  const columnArray = Array(columns)
    .fill(null)
    .map((_, i) => columnData[i] || []);

  return (
    <div
      className={cn(
        "grid gap-6 w-full my-4",
        columns === 2 && "grid-cols-1 md:grid-cols-2",
        columns === 3 && "grid-cols-1 md:grid-cols-3"
      )}
    >
      {columnArray.map((blocks, index) => (
        <div
          key={index}
          className={cn(
            "min-h-[50px] flex flex-col gap-1 rounded-lg border border-transparent transition-all",
            !readOnly && "hover:border-primary/10 hover:bg-accent/5 transition-colors p-2 -m-2"
          )}
        >
          {blocks.length > 0 ? (
            blocks.map((block) => (
              <React.Fragment key={block.id}>
                {renderBlock(block)}
              </React.Fragment>
            ))
          ) : !readOnly ? (
            <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-muted rounded-lg opacity-40 group hover:opacity-100 transition-opacity">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-primary">
                Column {index + 1}
              </p>
              <p className="text-[9px] text-muted-foreground italic mt-1 font-medium">
                Empty
              </p>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
