import { Express, Request, Response } from 'express';
import { ApiEndpoint, HttpMethod, Parameter, ResponseFormat } from '../utils/types';
import { parseRouteParams } from '../utils/parser';
import { logger } from '../utils/logger';

/**
 * Analyzes an Express.js application to extract API endpoint information.
 * @param app Express application instance
 * @returns Array of detected API endpoints
 */
export function analyzeExpressApp(app: any): ApiEndpoint[] {
  logger.info('Analyzing Express.js application...');
  
  const endpoints: ApiEndpoint[] = [];
  const stack = app._router?.stack || [];
  
  // Process the Express router stack to find routes
  for (const layer of stack) {
    if (layer.route) {
      const path = layer.route.path;
      const methods = Object.keys(layer.route.methods)
        .filter(m => layer.route.methods[m])
        .map(m => m.toUpperCase() as HttpMethod);
      
      for (const method of methods) {
        logger.debug(`Found endpoint: ${method} ${path}`);
        
        // Extract route parameters
        const params = parseRouteParams(path);
        
        // Create endpoint definition
        const endpoint: ApiEndpoint = {
          path,
          method,
          parameters: params.map(p => ({
            name: p,
            type: 'string',
            required: true,
            in: 'path',
            description: `URL parameter: ${p}`
          })),
          responses: [
            {
              statusCode: 200,
              description: 'Successful response',
              format: ResponseFormat.JSON
            },
            {
              statusCode: 400,
              description: 'Bad request',
              format: ResponseFormat.JSON
            }
          ],
          description: '',
          summary: '',
          tags: [],
          deprecated: false
        };
        
        endpoints.push(endpoint);
      }
    } else if (layer.name === 'router' && layer.handle?.stack) {
      // Handle nested routers
      const routerPath = layer.regexp?.toString()
        .replace('\\/?(?=\\/|$)', '')
        .replace(/^\^\\/, '')
        .replace(/\\\/\?\(\?=\\\/\|\$\)$/g, '')
        .replace(/\\\//g, '/') || '';
      
      const nestedEndpoints = processNestedRouter(layer.handle.stack, routerPath);
      endpoints.push(...nestedEndpoints);
    }
  }
  
  logger.info(`Analysis complete. Found ${endpoints.length} endpoints.`);
  return endpoints;
}

/**
 * Processes a nested Express router to extract its endpoints.
 * @param stack Router stack
 * @param basePath Base path for the router
 * @returns Array of API endpoints
 */
function processNestedRouter(stack: any[], basePath: string): ApiEndpoint[] {
  const endpoints: ApiEndpoint[] = [];
  
  for (const layer of stack) {
    if (layer.route) {
      const routePath = layer.route.path;
      const fullPath = normalizePath(`${basePath}${routePath}`);
      const methods = Object.keys(layer.route.methods)
        .filter(m => layer.route.methods[m])
        .map(m => m.toUpperCase() as HttpMethod);
      
      for (const method of methods) {
        logger.debug(`Found nested endpoint: ${method} ${fullPath}`);
        
        // Extract route parameters
        const params = parseRouteParams(fullPath);
        
        // Create endpoint definition
        const endpoint: ApiEndpoint = {
          path: fullPath,
          method,
          parameters: params.map(p => ({
            name: p,
            type: 'string',
            required: true,
            in: 'path',
            description: `URL parameter: ${p}`
          })),
          responses: [
            {
              statusCode: 200,
              description: 'Successful response',
              format: ResponseFormat.JSON
            },
            {
              statusCode: 400,
              description: 'Bad request',
              format: ResponseFormat.JSON
            }
          ],
          description: '',
          summary: '',
          tags: [],
          deprecated: false
        };
        
        endpoints.push(endpoint);
      }
    }
  }
  
  return endpoints;
}

/**
 * Normalizes a path by removing duplicate slashes.
 * @param path Path to normalize
 * @returns Normalized path
 */
function normalizePath(path: string): string {
  return path.replace(/\/+/g, '/');
}

/**
 * Extracts comments from a route handler to use as documentation.
 * @param handler Route handler function
 * @returns Extracted comments as string
 */
function extractComments(handler: Function): string {
  const fnStr = handler.toString();
  const commentRegex = /\/\*\*([\s\S]*?)\*\//;
  const match = commentRegex.exec(fnStr);
  
  if (match && match[1]) {
    return match[1]
      .replace(/\s*\*\s?/gm, ' ')
      .trim();
  }
  
  return '';
}