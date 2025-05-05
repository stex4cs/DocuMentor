"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeNestApp = analyzeNestApp;
const types_1 = require("../utils/types");
const parser_1 = require("../utils/parser");
const logger_1 = require("../utils/logger");
require("reflect-metadata");
/**
 * Analyzes a NestJS application to extract API endpoint information.
 * Note: This requires the app to be using the Nest Swagger module
 * to extract complete information.
 *
 * @param app NestJS application instance
 * @returns Array of detected API endpoints
 */
function analyzeNestApp(app) {
    logger_1.logger.info('Analyzing NestJS application...');
    const endpoints = [];
    try {
        // Access the internal router in NestJS
        const container = app.container || app.applicationConfig?.container;
        if (!container) {
            logger_1.logger.warn('Could not access NestJS container');
            return [];
        }
        // Get all controllers
        const controllers = container.getControllers();
        // Process each controller
        for (const controller of controllers) {
            const controllerInstance = container.getInstanceByToken(controller);
            if (!controllerInstance)
                continue;
            // Get controller metadata
            const controllerPath = Reflect.getMetadata('path', controller) || '';
            const controllerTags = Reflect.getMetadata('swagger/tags', controller) || [];
            // Get all route handlers in this controller
            const prototype = Object.getPrototypeOf(controllerInstance);
            const methodNames = Object.getOwnPropertyNames(prototype)
                .filter(prop => typeof prototype[prop] === 'function' &&
                prop !== 'constructor');
            // Process each route handler
            for (const methodName of methodNames) {
                const handler = prototype[methodName];
                // Get route metadata
                const routePath = Reflect.getMetadata('path', handler) || '';
                const methods = Reflect.getMetadata('method', handler) || ['GET'];
                if (!routePath)
                    continue;
                const fullPath = normalizePath(`/${controllerPath}/${routePath}`);
                // Extract route parameters
                const params = (0, parser_1.parseRouteParams)(fullPath);
                // Get additional metadata from NestJS swagger decorators
                const apiOperation = Reflect.getMetadata('swagger/apiOperation', handler) || {};
                const apiResponses = Reflect.getMetadata('swagger/apiResponses', handler) || {};
                const apiParams = Reflect.getMetadata('swagger/apiParameters', handler) || [];
                for (const method of methods) {
                    logger_1.logger.debug(`Found endpoint: ${method} ${fullPath}`);
                    // Create endpoint definition
                    const endpoint = {
                        path: fullPath,
                        method: method.toUpperCase(),
                        parameters: [
                            ...params.map(p => ({
                                name: p,
                                type: 'string',
                                required: true,
                                in: 'path',
                                description: `URL parameter: ${p}`
                            })),
                            ...apiParams
                        ],
                        responses: Object.keys(apiResponses).map(statusCode => ({
                            statusCode: parseInt(statusCode, 10),
                            description: apiResponses[statusCode].description || '',
                            format: types_1.ResponseFormat.JSON,
                            schema: apiResponses[statusCode].type || null
                        })),
                        description: apiOperation.description || '',
                        summary: apiOperation.summary || '',
                        tags: [...controllerTags, ...(apiOperation.tags || [])],
                        deprecated: apiOperation.deprecated || false
                    };
                    // Add default responses if none defined
                    if (endpoint.responses.length === 0) {
                        endpoint.responses = [
                            {
                                statusCode: 200,
                                description: 'Successful response',
                                format: types_1.ResponseFormat.JSON
                            },
                            {
                                statusCode: 400,
                                description: 'Bad request',
                                format: types_1.ResponseFormat.JSON
                            }
                        ];
                    }
                    endpoints.push(endpoint);
                }
            }
        }
    }
    catch (error) {
        logger_1.logger.error('Error analyzing NestJS app:', error);
    }
    logger_1.logger.info(`Analysis complete. Found ${endpoints.length} endpoints.`);
    return endpoints;
}
/**
 * Normalizes a path by removing duplicate slashes.
 * @param path Path to normalize
 * @returns Normalized path
 */
function normalizePath(path) {
    return path.replace(/\/+/g, '/').replace(/\/$/, '');
}
