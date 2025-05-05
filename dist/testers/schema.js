"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateResponseSchema = validateResponseSchema;
exports.validateRequestParams = validateRequestParams;
const ajv_1 = __importDefault(require("ajv"));
const logger_1 = require("../utils/logger");
/**
 * Validates response schema against the API endpoint definition.
 * @param endpoint API endpoint
 * @param statusCode HTTP status code
 * @param responseBody Response body to validate
 * @returns Validation result
 */
function validateResponseSchema(endpoint, statusCode, responseBody) {
    logger_1.logger.info(`Validating schema for ${endpoint.method} ${endpoint.path} with status ${statusCode}`);
    // Find the response definition for this status code
    const responseDefinition = endpoint.responses.find(r => r.statusCode === statusCode);
    if (!responseDefinition || !responseDefinition.schema) {
        logger_1.logger.warn(`No schema defined for status ${statusCode}`);
        return {
            endpoint,
            valid: true
        };
    }
    try {
        const ajv = new ajv_1.default({ allErrors: true });
        const validate = ajv.compile(responseDefinition.schema);
        const valid = validate(responseBody);
        if (!valid) {
            logger_1.logger.error(`Schema validation failed: ${JSON.stringify(validate.errors)}`);
            return {
                endpoint,
                valid: false,
                errors: validate.errors || [{ message: 'Unknown validation error' }]
            };
        }
        logger_1.logger.info('Schema validation passed');
        return {
            endpoint,
            valid: true
        };
    }
    catch (error) {
        logger_1.logger.error('Error validating schema:', error);
        return {
            endpoint,
            valid: false,
            errors: [{ message: error instanceof Error ? error.message : 'Unknown error' }]
        };
    }
}
/**
 * Validates request parameters against the API endpoint definition.
 * @param endpoint API endpoint
 * @param params Parameters to validate
 * @returns Validation result
 */
function validateRequestParams(endpoint, params) {
    logger_1.logger.info(`Validating request parameters for ${endpoint.method} ${endpoint.path}`);
    const missingParams = [];
    // Check required parameters
    endpoint.parameters
        .filter(p => p.required)
        .forEach(param => {
        if (params[param.name] === undefined) {
            missingParams.push(param.name);
        }
    });
    if (missingParams.length > 0) {
        logger_1.logger.error(`Missing required parameters: ${missingParams.join(', ')}`);
        return {
            endpoint,
            valid: false,
            errors: missingParams.map(name => ({
                message: `Missing required parameter: ${name}`
            }))
        };
    }
    // Validate parameter types
    const typeErrors = [];
    endpoint.parameters.forEach(param => {
        if (params[param.name] !== undefined) {
            const value = params[param.name];
            if (param.type === 'number' || param.type === 'integer') {
                if (typeof value !== 'number') {
                    typeErrors.push({
                        message: `Parameter ${param.name} should be a number, got ${typeof value}`
                    });
                }
            }
            else if (param.type === 'boolean') {
                if (typeof value !== 'boolean') {
                    typeErrors.push({
                        message: `Parameter ${param.name} should be a boolean, got ${typeof value}`
                    });
                }
            }
            else if (param.type === 'string') {
                if (typeof value !== 'string') {
                    typeErrors.push({
                        message: `Parameter ${param.name} should be a string, got ${typeof value}`
                    });
                }
            }
            else if (param.type === 'array') {
                if (!Array.isArray(value)) {
                    typeErrors.push({
                        message: `Parameter ${param.name} should be an array, got ${typeof value}`
                    });
                }
            }
            else if (param.type === 'object') {
                if (typeof value !== 'object' || value === null || Array.isArray(value)) {
                    typeErrors.push({
                        message: `Parameter ${param.name} should be an object, got ${typeof value}`
                    });
                }
            }
        }
    });
    if (typeErrors.length > 0) {
        logger_1.logger.error(`Parameter type validation errors: ${JSON.stringify(typeErrors)}`);
        return {
            endpoint,
            valid: false,
            errors: typeErrors
        };
    }
    logger_1.logger.info('Parameter validation passed');
    return {
        endpoint,
        valid: true
    };
}
