import { ApiEndpoint } from '../utils/types';
/**
 * Document format types supported by generators
 */
export declare enum DocumentFormat {
    MARKDOWN = "markdown",
    HTML = "html",
    SWAGGER = "swagger"
}
/**
 * Generates API documentation in the specified format.
 * @param endpoints Array of API endpoints
 * @param format Documentation format
 * @param outputPath Path to save the output file
 * @param apiInfo API general information
 * @param templateDir Optional directory containing templates
 */
export declare function generateDocumentation(endpoints: ApiEndpoint[], format: DocumentFormat, outputPath: string, apiInfo: {
    title: string;
    description: string;
    version: string;
    baseUrl?: string;
}, templateDir?: string): void;
