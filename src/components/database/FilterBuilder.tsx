import { useState, useCallback } from "react";
import {
  FilterConfig,
  FilterGroup,
  FilterCondition,
  FilterOperator,
} from "@/services/filter/engine";
import { PropertyConfig } from "@/lib/page-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus, GripVertical, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterBuilderProps {
  filter: FilterConfig | null;
  properties: Record<string, PropertyConfig>;
  onChange: (filter: FilterConfig | null) => void;
  className?: string;
}

const OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: "equals", label: "equals" },
  { value: "not_equals", label: "does not equal" },
  { value: "contains", label: "contains" },
  { value: "not_contains", label: "does not contain" },
  { value: "starts_with", label: "starts with" },
  { value: "ends_with", label: "ends with" },
  { value: "is_empty", label: "is empty" },
  { value: "is_not_empty", label: "is not empty" },
  { value: "greater_than", label: "is greater than" },
  { value: "less_than", label: "is less than" },
  { value: "greater_or_equal", label: "is greater than or equal to" },
  { value: "less_or_equal", label: "is less than or equal to" },
  { value: "before", label: "is before" },
  { value: "after", label: "is after" },
  { value: "includes", label: "includes" },
  { value: "excludes", label: "excludes" },
];

export function FilterBuilder({
  filter,
  properties,
  onChange,
  className,
}: FilterBuilderProps) {
  const [localFilter, setLocalFilter] = useState<FilterGroup>(
    filter && "and" in filter && filter.and
      ? { and: [...(filter.and as (FilterCondition | FilterGroup)[])] }
      : filter && "or" in filter && filter.or
      ? { or: [...(filter.or as (FilterCondition | FilterGroup)[])] }
      : { and: [] }
  );

  const handleOperatorChange = useCallback(
    (operator: "and" | "or") => {
      const newFilter: FilterGroup = { [operator]: localFilter.and || localFilter.or || [] };
      setLocalFilter(newFilter);
      onChange(newFilter);
    },
    [localFilter, onChange]
  );

  const handleAddCondition = useCallback(() => {
    const propertyIds = Object.keys(properties);
    if (propertyIds.length === 0) return;

    const firstProperty = propertyIds[0];
    const newCondition: FilterCondition = {
      property: firstProperty,
      operator: "equals",
      value: undefined,
    };

    const conditions = localFilter.and || localFilter.or || [];
    const newFilter: FilterGroup = localFilter.and
      ? { and: [...conditions, newCondition] }
      : { or: [...conditions, newCondition] };

    setLocalFilter(newFilter);
    onChange(newFilter);
  }, [properties, localFilter, onChange]);

  const handleUpdateCondition = useCallback(
    (index: number, updates: Partial<FilterCondition>) => {
      const conditions = localFilter.and || localFilter.or || [];
      const newConditions = [...conditions];
      newConditions[index] = { ...(newConditions[index] as FilterCondition), ...updates };

      const newFilter: FilterGroup = localFilter.and
        ? { and: newConditions }
        : { or: newConditions };

      setLocalFilter(newFilter);
      onChange(newFilter);
    },
    [localFilter, onChange]
  );

  const handleRemoveCondition = useCallback(
    (index: number) => {
      const conditions = localFilter.and || localFilter.or || [];
      const newConditions = conditions.filter((_, i) => i !== index);

      if (newConditions.length === 0) {
        setLocalFilter({ and: [] });
        onChange(null);
      } else {
        const newFilter: FilterGroup = localFilter.and
          ? { and: newConditions }
          : { or: newConditions };

        setLocalFilter(newFilter);
        onChange(newFilter);
      }
    },
    [localFilter, onChange]
  );

  const propertyList = Object.entries(properties);
  const conditions = (localFilter.and || localFilter.or) as (FilterCondition | FilterGroup)[];

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Filter where</span>
        <Select
          value={localFilter.and ? "and" : "or"}
          onValueChange={(val: "and" | "or") => handleOperatorChange(val)}
        >
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="and">all</SelectItem>
            <SelectItem value="or">any</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm font-medium">of the following are true:</span>
      </div>

      {conditions.length > 0 && (
        <div className="space-y-2 pl-4 border-l-2 border-muted">
          {conditions.map((condition, index) => {
            if ("and" in condition || "or" in condition) {
              return (
                <NestedFilterGroup
                  key={`group-${index}`}
                  group={condition as FilterGroup}
                  properties={properties}
                  level={1}
                  onChange={(updatedGroup) => {
                    const newConditions = [...conditions];
                    newConditions[index] = updatedGroup;
                    const newFilter = localFilter.and
                      ? { and: newConditions }
                      : { or: newConditions };
                    setLocalFilter(newFilter);
                    onChange(newFilter);
                  }}
                  onRemove={() => handleRemoveCondition(index)}
                />
              );
            }

            return (
              <FilterConditionRow
                key={`condition-${index}`}
                condition={condition as FilterCondition}
                properties={properties}
                onChange={(updates) => handleUpdateCondition(index, updates)}
                onRemove={() => handleRemoveCondition(index)}
              />
            );
          })}
        </div>
      )}

      <Button variant="outline" size="sm" onClick={handleAddCondition}>
        <Plus className="w-4 h-4 mr-1" />
        Add filter
      </Button>
    </div>
  );
}

