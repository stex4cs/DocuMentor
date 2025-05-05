import { ApiEndpoint } from '../utils/types';
/**
 * Generates HTML documentation for API endpoints.
 */
export declare class HtmlGenerator {
    private readonly templateDir;
    /**
     * Creates a new HtmlGenerator instance.
     * @param templateDir Directory containing templates
     */
    constructor(templateDir?: string);
    /**
     * Generates API documentation in HTML format.
     * @param endpoints Array of API endpoints
     * @param outputPath Path to save the output file
     * @param apiInfo API general information
     */
    generateDocs(endpoints: ApiEndpoint[], outputPath: string, apiInfo: {
        title: string;
        description: string;
        version: string;
        baseUrl?: string;
    }): void;
    /**
     * Generates HTML for a single endpoint.
     * @param endpoint API endpoint
     * @param baseUrl Optional base URL
     * @returns HTML string for the endpoint
     */
    private generateEndpointHtml;
    /**
     * Generates an HTML table for parameters.
     * @param params Array of parameters
     * @returns HTML table string
     */
    private generateParamsTable;
    /**
     * Creates an ID from a title.
     * @param title Title string
     * @returns Sanitized ID for HTML
     */
    private createId;
    /**
     * Returns the default HTML template if no template file is found.
     * @returns Default HTML template
     */
    private getDefaultTemplate;
}
/**
 * Generates Swagger/OpenAPI documentation for API endpoints.
 */
export declare class SwaggerGenerator {
    private readonly templateDir;
    /**
     * Creates a new SwaggerGenerator instance.
     * @param templateDir Directory containing templates
     */
    constructor(templateDir?: string);
    /**
     * Generates API documentation in Swagger/OpenAPI format.
     * @param endpoints Array of API endpoints
     * @param outputPath Path to save the output file
     * @param apiInfo API general information
     */
    generateDocs(endpoints: ApiEndpoint[], outputPath: string, apiInfo: {
        title: string;
        description: string;
        version: string;
        baseUrl?: string;
    }): void;
    /**
     * Adds an endpoint to the Swagger document.
     * @param swaggerDoc Swagger document
     * @param endpoint API endpoint
     */
    private addEndpointToSwagger;
    /**
     * Converts API parameters to Swagger parameters.
     * @param parameters API parameters
     * @returns Swagger parameters
     */
    private convertParametersToSwagger;
    /**
     * Converts API responses to Swagger responses.
     * @param responses API responses
     * @returns Swagger responses
     */
    private convertResponsesToSwagger;
    /**
     * Processes a schema object for Swagger compatibility.
     * @param schema Schema object
     * @returns Processed schema
     */
    private processSchema;
    /**
     * Adds parameter schemas to Swagger definitions.
     * @param swaggerDoc Swagger document
     * @param parameters API parameters
     */
    private addParameterSchemasToDefinitions;
    /**
     * Adds response schemas to Swagger definitions.
     * @param swaggerDoc Swagger document
     * @param responses API responses
     */
    private addResponseSchemasToDefinitions;
    /**
     * Gets the content types produced by the API based on responses.
     * @param responses API responses
     * @returns Array of content types
     */
    private getProducesFromResponses;
    /**
     * Generates an operation ID for an endpoint.
     * @param endpoint API endpoint
     * @returns Operation ID
     */
    private generateOperationId;
    /**
     * Returns the default Swagger template if no template file is found.
     * @returns Default Swagger template
     */
    private getDefaultSwaggerTemplate;
}
