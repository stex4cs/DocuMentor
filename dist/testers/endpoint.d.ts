import { ApiEndpoint } from '../utils/types';
/**
 * Result of an endpoint test
 */
export interface EndpointTestResult {
    endpoint: ApiEndpoint;
    success: boolean;
    statusCode?: number;
    responseTime?: number;
    error?: string;
    responseBody?: any;
}
/**
 * Test configuration options
 */
export interface TestConfig {
    baseUrl: string;
    headers?: Record<string, string>;
    timeout?: number;
    validateSchema?: boolean;
    paramValues?: Record<string, any>;
}
/**
 * Tests an API endpoint.
 * @param endpoint API endpoint to test
 * @param config Test configuration
 * @returns Test result
 */
export declare function testEndpoint(endpoint: ApiEndpoint, config: TestConfig): Promise<EndpointTestResult>;
