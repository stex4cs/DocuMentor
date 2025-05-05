"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequestParams = exports.validateResponseSchema = exports.testEndpoint = void 0;
exports.testApiEndpoints = testApiEndpoints;
const endpoint_1 = require("./endpoint");
Object.defineProperty(exports, "testEndpoint", { enumerable: true, get: function () { return endpoint_1.testEndpoint; } });
const schema_1 = require("./schema");
Object.defineProperty(exports, "validateResponseSchema", { enumerable: true, get: function () { return schema_1.validateResponseSchema; } });
Object.defineProperty(exports, "validateRequestParams", { enumerable: true, get: function () { return schema_1.validateRequestParams; } });
const logger_1 = require("../utils/logger");
/**
 * Tests all API endpoints.
 * @param endpoints Array of API endpoints
 * @param config Test configuration
 * @returns Array of test results
 */
async function testApiEndpoints(endpoints, config) {
    logger_1.logger.info(`Testing ${endpoints.length} API endpoints...`);
    const results = [];
    for (const endpoint of endpoints) {
        try {
            const result = await (0, endpoint_1.testEndpoint)(endpoint, config);
            results.push(result);
            // Validate schema if enabled and test was successful
            if (config.validateSchema && result.success && result.responseBody) {
                const schemaResult = (0, schema_1.validateResponseSchema)(endpoint, result.statusCode, result.responseBody);
                if (!schemaResult.valid) {
                    result.success = false;
                    result.error = `Schema validation failed: ${JSON.stringify(schemaResult.errors)}`;
                }
            }
        }
        catch (error) {
            logger_1.logger.error(`Error testing endpoint ${endpoint.method} ${endpoint.path}:`, error);
            results.push({
                endpoint,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    // Log summary
    const successCount = results.filter(r => r.success).length;
    logger_1.logger.info(`Testing complete. ${successCount}/${results.length} tests passed.`);
    return results;
}
