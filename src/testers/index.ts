import { testEndpoint, EndpointTestResult, TestConfig } from './endpoint';
import { validateResponseSchema, validateRequestParams, SchemaValidationResult } from './schema';
import { ApiEndpoint } from '../utils/types';
import { logger } from '../utils/logger';

/**
 * Tests all API endpoints.
 * @param endpoints Array of API endpoints
 * @param config Test configuration
 * @returns Array of test results
 */
export async function testApiEndpoints(
  endpoints: ApiEndpoint[],
  config: TestConfig
): Promise<EndpointTestResult[]> {
  logger.info(`Testing ${endpoints.length} API endpoints...`);
  
  const results: EndpointTestResult[] = [];
  
  for (const endpoint of endpoints) {
    try {
      const result = await testEndpoint(endpoint, config);
      results.push(result);
      
      // Validate schema if enabled and test was successful
      if (config.validateSchema && result.success && result.responseBody) {
        const schemaResult = validateResponseSchema(
          endpoint, 
          result.statusCode!, 
          result.responseBody
        );
        
        if (!schemaResult.valid) {
          result.success = false;
          result.error = `Schema validation failed: ${JSON.stringify(schemaResult.errors)}`;
        }
      }
    } catch (error) {
      logger.error(`Error testing endpoint ${endpoint.method} ${endpoint.path}:`, error);
      
      results.push({
        endpoint,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  // Log summary
  const successCount = results.filter(r => r.success).length;
  logger.info(`Testing complete. ${successCount}/${results.length} tests passed.`);
  
  return results;
}

export { testEndpoint, EndpointTestResult, TestConfig, validateResponseSchema, validateRequestParams, SchemaValidationResult };