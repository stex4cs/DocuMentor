import { testEndpoint, EndpointTestResult, TestConfig } from './endpoint';
import { validateResponseSchema, validateRequestParams, SchemaValidationResult } from './schema';
import { ApiEndpoint } from '../utils/types';
/**
 * Tests all API endpoints.
 * @param endpoints Array of API endpoints
 * @param config Test configuration
 * @returns Array of test results
 */
export declare function testApiEndpoints(endpoints: ApiEndpoint[], config: TestConfig): Promise<EndpointTestResult[]>;
export { testEndpoint, EndpointTestResult, TestConfig, validateResponseSchema, validateRequestParams, SchemaValidationResult };
