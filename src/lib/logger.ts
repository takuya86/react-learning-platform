/**
 * Unified Logger Module
 *
 * Centralized logging with category and context support.
 * - Development: console output
 * - Production: ready for external service integration (e.g., Sentry, LogRocket)
 *
 * Usage:
 * ```typescript
 * import { logger } from '@/lib/logger';
 *
 * logger.error('Failed to save data', {
 *   category: 'storage',
 *   context: { key: 'quiz_session', error: err }
 * });
 * ```
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogCategory =
  | 'storage'
  | 'network'
  | 'metrics'
  | 'auth'
  | 'quiz'
  | 'notes'
  | 'github'
  | 'general';

export interface LogContext {
  category?: LogCategory;
  context?: Record<string, unknown>;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  category: LogCategory;
  context?: Record<string, unknown>;
  timestamp: string;
}

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  /**
   * Log debug information (development only)
   */
  debug(message: string, options?: LogContext): void {
    if (this.isDevelopment) {
      this.log('debug', message, options);
    }
  }

  /**
   * Log general information
   */
  info(message: string, options?: LogContext): void {
    this.log('info', message, options);
  }

  /**
   * Log warning (non-critical issues)
   */
  warn(message: string, options?: LogContext): void {
    this.log('warn', message, options);
  }

  /**
   * Log error (critical issues)
   */
  error(message: string, options?: LogContext): void {
    this.log('error', message, options);
  }

  /**
   * Internal logging implementation
   */
  private log(level: LogLevel, message: string, options?: LogContext): void {
    const entry: LogEntry = {
      level,
      message,
      category: options?.category || 'general',
      context: options?.context,
      timestamp: new Date().toISOString(),
    };

    // Development: console output with formatting
    if (this.isDevelopment) {
      this.logToConsole(entry);
    }

    // Production: ready for external service integration
    if (!this.isDevelopment && (level === 'warn' || level === 'error')) {
      this.logToExternalService(entry);
    }
  }

  /**
   * Output to console (development)
   */
  private logToConsole(entry: LogEntry): void {
    const prefix = `[${entry.category}]`;
    const args: [string, string, ...unknown[]] = [prefix, entry.message];

    if (entry.context) {
      args.push(entry.context);
    }

    switch (entry.level) {
      case 'debug':
        console.debug(...args);
        break;
      case 'info':
        console.info(...args);
        break;
      case 'warn':
        console.warn(...args);
        break;
      case 'error':
        console.error(...args);
        break;
    }
  }

  /**
   * Send to external logging service (production)
   * TODO: Integrate with Sentry, LogRocket, or other services
   */
  private logToExternalService(entry: LogEntry): void {
    // Example integration points:
    //
    // Sentry:
    // if (window.Sentry) {
    //   window.Sentry.captureMessage(entry.message, {
    //     level: entry.level === 'warn' ? 'warning' : 'error',
    //     tags: { category: entry.category },
    //     extra: entry.context,
    //   });
    // }
    //
    // LogRocket:
    // if (window.LogRocket) {
    //   window.LogRocket.captureMessage(entry.message, {
    //     tags: { level: entry.level, category: entry.category },
    //     extra: entry.context,
    //   });
    // }
    //
    // Custom endpoint:
    // fetch('/api/logs', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(entry),
    // }).catch(() => {
    //   // Silently fail - don't throw in logging
    // });

    // For now, log to console in production as fallback
    console.error('[Logger] External service not configured:', entry);
  }
}

// Singleton instance
export const logger = new Logger();
