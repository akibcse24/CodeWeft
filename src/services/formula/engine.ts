import { PropertyValue, PropertyConfig } from "@/lib/page-content";

export interface FormulaContext {
  properties: Record<string, PropertyValue>;
  configs: Record<string, PropertyConfig>;
}

export type FormulaResult = PropertyValue | '#ERROR';

interface ValidationResult {
  valid: boolean;
  error?: string;
}

const ALLOWED_FUNCTIONS = new Set([
  'prop', 'now', 'today', 'if', 'concat', 'contains', 'empty',
  'abs', 'ceil', 'floor', 'max', 'min', 'pow', 'round', 'sqrt',
  'and', 'or', 'not',
  'date', 'year', 'month', 'day', 'hour', 'minute',
  'length', 'lower', 'upper', 'trim', 'substring',
  'sum', 'avg', 'count'
]);

const ALLOWED_OPERATORS = new Set([
  '+', '-', '*', '/', '%', '**',
  '==', '!=', '===', '!==',
  '<', '>', '<=', '>=',
  '&&', '||', '!',
  '?', ':'
]);

export class FormulaEngine {
  private context: FormulaContext;

  constructor(context: FormulaContext) {
    this.context = context;
  }

  evaluate(formula: string): FormulaResult {
    try {
      const sanitized = this.sanitizeFormula(formula);
      if (!sanitized) {
        return '#ERROR';
      }

      const result = this.evaluateExpression(sanitized);
      return this.normalizeResult(result);
    } catch (error) {
      console.error('Formula evaluation error:', error);
      return '#ERROR';
    }
  }

