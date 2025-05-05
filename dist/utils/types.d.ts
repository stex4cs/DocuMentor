/**
 * HTTP methods
 */
export declare enum HttpMethod {
    GET = "GET",
    POST = "POST",
    PUT = "PUT",
    DELETE = "DELETE",
    PATCH = "PATCH",
    HEAD = "HEAD",
    OPTIONS = "OPTIONS"
}
/**
 * Response formats
 */
export declare enum ResponseFormat {
    JSON = "json",
    XML = "xml",
    TEXT = "text",
    HTML = "html",
    BINARY = "binary"
}
/**
 * Parameter type
 */
export interface Parameter {
    name: string;
    type: string;
    required: boolean;
    in: 'path' | 'query' | 'body' | 'header';
    description?: string;
    default?: any;
    example?: any;
    enum?: any[];
    format?: string;
    schema?: any;
}
/**
 * API endpoint type
 */
export interface ApiEndpoint {
    path: string;
    method: HttpMethod;
    parameters: Parameter[];
    responses: Array<{
        statusCode: number;
        description: string;
        format: ResponseFormat;
        schema?: any;
    }>;
    description: string;
    summary: string;
    tags: string[];
    deprecated: boolean;
}
