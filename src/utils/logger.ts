/**
 * Log levels
 */
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

/**
 * Logger interface
 */
interface Logger {
  setLevel(level: LogLevel): void;
  error(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  debug(message: string, ...args: any[]): void;
}

/**
 * Console logger implementation
 */
class ConsoleLogger implements Logger {
  private level: LogLevel = LogLevel.INFO;
  
  /**
   * Sets the log level.
   * @param level Log level
   */
  public setLevel(level: LogLevel): void {
    this.level = level;
  }
  
  /**
   * Logs an error message.
   * @param message Message to log
   * @param args Additional arguments
   */
  public error(message: string, ...args: any[]): void {
    if (this.level >= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }
  
  /**
   * Logs a warning message.
   * @param message Message to log
   * @param args Additional arguments
   */
  public warn(message: string, ...args: any[]): void {
    if (this.level >= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }
  
  /**
   * Logs an info message.
   * @param message Message to log
   * @param args Additional arguments
   */
  public info(message: string, ...args: any[]): void {
    if (this.level >= LogLevel.INFO) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }
  
  /**
   * Logs a debug message.
   * @param message Message to log
   * @param args Additional arguments
   */
  public debug(message: string, ...args: any[]): void {
    if (this.level >= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }
}

/**
 * Logger instance
 */
export const logger: Logger = new ConsoleLogger();