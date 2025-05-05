"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeFastifyApp = analyzeFastifyApp;
const types_1 = require("../utils/types");
const parser_1 = require("../utils/parser");
const logger_1 = require("../utils/logger");
/**
 * Analyzes a Fastify application to extract API endpoint information.
 * @param app Fastify application instance
 * @returns Array of detected API endpoints
 */
function analyzeFastifyApp(app) {
    logger_1.logger.info('Analyzing Fastify application...');
    const endpoints = [];
    try {
        // Get routes from Fastify
        const routes = app.routes || [];
        // Process each route
        for (const route of routes) {
            const path = route.url || route.path;
            const method = (route.method || 'GET').toUpperCase();
            logger_1.logger.debug(`Found endpoint: ${method} ${path}`);
            // Extract route parameters
            const params = (0, parser_1.parseRouteParams)(path);
            // Extract schema information if available
            const parameters = params.map(p => ({
                name: p,
                type: 'string',
                required: true,
                in: 'path',
                description: `URL parameter: ${p}`
            }));
            // Add query parameters if defined in schema
            if (route.schema?.querystring) {
                const querySchema = route.schema.querystring;
                const properties = querySchema.properties || {};
                const required = querySchema.required || [];
                Object.keys(properties).forEach(propName => {
                    parameters.push({
                        name: propName,
                        type: properties[propName].type || 'string',
                        required: required.includes(propName),
                        in: 'query',
                        description: properties[propName].description || `Query parameter: ${propName}`
                    });
                });
            }
            // Add body parameters if defined in schema
            if (route.schema?.body) {
                const bodySchema = route.schema.body;
                parameters.push({
                    name: 'body',
                    type: 'object',
                    required: true,
                    in: 'body',
                    description: 'Request body',
                    schema: bodySchema
                });
            }
            // Create endpoint definition
            const endpoint = {
                path,
                method,
                parameters,
                responses: [
                    {
                        statusCode: 200,
                        description: 'Successful response',
                        format: types_1.ResponseFormat.JSON,
                        schema: route.schema?.response?.[200] || null
                    },
                    {
                        statusCode: 400,
                        description: 'Bad request',
                        format: types_1.ResponseFormat.JSON,
                        schema: route.schema?.response?.[400] || null
                    }
                ],
                description: route.schema?.description || '',
                summary: route.schema?.summary || '',
                tags: route.schema?.tags || [],
                deprecated: route.schema?.deprecated || false
            };
            endpoints.push(endpoint);
        }
    }
    catch (error) {
        logger_1.logger.error('Error analyzing Fastify app:', error);
    }
    logger_1.logger.info(`Analysis complete. Found ${endpoints.length} endpoints.`);
    return endpoints;
}
