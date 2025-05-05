import { ApiEndpoint } from '../utils/types';
/**
 * Framework types supported by the analyzer
 */
export declare enum FrameworkType {
    EXPRESS = "express",
    FASTIFY = "fastify",
    NEST = "nestjs",
    AUTO = "auto"
}
/**
 * Analyzes an API application based on the specified framework type.
 * If framework type is AUTO, it will attempt to detect the framework.
 *
 * @param app Application instance
 * @param frameworkType Type of framework the application uses
 * @returns Array of detected API endpoints
 */
export declare function analyzeApp(app: any, frameworkType?: FrameworkType): ApiEndpoint[];
