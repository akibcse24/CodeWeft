import { useState, useCallback } from "react";
import {
  MultiSortConfig,
  SortConfig,
  SortDirection,
} from "@/services/sort/engine";
import { PropertyConfig } from "@/lib/page-content";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GripVertical, ArrowUp, ArrowDown, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortBuilderProps {
  config: MultiSortConfig;
  properties: Record<string, PropertyConfig>;
  onChange: (config: MultiSortConfig) => void;
  className?: string;
}

export function SortBuilder({
  config,
  properties,
  onChange,
  className,
}: SortBuilderProps) {
  const [sorts, setSorts] = useState<SortConfig[]>(config.sorts || []);

  const handleAddSort = useCallback(() => {
    const propertyIds = Object.keys(properties);
    if (propertyIds.length === 0) return;

    const newSort: SortConfig = {
      property: propertyIds[0],
      direction: "asc",
      dataType: "text",
    };

    const newSorts = [...sorts, newSort];
    setSorts(newSorts);
    onChange({ sorts: newSorts });
  }, [properties, sorts, onChange]);

  const handleUpdateSort = useCallback(
    (index: number, updates: Partial<SortConfig>) => {
      const newSorts = sorts.map((sort, i) =>
        i === index ? { ...sort, ...updates } : sort
      );
      setSorts(newSorts);
      onChange({ sorts: newSorts });
    },
    [sorts, onChange]
  );

  const handleRemoveSort = useCallback(
    (index: number) => {
      const newSorts = sorts.filter((_, i) => i !== index);
      setSorts(newSorts);
      onChange({ sorts: newSorts });
    },
    [sorts, onChange]
  );

  const handleMoveSort = useCallback(
    (fromIndex: number, direction: "up" | "down") => {
      const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
      if (toIndex < 0 || toIndex >= sorts.length) return;

      const newSorts = [...sorts];
      [newSorts[fromIndex], newSorts[toIndex]] = [
        newSorts[toIndex],
        newSorts[fromIndex],
      ];
      setSorts(newSorts);
      onChange({ sorts: newSorts });
    },
    [sorts, onChange]
  );

  const propertyList = Object.entries(properties);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="text-sm font-medium">Sort by</div>

      {sorts.length > 0 && (
        <div className="space-y-2">
          {sorts.map((sort, index) => (
            <SortRow
              key={index}
              sort={sort}
              index={index}
              properties={propertyList}
              isFirst={index === 0}
              isLast={index === sorts.length - 1}
              onChange={(updates) => handleUpdateSort(index, updates)}
              onMove={(direction) => handleMoveSort(index, direction)}
              onRemove={() => handleRemoveSort(index)}
            />
          ))}
        </div>
      )}

      {sorts.length < propertyList.length && (
        <Button variant="outline" size="sm" onClick={handleAddSort}>
          <Plus className="w-4 h-4 mr-1" />
          Add sort
        </Button>
      )}

      {sorts.length === 0 && (
        <div className="text-sm text-muted-foreground">
          No sorting applied. Add a sort to organize your data.
        </div>
      )}
    </div>
  );
}

interface SortRowProps {
  sort: SortConfig;
  index: number;
  properties: [string, PropertyConfig][];
  isFirst: boolean;
  isLast: boolean;
  onChange: (updates: Partial<SortConfig>) => void;
  onMove: (direction: "up" | "down") => void;
  onRemove: () => void;
}

function SortRow({
  sort,
  index,
  properties,
  isFirst,
  isLast,
  onChange,
  onMove,
  onRemove,
}: SortRowProps) {
  const property = properties.find(([id]) => id === sort.property);
  const dataType = sort.dataType || "text";

  return (
    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
      <span className="text-xs text-muted-foreground w-5">{index + 1}</span>

      <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />

      <Select
        value={sort.property}
        onValueChange={(val) => onChange({ property: val })}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Property" />
        </SelectTrigger>
        <SelectContent>
          {properties.map(([id, prop]) => (
            <SelectItem key={id} value={id}>
              {prop.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="ghost"
        size="sm"
        onClick={() =>
          onChange({
            direction: sort.direction === "asc" ? "desc" : "asc",
          })
        }
        className="w-20"
      >
        {sort.direction === "asc" ? (
          <>
            <ArrowUp className="w-4 h-4 mr-1" />
            Asc
          </>
        ) : (
          <>
            <ArrowDown className="w-4 h-4 mr-1" />
            Desc
          </>
        )}
      </Button>

      <div className="flex items-center gap-1 ml-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onMove("up")}
          disabled={isFirst}
        >
          <ArrowUp className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onMove("down")}
          disabled={isLast}
        >
          <ArrowDown className="w-3 h-3" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onRemove}>
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default SortBuilder;
