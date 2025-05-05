import { ApiEndpoint } from '../utils/types';
/**
 * Generates Markdown documentation for API endpoints.
 */
export declare class MarkdownGenerator {
    private readonly templateDir;
    /**
     * Creates a new MarkdownGenerator instance.
     * @param templateDir Directory containing templates
     */
    constructor(templateDir?: string);
    /**
     * Generates API documentation in Markdown format.
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
     * Generates the header section of the documentation.
     * @param apiInfo API information
     * @returns Markdown string for the header
     */
    private generateHeader;
    /**
     * Generates a table of contents for all endpoints.
     * @param endpoints Array of API endpoints
     * @returns Markdown string for the table of contents
     */
    private generateTableOfContents;
    /**
     * Generates documentation for a single endpoint.
     * @param endpoint API endpoint
     * @param baseUrl Optional base URL
     * @returns Markdown string for the endpoint
     */
    private generateEndpointDoc;
    /**
     * Generates a markdown table for parameters.
     * @param params Array of parameters
     * @returns Markdown table string
     */
    private generateParamsTable;
    /**
     * Creates an anchor ID from a title.
     * @param title Title string
     * @returns Anchor ID for markdown
     */
    private createAnchor;
}
