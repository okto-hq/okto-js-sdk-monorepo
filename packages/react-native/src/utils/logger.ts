// utils/logger.ts
interface Logger {
  log: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
}

/**
 * Creates a logger that respects environment settings
 * In production, logs are suppressed unless it's an error
 */
const createLogger = (isDevelopment: boolean = __DEV__): Logger => {
  if (isDevelopment) {
    return {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
    };
  }

  // In production, only show errors
  return {
    log: () => {},
    error: console.error,
    warn: () => {},
    info: () => {},
  };
};

// Default logger instance
export const logger = createLogger(false);

//Separate instances for development and production environments
export const devLogger = createLogger(true);
export const prodLogger = createLogger(false);
