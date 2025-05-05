/**
 * Log levels
 */
export declare enum LogLevel {
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
 * Logger instance
 */
export declare const logger: Logger;
export {};
