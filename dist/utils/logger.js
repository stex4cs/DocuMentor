"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.LogLevel = void 0;
/**
 * Log levels
 */
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 3] = "DEBUG";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
/**
 * Console logger implementation
 */
class ConsoleLogger {
    constructor() {
        this.level = LogLevel.INFO;
    }
    /**
     * Sets the log level.
     * @param level Log level
     */
    setLevel(level) {
        this.level = level;
    }
    /**
     * Logs an error message.
     * @param message Message to log
     * @param args Additional arguments
     */
    error(message, ...args) {
        if (this.level >= LogLevel.ERROR) {
            console.error(`[ERROR] ${message}`, ...args);
        }
    }
    /**
     * Logs a warning message.
     * @param message Message to log
     * @param args Additional arguments
     */
    warn(message, ...args) {
        if (this.level >= LogLevel.WARN) {
            console.warn(`[WARN] ${message}`, ...args);
        }
    }
    /**
     * Logs an info message.
     * @param message Message to log
     * @param args Additional arguments
     */
    info(message, ...args) {
        if (this.level >= LogLevel.INFO) {
            console.info(`[INFO] ${message}`, ...args);
        }
    }
    /**
     * Logs a debug message.
     * @param message Message to log
     * @param args Additional arguments
     */
    debug(message, ...args) {
        if (this.level >= LogLevel.DEBUG) {
            console.debug(`[DEBUG] ${message}`, ...args);
        }
    }
}
/**
 * Logger instance
 */
exports.logger = new ConsoleLogger();
