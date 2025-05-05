"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testEndpoint = testEndpoint;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
/**
 * Tests an API endpoint.
 * @param endpoint API endpoint to test
 * @param config Test configuration
 * @returns Test result
 */
async function testEndpoint(endpoint, config) {
    logger_1.logger.info(`Testing endpoint: ${endpoint.method} ${endpoint.path}`);
    try {
        const url = buildUrl(endpoint, config);
        const headers = buildHeaders(endpoint, config);
        const data = buildRequestBody(endpoint, config);
        const axiosConfig = {
            method: endpoint.method.toLowerCase(),
            url,
            headers,
            timeout: config.timeout || 5000,
            validateStatus: () => true // Don't throw on any status code
        };
        if (data && ['post', 'put', 'patch'].includes(endpoint.method.toLowerCase())) {
            axiosConfig.data = data;
        }
        logger_1.logger.debug(`Request config: ${JSON.stringify(axiosConfig)}`);
        const startTime = Date.now();
        const response = await (0, axios_1.default)(axiosConfig);
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        const expectedSuccessStatus = endpoint.responses
            .filter(r => r.statusCode >= 200 && r.statusCode < 300)
            .map(r => r.statusCode);
        // If no specific success status codes are defined, use 200 as default
        const successStatusCodes = expectedSuccessStatus.length > 0
            ? expectedSuccessStatus
            : [200];
        const success = successStatusCodes.includes(response.status);
        const result = {
            endpoint,
            success,
            statusCode: response.status,
            responseTime,
            responseBody: response.data
        };
        if (!success) {
            result.error = `Expected status ${successStatusCodes.join(' or ')}, got ${response.status}`;
        }
        logger_1.logger.info(`Test ${success ? 'passed' : 'failed'} for ${endpoint.method} ${endpoint.path}`);
        logger_1.logger.debug(`Response status: ${response.status}, time: ${responseTime}ms`);
        return result;
    }
    catch (error) {
        logger_1.logger.error(`Error testing endpoint ${endpoint.method} ${endpoint.path}:`, error);
        return {
            endpoint,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
/**
 * Builds the full URL for the API request.
 * @param endpoint API endpoint
 * @param config Test configuration
 * @returns Complete URL with path parameters substituted
 */
function buildUrl(endpoint, config) {
    let path = endpoint.path;
    // Replace path parameters
    const pathParams = endpoint.parameters.filter(p => p.in === 'path');
    for (const param of pathParams) {
        const value = getParameterValue(param, config);
        path = path.replace(`:${param.name}`, encodeURIComponent(String(value)));
    }
    // Add query parameters
    const queryParams = endpoint.parameters.filter(p => p.in === 'query');
    if (queryParams.length > 0) {
        const queryString = queryParams
            .map(param => {
            const value = getParameterValue(param, config);
            return `${param.name}=${encodeURIComponent(String(value))}`;
        })
            .join('&');
        path += path.includes('?') ? `&${queryString}` : `?${queryString}`;
    }
    // Join base URL and path
    let baseUrl = config.baseUrl;
    if (baseUrl.endsWith('/') && path.startsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
    }
    return `${baseUrl}${path}`;
}
/**
 * Builds headers for the API request.
 * @param endpoint API endpoint
 * @param config Test configuration
 * @returns Headers object
 */
function buildHeaders(endpoint, config) {
    const headers = {
        'Content-Type': 'application/json',
        ...config.headers
    };
    // Add header parameters from endpoint
    const headerParams = endpoint.parameters.filter(p => p.in === 'header');
    for (const param of headerParams) {
        const value = getParameterValue(param, config);
        headers[param.name] = String(value);
    }
    return headers;
}
/**
 * Builds the request body for the API request.
 * @param endpoint API endpoint
 * @param config Test configuration
 * @returns Request body object
 */
function buildRequestBody(endpoint, config) {
    const bodyParams = endpoint.parameters.filter(p => p.in === 'body');
    if (bodyParams.length === 0) {
        return null;
    }
    // If there's a schema, use it as a template for the body
    if (bodyParams[0].schema) {
        return generateDataFromSchema(bodyParams[0].schema, config.paramValues);
    }
    // Otherwise, build a simple object with parameter values
    const body = {};
    for (const param of bodyParams) {
        const value = getParameterValue(param, config);
        body[param.name] = value;
    }
    return body;
}
/**
 * Gets the value for a parameter, either from config or generates a test value.
 * @param param Parameter
 * @param config Test configuration
 * @returns Parameter value
 */
function getParameterValue(param, config) {
    // Check if a value is provided in the config
    if (config.paramValues && config.paramValues[param.name] !== undefined) {
        return config.paramValues[param.name];
    }
    // Generate a test value based on the parameter type
    switch (param.type) {
        case 'string':
            return param.example || `test-${param.name}`;
        case 'number':
        case 'integer':
            return param.example || 123;
        case 'boolean':
            return param.example || true;
        case 'array':
            return param.example || [];
        case 'object':
            return param.example || {};
        default:
            return param.example || `test-${param.name}`;
    }
}
/**
 * Generates test data from a schema definition.
 * @param schema Schema object
 * @param paramValues Optional parameter values
 * @returns Generated data
 */
function generateDataFromSchema(schema, paramValues) {
    if (!schema)
        return null;
    // Handle primitive types
    if (typeof schema.type === 'string') {
        switch (schema.type) {
            case 'string':
                return schema.example || schema.default || 'test-string';
            case 'number':
            case 'integer':
                return schema.example || schema.default || 123;
            case 'boolean':
                return schema.example || schema.default || true;
            case 'array':
                if (schema.items) {
                    return [generateDataFromSchema(schema.items, paramValues)];
                }
                return [];
            case 'object':
                return generateObjectFromSchema(schema, paramValues);
            default:
                return null;
        }
    }
    // Handle $ref
    if (schema.$ref) {
        // This would need access to the full Swagger document to resolve references
        // For now, just return a placeholder
        return {};
    }
    // Default to an empty object
    return {};
}
/**
 * Generates an object from a schema definition.
 * @param schema Schema object
 * @param paramValues Optional parameter values
 * @returns Generated object
 */
function generateObjectFromSchema(schema, paramValues) {
    const result = {};
    if (!schema.properties) {
        return result;
    }
    for (const [propName, propSchema] of Object.entries(schema.properties)) {
        // Use provided value if available
        if (paramValues && paramValues[propName] !== undefined) {
            result[propName] = paramValues[propName];
            continue;
        }
        // Otherwise generate a value based on the property schema
        result[propName] = generateDataFromSchema(propSchema, paramValues);
    }
    return result;
}
