import { ApiEndpoint, HttpMethod, Parameter, ResponseFormat } from '../utils/types';
import { parseRouteParams } from '../utils/parser';
import { logger } from '../utils/logger';

/**
 * Analyzes a Fastify application to extract API endpoint information.
 * @param app Fastify application instance
 * @returns Array of detected API endpoints
 */
export function analyzeFastifyApp(app: any): ApiEndpoint[] {
  logger.info('Analyzing Fastify application...');
  
  const endpoints: ApiEndpoint[] = [];
  
  try {
    // Get routes from Fastify
    const routes = app.routes || [];
    
    // Process each route
    for (const route of routes) {
      const path = route.url || route.path;
      const method = (route.method || 'GET').toUpperCase() as HttpMethod;
      
      logger.debug(`Found endpoint: ${method} ${path}`);
      
      // Extract route parameters
      const params = parseRouteParams(path);
      
      // Extract schema information if available
      const parameters: Parameter[] = params.map(p => ({
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
      const endpoint: ApiEndpoint = {
        path,
        method,
        parameters,
        responses: [
          {
            statusCode: 200,
            description: 'Successful response',
            format: ResponseFormat.JSON,
            schema: route.schema?.response?.[200] || null
          },
          {
            statusCode: 400,
            description: 'Bad request',
            format: ResponseFormat.JSON,
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
  } catch (error) {
    logger.error('Error analyzing Fastify app:', error);
  }
  
  logger.info(`Analysis complete. Found ${endpoints.length} endpoints.`);
  return endpoints;
}