interface FilterConditionRowProps {
  condition: FilterCondition;
  properties: Record<string, PropertyConfig>;
  onChange: (updates: Partial<FilterCondition>) => void;
  onRemove: () => void;
}

function FilterConditionRow({
  condition,
  properties,
  onChange,
  onRemove,
}: FilterConditionRowProps) {
  const propertyList = Object.entries(properties);
  const showValue = !["is_empty", "is_not_empty"].includes(condition.operator);

  return (
    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
      <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />

      <Select
        value={condition.property}
        onValueChange={(val) => onChange({ property: val })}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Property" />
        </SelectTrigger>
        <SelectContent>
          {propertyList.map(([id, prop]) => (
            <SelectItem key={id} value={id}>
              {prop.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={condition.operator}
        onValueChange={(val: FilterOperator) => onChange({ operator: val })}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Operator" />
        </SelectTrigger>
        <SelectContent>
          {OPERATORS.map((op) => (
            <SelectItem key={op.value} value={op.value}>
              {op.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showValue && (
        <Input
          value={String(condition.value ?? "")}
          onChange={(e) => onChange({ value: e.target.value })}
          placeholder="Value..."
          className="w-40"
        />
      )}

      <Button variant="ghost" size="sm" onClick={onRemove}>
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}

interface NestedFilterGroupProps {
  group: FilterGroup;
  properties: Record<string, PropertyConfig>;
  level: number;
  onChange: (group: FilterGroup) => void;
  onRemove: () => void;
}

function NestedFilterGroup({
  group,
  properties,
  level,
  onChange,
  onRemove,
}: NestedFilterGroupProps) {
  const innerConditions = (group.and || group.or) as (FilterCondition | FilterGroup)[];

  return (
    <div
      className="space-y-2 p-3 bg-muted/30 rounded-lg border border-dashed"
      style={{ marginLeft: `${level * 16}px` }}
    >
      <div className="flex items-center gap-2 mb-2">
        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
        <span className="text-xs text-muted-foreground">Nested group</span>
        <Button variant="ghost" size="sm" onClick={onRemove} className="ml-auto">
          <X className="w-3 h-3" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm">Match</span>
        <Select
          value={group.and ? "and" : "or"}
          onValueChange={(val: "and" | "or") =>
            onChange({ [val]: innerConditions })
          }
        >
          <SelectTrigger className="w-20 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="and">all</SelectItem>
            <SelectItem value="or">any</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm">of:</span>
      </div>

      <div className="space-y-2 pl-4 border-l border-muted">
        {innerConditions.map((condition, index) => {
          if ("and" in condition || "or" in condition) {
            return (
              <NestedFilterGroup
                key={`nested-${index}`}
                group={condition as FilterGroup}
                properties={properties}
                level={level + 1}
                onChange={(updatedGroup) => {
                  const newConditions = [...innerConditions];
                  newConditions[index] = updatedGroup;
                  onChange(group.and ? { and: newConditions } : { or: newConditions });
                }}
                onRemove={() => {
                  const newConditions = innerConditions.filter((_, i) => i !== index);
                  if (newConditions.length === 0) {
                    onRemove();
                  } else {
                    onChange(
                      group.and
                        ? { and: newConditions }
                        : { or: newConditions }
                    );
                  }
                }}
              />
            );
          }

          return (
            <FilterConditionRow
              key={`condition-${index}`}
              condition={condition as FilterCondition}
              properties={properties}
              onChange={(updates) => {
                const newConditions = [...innerConditions];
                newConditions[index] = {
                  ...(newConditions[index] as FilterCondition),
                  ...updates,
                };
                onChange(
                  group.and ? { and: newConditions } : { or: newConditions }
                );
              }}
              onRemove={() => {
                const newConditions = innerConditions.filter((_, i) => i !== index);
                if (newConditions.length === 0) {
                  onRemove();
                } else {
                  onChange(
                    group.and
                      ? { and: newConditions }
                      : { or: newConditions }
                  );
                }
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

export default FilterBuilder;
