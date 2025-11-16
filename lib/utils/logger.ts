/**
 * Centralized logging utility for Firebase and network requests
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export interface LogContext {
  service: 'firestore' | 'storage' | 'auth' | 'network';
  operation: string;
  userId?: string;
  collection?: string;
  documentId?: string;
  path?: string;
  [key: string]: any;
}

class Logger {
  private enabled: boolean = __DEV__; // Only log in development by default

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` [${JSON.stringify(context)}]` : '';
    return `[${timestamp}] [${level}] ${message}${contextStr}`;
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error) {
    if (!this.enabled) return;

    const formattedMessage = this.formatMessage(level, message, context);
    
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
      case LogLevel.INFO:
        console.log(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage, error || '');
        break;
    }
  }

  debug(message: string, context?: LogContext) {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext) {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: LogContext, error?: Error) {
    this.log(LogLevel.ERROR, message, context, error);
  }

  // Helper methods for Firebase operations
  logFirestoreRequest(
    operation: string,
    userId: string,
    collection: string,
    documentId?: string,
    metadata?: Record<string, any>
  ) {
    this.info(`Firestore ${operation}`, {
      service: 'firestore',
      operation,
      userId,
      collection,
      documentId,
      ...metadata,
    });
  }

  logFirestoreResponse(
    operation: string,
    userId: string,
    collection: string,
    duration: number,
    documentId?: string,
    resultCount?: number,
    metadata?: Record<string, any>
  ) {
    this.info(`Firestore ${operation} completed`, {
      service: 'firestore',
      operation,
      userId,
      collection,
      documentId,
      duration: `${duration}ms`,
      resultCount,
      ...metadata,
    });
  }

  logFirestoreError(
    operation: string,
    userId: string,
    collection: string,
    error: Error,
    documentId?: string,
    metadata?: Record<string, any>
  ) {
    this.error(`Firestore ${operation} failed`, {
      service: 'firestore',
      operation,
      userId,
      collection,
      documentId,
      errorCode: (error as any).code,
      errorMessage: error.message,
      ...metadata,
    }, error);
  }

  logStorageRequest(
    operation: string,
    userId: string,
    path: string,
    metadata?: Record<string, any>
  ) {
    this.info(`Storage ${operation}`, {
      service: 'storage',
      operation,
      userId,
      path,
      ...metadata,
    });
  }

  logStorageResponse(
    operation: string,
    userId: string,
    path: string,
    duration: number,
    metadata?: Record<string, any>
  ) {
    this.info(`Storage ${operation} completed`, {
      service: 'storage',
      operation,
      userId,
      path,
      duration: `${duration}ms`,
      ...metadata,
    });
  }

  logStorageError(
    operation: string,
    userId: string,
    path: string,
    error: Error,
    metadata?: Record<string, any>
  ) {
    this.error(`Storage ${operation} failed`, {
      service: 'storage',
      operation,
      userId,
      path,
      errorCode: (error as any).code,
      errorMessage: error.message,
      ...metadata,
    }, error);
  }

  logAuthRequest(operation: string, metadata?: Record<string, any>) {
    this.info(`Auth ${operation}`, {
      service: 'auth',
      operation,
      ...metadata,
    });
  }

  logAuthResponse(operation: string, duration: number, userId?: string, metadata?: Record<string, any>) {
    this.info(`Auth ${operation} completed`, {
      service: 'auth',
      operation,
      userId,
      duration: `${duration}ms`,
      ...metadata,
    });
  }

  logAuthError(operation: string, error: Error, metadata?: Record<string, any>) {
    this.error(`Auth ${operation} failed`, {
      service: 'auth',
      operation,
      errorCode: (error as any).code,
      errorMessage: error.message,
      ...metadata,
    }, error);
  }
}

export const logger = new Logger();

