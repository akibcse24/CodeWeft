/**
 * Production-safe logging utility
 * Automatically disables logging in production builds
 */

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// Configure which log levels are enabled in production
const PROD_LOG_LEVELS = {
  log: false,
  info: false,
  warn: true,    // Keep warnings in production
  error: true,   // Keep errors in production
  debug: false,
};

/**
 * Logger class that safely handles logging across environments
 */
class Logger {
  private shouldLog(level: keyof typeof PROD_LOG_LEVELS): boolean {
    if (isDevelopment) return true;
    return PROD_LOG_LEVELS[level];
  }

  log(...args: unknown[]): void {
    if (this.shouldLog("log")) {
      console.log(...args);
    }
  }

  info(...args: unknown[]): void {
    if (this.shouldLog("info")) {
      console.info(...args);
    }
  }

  warn(...args: unknown[]): void {
    if (this.shouldLog("warn")) {
      console.warn(...args);
    }
  }

  error(...args: unknown[]): void {
    if (this.shouldLog("error")) {
      console.error(...args);
    }
  }

  debug(...args: unknown[]): void {
    if (this.shouldLog("debug")) {
      console.debug(...args);
    }
  }

  /**
   * Group logs together (development only)
   */
  group(label: string): void {
    if (isDevelopment) {
      console.group(label);
    }
  }

  groupEnd(): void {
    if (isDevelopment) {
      console.groupEnd();
    }
  }

  /**
   * Time a specific operation (development only)
   */
  time(label: string): void {
    if (isDevelopment) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (isDevelopment) {
      console.timeEnd(label);
    }
  }

  /**
   * Trace the call stack (development only)
   */
  trace(...args: unknown[]): void {
    if (isDevelopment) {
      console.trace(...args);
    }
  }
}

export const logger = new Logger();

/**
 * Higher-order function to wrap async functions with error logging
 */
export function withErrorLogging<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  context?: string
): T {
  return (async (...args: unknown[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      logger.error(
        context ? `[${context}] Error:` : "Error:",
        error instanceof Error ? error.message : error
      );
      throw error;
    }
  }) as T;
}

/**
 * Suppress specific console methods in production
 * Call this early in your app initialization
 */
export function suppressConsoleInProduction(): void {
  if (isProduction) {
    const noop = () => {};
    
    // Store original methods for restoration if needed
    const originalLog = console.log;
    const originalInfo = console.info;
    const originalDebug = console.debug;

    // Replace with no-ops
    console.log = noop;
    console.info = noop;
    console.debug = noop;

    // Keep warn and error
    // console.warn and console.error remain unchanged

    // Expose restoration method for debugging
    (window as Window & { restoreConsole?: () => void }).restoreConsole = () => {
      console.log = originalLog;
      console.info = originalInfo;
      console.debug = originalDebug;
    };
  }
}
