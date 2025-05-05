import { ApiEndpoint } from '../utils/types';
import 'reflect-metadata';
/**
 * Analyzes a NestJS application to extract API endpoint information.
 * Note: This requires the app to be using the Nest Swagger module
 * to extract complete information.
 *
 * @param app NestJS application instance
 * @returns Array of detected API endpoints
 */
export declare function analyzeNestApp(app: any): ApiEndpoint[];
