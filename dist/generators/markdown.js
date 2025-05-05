"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarkdownGenerator = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const logger_1 = require("../utils/logger");
/**
 * Generates Markdown documentation for API endpoints.
 */
class MarkdownGenerator {
    /**
     * Creates a new MarkdownGenerator instance.
     * @param templateDir Directory containing templates
     */
    constructor(templateDir) {
        this.templateDir = templateDir || path.join(__dirname, '..', '..', 'templates', 'markdown');
    }
    /**
     * Generates API documentation in Markdown format.
     * @param endpoints Array of API endpoints
     * @param outputPath Path to save the output file
     * @param apiInfo API general information
     */
    generateDocs(endpoints, outputPath, apiInfo) {
        logger_1.logger.info(`Generating Markdown documentation at ${outputPath}...`);
        let markdown = this.generateHeader(apiInfo);
        markdown += this.generateTableOfContents(endpoints);
        // Group endpoints by tags
        const tagGroups = {};
        const untaggedEndpoints = [];
        endpoints.forEach(endpoint => {
            if (endpoint.tags && endpoint.tags.length > 0) {
                endpoint.tags.forEach(tag => {
                    tagGroups[tag] = tagGroups[tag] || [];
                    tagGroups[tag].push(endpoint);
                });
            }
            else {
                untaggedEndpoints.push(endpoint);
            }
        });
        // Add tagged endpoints
        Object.keys(tagGroups).forEach(tag => {
            markdown += `\n## ${tag}\n\n`;
            tagGroups[tag].forEach(endpoint => {
                markdown += this.generateEndpointDoc(endpoint, apiInfo.baseUrl);
            });
        });
        // Add untagged endpoints
        if (untaggedEndpoints.length > 0) {
            markdown += '\n## API Endpoints\n\n';
            untaggedEndpoints.forEach(endpoint => {
                markdown += this.generateEndpointDoc(endpoint, apiInfo.baseUrl);
            });
        }
        // Create output directory if it doesn't exist
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        // Write to file
        fs.writeFileSync(outputPath, markdown, 'utf8');
        logger_1.logger.info('Markdown documentation generated successfully.');
    }
    /**
     * Generates the header section of the documentation.
     * @param apiInfo API information
     * @returns Markdown string for the header
     */
    generateHeader(apiInfo) {
        let header = `# ${apiInfo.title}\n\n`;
        header += `${apiInfo.description}\n\n`;
        header += `**Version:** ${apiInfo.version}\n`;
        if (apiInfo.baseUrl) {
            header += `**Base URL:** \`${apiInfo.baseUrl}\`\n`;
        }
        header += '\n';
        return header;
    }
    /**
     * Generates a table of contents for all endpoints.
     * @param endpoints Array of API endpoints
     * @returns Markdown string for the table of contents
     */
    generateTableOfContents(endpoints) {
        let toc = '## Table of Contents\n\n';
        // Group endpoints by tags
        const tagGroups = {};
        const untaggedEndpoints = [];
        endpoints.forEach(endpoint => {
            if (endpoint.tags && endpoint.tags.length > 0) {
                endpoint.tags.forEach(tag => {
                    tagGroups[tag] = tagGroups[tag] || [];
                    tagGroups[tag].push(endpoint);
                });
            }
            else {
                untaggedEndpoints.push(endpoint);
            }
        });
        // Add tagged endpoints to TOC
        Object.keys(tagGroups).forEach(tag => {
            toc += `- [${tag}](#${tag.toLowerCase().replace(/\s+/g, '-')})\n`;
            tagGroups[tag].forEach(endpoint => {
                const title = endpoint.summary || `${endpoint.method} ${endpoint.path}`;
                const anchor = this.createAnchor(title);
                toc += `  - [${title}](#${anchor})\n`;
            });
        });
        // Add untagged endpoints to TOC
        if (untaggedEndpoints.length > 0) {
            toc += '- [API Endpoints](#api-endpoints)\n';
            untaggedEndpoints.forEach(endpoint => {
                const title = endpoint.summary || `${endpoint.method} ${endpoint.path}`;
                const anchor = this.createAnchor(title);
                toc += `  - [${title}](#${anchor})\n`;
            });
        }
        toc += '\n';
        return toc;
    }
    /**
     * Generates documentation for a single endpoint.
     * @param endpoint API endpoint
     * @param baseUrl Optional base URL
     * @returns Markdown string for the endpoint
     */
    generateEndpointDoc(endpoint, baseUrl) {
        const title = endpoint.summary || `${endpoint.method} ${endpoint.path}`;
        let markdown = `### ${title}\n\n`;
        if (endpoint.deprecated) {
            markdown += '> **Warning:** This endpoint is deprecated and may be removed in future versions.\n\n';
        }
        // Method and path
        markdown += `**${endpoint.method}** \`${endpoint.path}\`\n\n`;
        // Description
        if (endpoint.description) {
            markdown += `${endpoint.description}\n\n`;
        }
        // Example URL
        if (baseUrl) {
            let exampleUrl = `${baseUrl}${endpoint.path}`;
            const queryParams = endpoint.parameters.filter(p => p.in === 'query');
            if (queryParams.length > 0) {
                exampleUrl += '?';
                exampleUrl += queryParams
                    .map(p => `${p.name}=${p.example || '{' + p.name + '}'}`)
                    .join('&');
            }
            markdown += `**Example URL:** \`${exampleUrl}\`\n\n`;
        }
        // Parameters
        const pathParams = endpoint.parameters.filter(p => p.in === 'path');
        const queryParams = endpoint.parameters.filter(p => p.in === 'query');
        const bodyParams = endpoint.parameters.filter(p => p.in === 'body');
        const headerParams = endpoint.parameters.filter(p => p.in === 'header');
        if (endpoint.parameters.length > 0) {
            markdown += '#### Parameters\n\n';
            if (pathParams.length > 0) {
                markdown += '**Path Parameters:**\n\n';
                markdown += this.generateParamsTable(pathParams);
                markdown += '\n';
            }
            if (queryParams.length > 0) {
                markdown += '**Query Parameters:**\n\n';
                markdown += this.generateParamsTable(queryParams);
                markdown += '\n';
            }
            if (headerParams.length > 0) {
                markdown += '**Header Parameters:**\n\n';
                markdown += this.generateParamsTable(headerParams);
                markdown += '\n';
            }
            if (bodyParams.length > 0) {
                markdown += '**Request Body:**\n\n';
                if (bodyParams[0].schema) {
                    markdown += '```json\n';
                    markdown += JSON.stringify(bodyParams[0].schema, null, 2);
                    markdown += '\n```\n\n';
                }
                else {
                    markdown += this.generateParamsTable(bodyParams);
                    markdown += '\n';
                }
            }
        }
        // Responses
        if (endpoint.responses.length > 0) {
            markdown += '#### Responses\n\n';
            for (const response of endpoint.responses) {
                markdown += `**Status Code:** ${response.statusCode} - ${response.description}\n\n`;
                if (response.schema) {
                    markdown += '```json\n';
                    markdown += JSON.stringify(response.schema, null, 2);
                    markdown += '\n```\n\n';
                }
            }
        }
        markdown += '---\n\n';
        return markdown;
    }
    /**
     * Generates a markdown table for parameters.
     * @param params Array of parameters
     * @returns Markdown table string
     */
    generateParamsTable(params) {
        let table = '| Name | Type | Required | Description |\n';
        table += '|------|------|----------|-------------|\n';
        params.forEach(param => {
            table += `| ${param.name} | ${param.type} | ${param.required ? 'Yes' : 'No'} | ${param.description || ''} |\n`;
        });
        return table;
    }
    /**
     * Creates an anchor ID from a title.
     * @param title Title string
     * @returns Anchor ID for markdown
     */
    createAnchor(title) {
        return title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-');
    }
}
exports.MarkdownGenerator = MarkdownGenerator;
