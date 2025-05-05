import { ApiEndpoint } from '../utils/types';
/**
 * Analyzes an Express.js application to extract API endpoint information.
 * @param app Express application instance
 * @returns Array of detected API endpoints
 */
export declare function analyzeExpressApp(app: any): ApiEndpoint[];
