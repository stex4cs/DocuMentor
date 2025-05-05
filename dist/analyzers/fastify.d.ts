import { ApiEndpoint } from '../utils/types';
/**
 * Analyzes a Fastify application to extract API endpoint information.
 * @param app Fastify application instance
 * @returns Array of detected API endpoints
 */
export declare function analyzeFastifyApp(app: any): ApiEndpoint[];
