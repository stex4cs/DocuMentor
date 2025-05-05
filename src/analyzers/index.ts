import { analyzeExpressApp } from './express';
import { analyzeFastifyApp } from './fastify';
import { analyzeNestApp } from './nest';
import { ApiEndpoint } from '../utils/types';
import { logger } from '../utils/logger';

/**
 * Framework types supported by the analyzer
 */
export enum FrameworkType {
  EXPRESS = 'express',
  FASTIFY = 'fastify',
  NEST = 'nestjs',
  AUTO = 'auto'
}

/**
 * Analyzes an API application based on the specified framework type.
 * If framework type is AUTO, it will attempt to detect the framework.
 * 
 * @param app Application instance
 * @param frameworkType Type of framework the application uses
 * @returns Array of detected API endpoints
 */
export function analyzeApp(app: any, frameworkType: FrameworkType = FrameworkType.AUTO): ApiEndpoint[] {
  if (frameworkType === FrameworkType.AUTO) {
    frameworkType = detectFrameworkType(app);
    logger.info(`Detected framework: ${frameworkType}`);
  }
  
  switch (frameworkType) {
    case FrameworkType.EXPRESS:
      return analyzeExpressApp(app);
    case FrameworkType.FASTIFY:
      return analyzeFastifyApp(app);
    case FrameworkType.NEST:
      return analyzeNestApp(app);
    default:
      logger.error(`Unsupported framework type: ${frameworkType}`);
      return [];
  }
}

/**
 * Attempts to detect the framework type based on application properties.
 * @param app Application instance
 * @returns Detected framework type
 */
function detectFrameworkType(app: any): FrameworkType {
  if (app._router && app._router.stack) {
    return FrameworkType.EXPRESS;
  }
  
  if (app.routes && typeof app.register === 'function') {
    return FrameworkType.FASTIFY;
  }
  
  if (app.container || app.applicationConfig?.container) {
    return FrameworkType.NEST;
  }
  
  // Default to Express if cannot determine
  logger.warn('Could not detect framework type, defaulting to Express');
  return FrameworkType.EXPRESS;
}