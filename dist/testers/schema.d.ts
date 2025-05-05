import { ApiEndpoint } from '../utils/types';
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
export declare function validateResponseSchema(endpoint: ApiEndpoint, statusCode: number, responseBody: any): SchemaValidationResult;
/**
 * Validates request parameters against the API endpoint definition.
 * @param endpoint API endpoint
 * @param params Parameters to validate
 * @returns Validation result
 */
export declare function validateRequestParams(endpoint: ApiEndpoint, params: Record<string, any>): SchemaValidationResult;
