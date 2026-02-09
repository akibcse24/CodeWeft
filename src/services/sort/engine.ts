export type SortDirection = "asc" | "desc";

export type SortDataType = "text" | "number" | "date" | "checkbox";

export interface SortConfig {
  property: string;
  direction: SortDirection;
  dataType?: SortDataType;
}

export interface MultiSortConfig {
  sorts: SortConfig[];
}

export interface SortableItem {
  [key: string]: unknown;
}

export class SortEngine {
  private static instance: SortEngine;

  static getInstance(): SortEngine {
    if (!SortEngine.instance) {
      SortEngine.instance = new SortEngine();
    }
    return SortEngine.instance;
  }

  sort<T extends SortableItem>(
    items: T[],
    sortConfig: MultiSortConfig,
    configs?: Record<string, SortConfig>
  ): T[] {
    if (!sortConfig.sorts || sortConfig.sorts.length === 0) {
      return [...items];
    }

    const sorted = [...items];

    sorted.sort((a, b) => {
      for (const sort of sortConfig.sorts) {
        const config = configs?.[sort.property] || sort;
        const comparison = this.compareValues(
          a[sort.property],
          b[sort.property],
          config.dataType || "text"
        );

        if (comparison !== 0) {
          return sort.direction === "desc" ? -comparison : comparison;
        }
      }
      return 0;
    });

    return sorted;
  }

  private compareValues(
    a: unknown,
    b: unknown,
    dataType: SortDataType
  ): number {
    const aIsNull = a === null || a === undefined || a === "";
    const bIsNull = b === null || b === undefined || b === "";

    if (aIsNull && bIsNull) return 0;
    if (aIsNull) return 1;
    if (bIsNull) return -1;

    switch (dataType) {
      case "number":
        return this.compareNumbers(a, b);
      case "date":
        return this.compareDates(a, b);
      case "checkbox":
        return this.compareCheckboxes(a, b);
      case "text":
      default:
        return this.compareText(a, b);
    }
  }

  private compareNumbers(a: unknown, b: unknown): number {
    const numA = typeof a === "number" ? a : parseFloat(String(a));
    const numB = typeof b === "number" ? b : parseFloat(String(b));

    if (isNaN(numA) && isNaN(numB)) return 0;
    if (isNaN(numA)) return 1;
    if (isNaN(numB)) return -1;

    return numA - numB;
  }

  private compareDates(a: unknown, b: unknown): number {
    const dateA = a instanceof Date ? a : new Date(String(a));
    const dateB = b instanceof Date ? b : new Date(String(b));

    if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
    if (isNaN(dateA.getTime())) return 1;
    if (isNaN(dateB.getTime())) return -1;

    return dateA.getTime() - dateB.getTime();
  }

  private compareCheckboxes(a: unknown, b: unknown): number {
    const boolA = this.toBoolean(a);
    const boolB = this.toBoolean(b);

    if (boolA === boolB) return 0;
    return boolA ? -1 : 1;
  }

  private compareText(a: unknown, b: unknown): number {
    const strA = String(a).toLowerCase().trim();
    const strB = String(b).toLowerCase().trim();

    return strA.localeCompare(strB);
  }

  private toBoolean(value: unknown): boolean {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      return value.toLowerCase() === "true" || value === "1";
    }
    if (typeof value === "number") return value !== 0;
    return false;
  }

  detectDataType(value: unknown): SortDataType {
    if (value === null || value === undefined) return "text";
    if (typeof value === "boolean") return "checkbox";
    if (typeof value === "number") return "number";
    if (value instanceof Date) return "date";
    if (typeof value === "string") {
      if (!isNaN(Date.parse(value))) return "date";
      if (!isNaN(parseFloat(value)) && isFinite(Number(value))) return "number";
      if (value.toLowerCase() === "true" || value.toLowerCase() === "false") {
        return "checkbox";
      }
    }
    return "text";
  }
}

export const sortEngine = SortEngine.getInstance();
