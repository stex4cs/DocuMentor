import Ajv from 'ajv';
import { ApiEndpoint } from '../utils/types';
import { logger } from '../utils/logger';

/**
 * Result of a schema validation
 */
export interface SchemaValidationResult {
  endpoint: ApiEndpoint;
  valid: boolean;
  errors?: any[];
}

/**
 * Validates response schema against the API endpoint definition.
 * @param endpoint API endpoint
 * @param statusCode HTTP status code
 * @param responseBody Response body to validate
 * @returns Validation result
 */
export function validateResponseSchema(
  endpoint: ApiEndpoint,
  statusCode: number,
  responseBody: any
): SchemaValidationResult {
  logger.info(`Validating schema for ${endpoint.method} ${endpoint.path} with status ${statusCode}`);
  
  // Find the response definition for this status code
  const responseDefinition = endpoint.responses.find(r => r.statusCode === statusCode);
  
  if (!responseDefinition || !responseDefinition.schema) {
    logger.warn(`No schema defined for status ${statusCode}`);
    return {
      endpoint,
      valid: true
    };
  }
  
  try {
    const ajv = new Ajv({ allErrors: true });
    const validate = ajv.compile(responseDefinition.schema);
    const valid = validate(responseBody);
    
    if (!valid) {
      logger.error(`Schema validation failed: ${JSON.stringify(validate.errors)}`);
      return {
        endpoint,
        valid: false,
        errors: validate.errors || [{ message: 'Unknown validation error' }]
      };
    }
    
    logger.info('Schema validation passed');
    return {
      endpoint,
      valid: true
    };
  } catch (error) {
    logger.error('Error validating schema:', error);
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
export function validateRequestParams(
  endpoint: ApiEndpoint,
  params: Record<string, any>
): SchemaValidationResult {
  logger.info(`Validating request parameters for ${endpoint.method} ${endpoint.path}`);
  
  const missingParams: string[] = [];
  
  // Check required parameters
  endpoint.parameters
    .filter(p => p.required)
    .forEach(param => {
      if (params[param.name] === undefined) {
        missingParams.push(param.name);
      }
    });
  
  if (missingParams.length > 0) {
    logger.error(`Missing required parameters: ${missingParams.join(', ')}`);
    return {
      endpoint,
      valid: false,
      errors: missingParams.map(name => ({
        message: `Missing required parameter: ${name}`
      }))
    };
  }
  
  // Validate parameter types
  const typeErrors: any[] = [];
  
  endpoint.parameters.forEach(param => {
    if (params[param.name] !== undefined) {
      const value = params[param.name];
      
      if (param.type === 'number' || param.type === 'integer') {
        if (typeof value !== 'number') {
          typeErrors.push({
            message: `Parameter ${param.name} should be a number, got ${typeof value}`
          });
        }
      } else if (param.type === 'boolean') {
        if (typeof value !== 'boolean') {
          typeErrors.push({
            message: `Parameter ${param.name} should be a boolean, got ${typeof value}`
          });
        }
      } else if (param.type === 'string') {
        if (typeof value !== 'string') {
          typeErrors.push({
            message: `Parameter ${param.name} should be a string, got ${typeof value}`
          });
        }
      } else if (param.type === 'array') {
        if (!Array.isArray(value)) {
          typeErrors.push({
            message: `Parameter ${param.name} should be an array, got ${typeof value}`
          });
        }
      } else if (param.type === 'object') {
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          typeErrors.push({
            message: `Parameter ${param.name} should be an object, got ${typeof value}`
          });
        }
      }
    }
  });
  
  if (typeErrors.length > 0) {
    logger.error(`Parameter type validation errors: ${JSON.stringify(typeErrors)}`);
    return {
      endpoint,
      valid: false,
      errors: typeErrors
    };
  }
  
  logger.info('Parameter validation passed');
  return {
    endpoint,
    valid: true
  };
}