  validate(formula: string): ValidationResult {
    try {
      if (!formula || typeof formula !== 'string') {
        return { valid: false, error: 'Formula must be a non-empty string' };
      }

      const sanitized = this.sanitizeFormula(formula);
      if (!sanitized) {
        return { valid: false, error: 'Formula contains invalid characters or patterns' };
      }

      this.validateSyntax(sanitized);
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown validation error'
      };
    }
  }

  getDependencies(formula: string): string[] {
    const dependencies: string[] = [];
    const propRegex = /prop\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    let match;

    while ((match = propRegex.exec(formula)) !== null) {
      dependencies.push(match[1]);
    }

    return [...new Set(dependencies)];
  }

  private sanitizeFormula(formula: string): string | null {
    if (!formula) return null;

    const sanitized = formula.trim();

    if (sanitized.length > 10000) {
      throw new Error('Formula too long (max 10000 characters)');
    }

    const dangerousPatterns = [
      /eval\s*\(/i,
      /function\s*\(/i,
      /=>/,
      /new\s+/i,
      /__proto__/i,
      /constructor/i,
      /prototype/i,
      /window/i,
      /document/i,
      /globalThis/i,
      /process/i,
      /require\s*\(/i,
      /import\s*\(/i,
      /fetch\s*\(/i,
      /XMLHttpRequest/i,
      /WebSocket/i,
      /localStorage/i,
      /sessionStorage/i,
      /alert\s*\(/i,
      /confirm\s*\(/i,
      /prompt\s*\(/i
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(sanitized)) {
        throw new Error('Formula contains forbidden patterns');
      }
    }

    return sanitized;
  }

  private validateSyntax(formula: string): void {
    const openParens = (formula.match(/\(/g) || []).length;
    const closeParens = (formula.match(/\)/g) || []).length;

    if (openParens !== closeParens) {
      throw new Error('Mismatched parentheses');
    }

    const openBrackets = (formula.match(/\[/g) || []).length;
    const closeBrackets = (formula.match(/\]/g) || []).length;

    if (openBrackets !== closeBrackets) {
      throw new Error('Mismatched brackets');
    }
  }

  private evaluateExpression(expr: string): unknown {
    const tokens = this.tokenize(expr);
    return this.parseTokens(tokens);
  }

  private tokenize(expr: string): string[] {
    const tokens: string[] = [];
    let current = '';
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < expr.length; i++) {
      const char = expr[i];

      if (!inString && (char === '"' || char === "'")) {
        if (current) {
          tokens.push(current);
          current = '';
        }
        inString = true;
        stringChar = char;
        current = char;
      } else if (inString && char === stringChar && expr[i - 1] !== '\\') {
        current += char;
        tokens.push(current);
        current = '';
        inString = false;
        stringChar = '';
      } else if (inString) {
        current += char;
      } else if (char === ' ' || char === '\t') {
        if (current) {
          tokens.push(current);
          current = '';
        }
      } else if (char === '(' || char === ')' || char === ',' || char === '[' || char === ']') {
        if (current) {
          tokens.push(current);
          current = '';
        }
        tokens.push(char);
      } else if (this.isOperatorChar(char)) {
        if (current && !this.isOperatorChar(current[0])) {
          tokens.push(current);
          current = '';
        }
        current += char;
      } else {
        if (current && this.isOperatorChar(current[0])) {
          tokens.push(current);
          current = '';
        }
        current += char;
      }
    }

    if (current) {
      tokens.push(current);
    }

    return tokens;
  }

  private isOperatorChar(char: string): boolean {
    return ['+', '-', '*', '/', '%', '<', '>', '=', '!', '&', '|', '?', ':', '^'].includes(char);
  }

  private parseTokens(tokens: string[]): unknown {
    return this.parseTernary(tokens);
  }

  private parseTernary(tokens: string[]): unknown {
    let condition = this.parseOr(tokens);

    while (tokens.length > 0 && tokens[0] === '?') {
      tokens.shift();
      const trueValue = this.parseTernary(tokens);

      if (tokens.length === 0 || (tokens[0] as string) !== ':') {
        throw new Error('Expected ":" in ternary expression');
      }
      tokens.shift();

      const falseValue = this.parseTernary(tokens);
      condition = condition ? trueValue : falseValue;
    }

    return condition;
  }

  private parseOr(tokens: string[]): unknown {
    let left = this.parseAnd(tokens);

    while (tokens.length > 0 && tokens[0] === '||') {
      tokens.shift();
      const right = this.parseAnd(tokens);
      left = left || right;
    }

    return left;
  }

  private parseAnd(tokens: string[]): unknown {
    let left = this.parseEquality(tokens);

    while (tokens.length > 0 && tokens[0] === '&&') {
      tokens.shift();
      const right = this.parseEquality(tokens);
      left = left && right;
    }

    return left;
  }

  private parseEquality(tokens: string[]): unknown {
    let left = this.parseComparison(tokens);

    while (tokens.length > 0 && (tokens[0] === '==' || tokens[0] === '!=' || tokens[0] === '===' || tokens[0] === '!==')) {
      const op = tokens.shift()!;
      const right = this.parseComparison(tokens);

      if (op === '==' || op === '===') {
        left = left === right;
      } else {
        left = left !== right;
      }
    }

    return left;
  }

  private parseComparison(tokens: string[]): unknown {
    let left = this.parseAddition(tokens);

    while (tokens.length > 0 && (tokens[0] === '<' || tokens[0] === '>' || tokens[0] === '<=' || tokens[0] === '>=')) {
      const op = tokens.shift()!;
      const right = this.parseAddition(tokens);

      switch (op) {
        case '<':
          left = (left as number) < (right as number);
          break;
        case '>':
          left = (left as number) > (right as number);
          break;
        case '<=':
          left = (left as number) <= (right as number);
          break;
        case '>=':
          left = (left as number) >= (right as number);
          break;
      }
    }

    return left;
  }

  private parseAddition(tokens: string[]): unknown {
    let left = this.parseMultiplication(tokens);

    while (tokens.length > 0 && (tokens[0] === '+' || tokens[0] === '-')) {
      const op = tokens.shift()!;
      const right = this.parseMultiplication(tokens);

      if (typeof left === 'string' || typeof right === 'string') {
        left = String(left) + String(right);
      } else {
        left = op === '+' ? (left as number) + (right as number) : (left as number) - (right as number);
      }
    }

    return left;
  }

  private parseMultiplication(tokens: string[]): unknown {
    let left = this.parsePower(tokens);

    while (tokens.length > 0 && (tokens[0] === '*' || tokens[0] === '/' || tokens[0] === '%')) {
      const op = tokens.shift()!;
      const right = this.parsePower(tokens);

      switch (op) {
        case '*':
          left = (left as number) * (right as number);
          break;
        case '/':
          if (right === 0) throw new Error('Division by zero');
          left = (left as number) / (right as number);
          break;
        case '%':
          left = (left as number) % (right as number);
          break;
      }
    }

    return left;
  }

  private parsePower(tokens: string[]): unknown {
    let left = this.parseUnary(tokens);

    if (tokens.length > 0 && tokens[0] === '**') {
      tokens.shift();
      const right = this.parsePower(tokens);
      left = Math.pow(left as number, right as number);
    }

    return left;
  }

  private parseUnary(tokens: string[]): unknown {
    if (tokens.length > 0 && tokens[0] === '!') {
      tokens.shift();
      return !this.parseUnary(tokens);
    }

    if (tokens.length > 0 && tokens[0] === '-') {
      tokens.shift();
      return -(this.parseUnary(tokens) as number);
    }

    if (tokens.length > 0 && tokens[0] === '+') {
      tokens.shift();
      return +(this.parseUnary(tokens) as number);
    }

    return this.parsePrimary(tokens);
  }

  private parsePrimary(tokens: string[]): unknown {
    if (tokens.length === 0) {
      throw new Error('Unexpected end of expression');
    }

    const token = tokens[0];

    if (token === '(') {
      tokens.shift();
      const result = this.parseTernary(tokens);

      if (tokens.length === 0 || tokens[0] !== ')') {
        throw new Error('Expected closing parenthesis');
      }
      tokens.shift();
      return result;
    }

    if (this.isString(token)) {
      tokens.shift();
      return token.slice(1, -1);
    }

    if (this.isNumber(token)) {
      tokens.shift();
      return parseFloat(token);
    }

    if (token === 'true') {
      tokens.shift();
      return true;
    }

    if (token === 'false') {
      tokens.shift();
      return false;
    }

    if (token === 'null') {
      tokens.shift();
      return null;
    }

    if (this.isFunction(token)) {
      return this.parseFunction(tokens);
    }

    throw new Error(`Unexpected token: ${token}`);
  }

  private isString(token: string): boolean {
    return (token.startsWith('"') && token.endsWith('"')) ||
      (token.startsWith("'") && token.endsWith("'"));
  }

  private isNumber(token: string): boolean {
    return !isNaN(parseFloat(token)) && isFinite(parseFloat(token));
  }

  private isFunction(token: string): boolean {
    return ALLOWED_FUNCTIONS.has(token);
  }

  private parseFunction(tokens: string[]): unknown {
    const funcName = tokens.shift()!;

    if (tokens.length === 0 || tokens[0] !== '(') {
      throw new Error(`Expected '(' after function name ${funcName}`);
    }
    tokens.shift();

    const args: unknown[] = [];

    while (tokens.length > 0 && (tokens[0] as string) !== ')') {
      args.push(this.parseTernary(tokens));

      if (tokens.length > 0 && (tokens[0] as string) === ',') {
        tokens.shift();
      }
    }

    if (tokens.length === 0 || (tokens[0] as string) !== ')') {
      throw new Error(`Expected ')' after function arguments`);
    }
    tokens.shift();

    return this.executeFunction(funcName, args);
  }

  private executeFunction(name: string, args: unknown[]): unknown {
    switch (name) {
      case 'prop':
        return this.prop(args[0] as string);
      case 'now':
        return this.now();
      case 'today':
        return this.today();
      case 'if':
        return this.if(args[0], args[1], args[2]);
      case 'concat':
        return this.concat(...args);
      case 'contains':
        return this.contains(args[0], args[1]);
      case 'empty':
        return this.empty(args[0]);
      case 'abs':
        return Math.abs(args[0] as number);
      case 'ceil':
        return Math.ceil(args[0] as number);
      case 'floor':
        return Math.floor(args[0] as number);
      case 'max':
        return Math.max(...(args as number[]));
      case 'min':
        return Math.min(...(args as number[]));
      case 'pow':
        return Math.pow(args[0] as number, args[1] as number);
      case 'round':
        return args.length > 1
          ? parseFloat((args[0] as number).toFixed(args[1] as number))
          : Math.round(args[0] as number);
      case 'sqrt':
        return Math.sqrt(args[0] as number);
      case 'and':
        return args.every(arg => Boolean(arg));
      case 'or':
        return args.some(arg => Boolean(arg));
      case 'not':
        return !args[0];
      case 'date':
        return this.date(args[0] as string);
      case 'year':
        return new Date(args[0] as string).getFullYear();
      case 'month':
        return new Date(args[0] as string).getMonth() + 1;
      case 'day':
        return new Date(args[0] as string).getDate();
      case 'hour':
        return new Date(args[0] as string).getHours();
      case 'minute':
        return new Date(args[0] as string).getMinutes();
      case 'length':
        return String(args[0]).length;
      case 'lower':
        return String(args[0]).toLowerCase();
      case 'upper':
        return String(args[0]).toUpperCase();
      case 'trim':
        return String(args[0]).trim();
      case 'substring':
        return String(args[0]).substring(args[1] as number, args[2] as number);
      case 'sum':
        return (args as number[]).reduce((a, b) => a + (b || 0), 0);
      case 'avg':
        return args.length > 0
          ? (args as number[]).reduce((a, b) => a + (b || 0), 0) / args.length
          : 0;
      case 'count':
        return args.length;
      default:
        throw new Error(`Unknown function: ${name}`);
    }
  }

  private prop(propertyName: string): PropertyValue {
    return this.context.properties[propertyName] ?? null;
  }

  private now(): string {
    return new Date().toISOString();
  }

  private today(): string {
    return new Date().toISOString().split('T')[0];
  }

  private if(condition: unknown, trueValue: unknown, falseValue: unknown): unknown {
    return condition ? trueValue : falseValue;
  }

  private concat(...args: unknown[]): string {
    return args.map(arg => String(arg ?? '')).join('');
  }

  private contains(haystack: unknown, needle: unknown): boolean {
    if (Array.isArray(haystack)) {
      return haystack.includes(needle);
    }
    if (typeof haystack === 'string') {
      return haystack.includes(String(needle));
    }
    return false;
  }

  private empty(value: unknown): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    return false;
  }

  private date(dateString: string): number {
    return new Date(dateString).getTime();
  }

  private normalizeResult(result: unknown): PropertyValue {
    if (result === null || result === undefined) return null;
    if (typeof result === 'boolean') return result;
    if (typeof result === 'number') return result;
    if (typeof result === 'string') return result;
    if (Array.isArray(result)) return result.map(String);
    return String(result);
  }
}

export function createFormulaEngine(context: FormulaContext): FormulaEngine {
  return new FormulaEngine(context);
}

export function evaluateFormula(formula: string, context: FormulaContext): FormulaResult {
  const engine = new FormulaEngine(context);
  return engine.evaluate(formula);
}

export function validateFormula(formula: string): ValidationResult {
  const engine = new FormulaEngine({ properties: {}, configs: {} });
  return engine.validate(formula);
}

export function getFormulaDependencies(formula: string): string[] {
  const engine = new FormulaEngine({ properties: {}, configs: {} });
  return engine.getDependencies(formula);
}
