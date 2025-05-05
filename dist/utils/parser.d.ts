/**
 * Parses route parameters from a path string.
 * @param path Route path
 * @returns Array of parameter names
 */
export declare function parseRouteParams(path: string): string[];
/**
 * Reads and parses a JavaScript or TypeScript file.
 * @param filePath Path to the file
 * @returns File content as string
 */
export declare function readFile(filePath: string): string;
/**
 * Finds all files matching a pattern in a directory.
 * @param dir Directory path
 * @param extensions File extensions to include
 * @param recursive Whether to search subdirectories
 * @returns Array of file paths
 */
export declare function findFiles(dir: string, extensions?: string[], recursive?: boolean): string[];
/**
 * Extracts JSDoc or similar comments from a file.
 * @param content File content
 * @returns Object mapping function names to comment strings
 */
export declare function extractComments(content: string): Record<string, string>;
/**
 * Extracts router definitions from an Express.js file.
 * @param content File content
 * @returns Array of router definitions
 */
export declare function extractExpressRoutes(content: string): Array<{
    method: string;
    path: string;
    handlerName: string;
}>;
/**
 * Extracts NestJS decorators from a file.
 * @param content File content
 * @returns Object with controller and route information
 */
export declare function extractNestDecorators(content: string): {
    controller?: {
        path: string;
        name: string;
    };
    routes: Array<{
        method: string;
        path: string;
        handlerName: string;
    }>;
};
