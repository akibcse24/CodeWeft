import { PropertyValue, PropertyConfig } from "@/lib/page-content";

export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'is_empty'
  | 'is_not_empty'
  | 'greater_than'
  | 'less_than'
  | 'greater_or_equal'
  | 'less_or_equal'
  | 'before'
  | 'after'
  | 'includes'
  | 'excludes';

export interface FilterCondition {
  property: string;
  operator: FilterOperator;
  value?: PropertyValue;
}

export interface FilterGroup {
  and?: (FilterCondition | FilterGroup)[];
  or?: (FilterCondition | FilterGroup)[];
}

export type FilterConfig = FilterCondition | FilterGroup;

export interface FilterContext {
  properties: Record<string, PropertyValue>;
  configs: Record<string, PropertyConfig>;
}

export class FilterEngine {
  evaluate(filter: FilterConfig, context: FilterContext): boolean {
    try {
      return this.evaluateFilter(filter, context);
    } catch (error) {
      console.error('Filter evaluation error:', error);
      return false;
    }
  }

  filter<T>(
    items: T[],
    filter: FilterConfig,
    getContext: (item: T) => FilterContext
  ): T[] {
    return items.filter(item => {
      const context = getContext(item);
      return this.evaluate(filter, context);
    });
  }

  private evaluateFilter(filter: FilterConfig, context: FilterContext): boolean {
    if (this.isFilterGroup(filter)) {
      return this.evaluateGroup(filter as FilterGroup, context);
    }
    return this.evaluateCondition(filter as FilterCondition, context);
  }

  private isFilterGroup(filter: FilterConfig): boolean {
    return 'and' in filter || 'or' in filter;
  }

  private evaluateGroup(group: FilterGroup, context: FilterContext): boolean {
    if (group.and) {
      return group.and.every(filter => this.evaluateFilter(filter, context));
    }

    if (group.or) {
      return group.or.some(filter => this.evaluateFilter(filter, context));
    }

    return true;
  }

  private evaluateCondition(condition: FilterCondition, context: FilterContext): boolean {
    const { property, operator, value } = condition;
    const propertyValue = context.properties[property];
    const config = context.configs[property];

    switch (operator) {
      case 'equals':
        return this.equals(propertyValue, value);
      case 'not_equals':
        return !this.equals(propertyValue, value);
      case 'contains':
        return this.contains(propertyValue, value);
      case 'not_contains':
        return !this.contains(propertyValue, value);
      case 'starts_with':
        return this.startsWith(propertyValue, value);
      case 'ends_with':
        return this.endsWith(propertyValue, value);
      case 'is_empty':
        return this.isEmpty(propertyValue);
      case 'is_not_empty':
        return !this.isEmpty(propertyValue);
      case 'greater_than':
        return this.greaterThan(propertyValue, value);
      case 'less_than':
        return this.lessThan(propertyValue, value);
      case 'greater_or_equal':
        return this.greaterOrEqual(propertyValue, value);
      case 'less_or_equal':
        return this.lessOrEqual(propertyValue, value);
      case 'before':
        return this.before(propertyValue, value);
      case 'after':
        return this.after(propertyValue, value);
      case 'includes':
        return this.includes(propertyValue, value);
      case 'excludes':
        return !this.includes(propertyValue, value);
      default:
        return false;
    }
  }

  private equals(a: PropertyValue, b: PropertyValue): boolean {
    if (a === null || a === undefined) return b === null || b === undefined;
    if (b === null || b === undefined) return false;

    if (typeof a === 'boolean' || typeof b === 'boolean') {
      return Boolean(a) === Boolean(b);
    }

    if (typeof a === 'number' && typeof b === 'number') {
      return a === b;
    }

    return String(a) === String(b);
  }

  private contains(haystack: PropertyValue, needle: PropertyValue): boolean {
    if (haystack === null || haystack === undefined) return false;
    if (needle === null || needle === undefined) return false;

    if (Array.isArray(haystack)) {
      return haystack.some(item => String(item).toLowerCase().includes(String(needle).toLowerCase()));
    }

    return String(haystack).toLowerCase().includes(String(needle).toLowerCase());
  }

  private startsWith(value: PropertyValue, prefix: PropertyValue): boolean {
    if (value === null || value === undefined) return false;
    if (prefix === null || prefix === undefined) return false;
    return String(value).toLowerCase().startsWith(String(prefix).toLowerCase());
  }

  private endsWith(value: PropertyValue, suffix: PropertyValue): boolean {
    if (value === null || value === undefined) return false;
    if (suffix === null || suffix === undefined) return false;
    return String(value).toLowerCase().endsWith(String(suffix).toLowerCase());
  }

  private isEmpty(value: PropertyValue): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    return false;
  }

  private greaterThan(a: PropertyValue, b: PropertyValue): boolean {
    const numA = this.toNumber(a);
    const numB = this.toNumber(b);
    if (numA === null || numB === null) return false;
    return numA > numB;
  }

  private lessThan(a: PropertyValue, b: PropertyValue): boolean {
    const numA = this.toNumber(a);
    const numB = this.toNumber(b);
    if (numA === null || numB === null) return false;
    return numA < numB;
  }

  private greaterOrEqual(a: PropertyValue, b: PropertyValue): boolean {
    const numA = this.toNumber(a);
    const numB = this.toNumber(b);
    if (numA === null || numB === null) return false;
    return numA >= numB;
  }

  private lessOrEqual(a: PropertyValue, b: PropertyValue): boolean {
    const numA = this.toNumber(a);
    const numB = this.toNumber(b);
    if (numA === null || numB === null) return false;
    return numA <= numB;
  }

  private before(a: PropertyValue, b: PropertyValue): boolean {
    const dateA = this.toDate(a);
    const dateB = this.toDate(b);
    if (dateA === null || dateB === null) return false;
    return dateA < dateB;
  }

  private after(a: PropertyValue, b: PropertyValue): boolean {
    const dateA = this.toDate(a);
    const dateB = this.toDate(b);
    if (dateA === null || dateB === null) return false;
    return dateA > dateB;
  }

  private includes(array: PropertyValue, value: PropertyValue): boolean {
    if (!Array.isArray(array)) return false;
    if (value === null || value === undefined) return false;

    const searchValue = String(value).toLowerCase();
    return array.some(item => String(item).toLowerCase() === searchValue);
  }

  private toNumber(value: PropertyValue): number | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return value;
    const parsed = parseFloat(String(value));
    return isNaN(parsed) ? null : parsed;
  }

  private toDate(value: PropertyValue): Date | null {
    if (value === null || value === undefined) return null;
    if (value instanceof Date) return value;
    const date = new Date(String(value));
    return isNaN(date.getTime()) ? null : date;
  }
}

export function createFilterEngine(): FilterEngine {
  return new FilterEngine();
}

export function evaluateFilter(
  filter: FilterConfig,
  context: FilterContext
): boolean {
  const engine = new FilterEngine();
  return engine.evaluate(filter, context);
}

export function filterItems<T>(
  items: T[],
  filter: FilterConfig,
  getContext: (item: T) => FilterContext
): T[] {
  const engine = new FilterEngine();
  return engine.filter(items, filter, getContext);
}

export function createCondition(
  property: string,
  operator: FilterOperator,
  value?: PropertyValue
): FilterCondition {
  return { property, operator, value };
}

export function createAndGroup(
  ...filters: (FilterCondition | FilterGroup)[]
): FilterGroup {
  return { and: filters };
}

export function createOrGroup(
  ...filters: (FilterCondition | FilterGroup)[]
): FilterGroup {
  return { or: filters };
}
