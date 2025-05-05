"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FrameworkType = void 0;
exports.analyzeApp = analyzeApp;
const express_1 = require("./express");
const fastify_1 = require("./fastify");
const nest_1 = require("./nest");
const logger_1 = require("../utils/logger");
/**
 * Framework types supported by the analyzer
 */
var FrameworkType;
(function (FrameworkType) {
    FrameworkType["EXPRESS"] = "express";
    FrameworkType["FASTIFY"] = "fastify";
    FrameworkType["NEST"] = "nestjs";
    FrameworkType["AUTO"] = "auto";
})(FrameworkType || (exports.FrameworkType = FrameworkType = {}));
/**
 * Analyzes an API application based on the specified framework type.
 * If framework type is AUTO, it will attempt to detect the framework.
 *
 * @param app Application instance
 * @param frameworkType Type of framework the application uses
 * @returns Array of detected API endpoints
 */
function analyzeApp(app, frameworkType = FrameworkType.AUTO) {
    if (frameworkType === FrameworkType.AUTO) {
        frameworkType = detectFrameworkType(app);
        logger_1.logger.info(`Detected framework: ${frameworkType}`);
    }
    switch (frameworkType) {
        case FrameworkType.EXPRESS:
            return (0, express_1.analyzeExpressApp)(app);
        case FrameworkType.FASTIFY:
            return (0, fastify_1.analyzeFastifyApp)(app);
        case FrameworkType.NEST:
            return (0, nest_1.analyzeNestApp)(app);
        default:
            logger_1.logger.error(`Unsupported framework type: ${frameworkType}`);
            return [];
    }
}
/**
 * Attempts to detect the framework type based on application properties.
 * @param app Application instance
 * @returns Detected framework type
 */
function detectFrameworkType(app) {
    if (app._router && app._router.stack) {
        return FrameworkType.EXPRESS;
    }
    if (app.routes && typeof app.register === 'function') {
        return FrameworkType.FASTIFY;
    }
    if (app.container || app.applicationConfig?.container) {
        return FrameworkType.NEST;
    }
    // Default to Express if cannot determine
    logger_1.logger.warn('Could not detect framework type, defaulting to Express');
    return FrameworkType.EXPRESS;
}
