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
exports.SwaggerGenerator = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const types_1 = require("../utils/types");
const logger_1 = require("../utils/logger");
/**
 * Generates Swagger/OpenAPI documentation for API endpoints.
 */
class SwaggerGenerator {
    /**
     * Creates a new SwaggerGenerator instance.
     * @param templateDir Directory containing templates
     */
    constructor(templateDir) {
        this.templateDir = templateDir || path.join(__dirname, '..', '..', 'templates', 'swagger');
    }
    /**
     * Generates API documentation in Swagger/OpenAPI format.
     * @param endpoints Array of API endpoints
     * @param outputPath Path to save the output file
     * @param apiInfo API general information
     */
    generateDocs(endpoints, outputPath, apiInfo) {
        logger_1.logger.info(`Generating Swagger documentation at ${outputPath}...`);
        try {
            // Start with base template
            let templatePath = path.join(this.templateDir, 'base.json');
            let swaggerDoc;
            if (fs.existsSync(templatePath)) {
                const template = fs.readFileSync(templatePath, 'utf8');
                swaggerDoc = JSON.parse(template);
            }
            else {
                swaggerDoc = this.getDefaultSwaggerTemplate();
            }
            // Fill in API info
            swaggerDoc.info.title = apiInfo.title;
            swaggerDoc.info.description = apiInfo.description;
            swaggerDoc.info.version = apiInfo.version;
            if (apiInfo.baseUrl) {
                const urlParts = new URL(apiInfo.baseUrl);
                swaggerDoc.host = urlParts.host;
                swaggerDoc.basePath = urlParts.pathname;
                swaggerDoc.schemes = [urlParts.protocol.replace(':', '')];
            }
            // Initialize paths and definitions
            swaggerDoc.paths = {};
            swaggerDoc.definitions = swaggerDoc.definitions || {};
            // Process tags
            const tags = new Set();
            endpoints.forEach(endpoint => {
                if (endpoint.tags && endpoint.tags.length > 0) {
                    endpoint.tags.forEach(tag => tags.add(tag));
                }
            });
            swaggerDoc.tags = Array.from(tags).map(tag => ({
                name: tag,
                description: `Operations related to ${tag}`
            }));
            // Process endpoints
            endpoints.forEach(endpoint => {
                this.addEndpointToSwagger(swaggerDoc, endpoint);
            });
            // Create output directory if it doesn't exist
            const outputDir = path.dirname(outputPath);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            // Write to file
            fs.writeFileSync(outputPath, JSON.stringify(swaggerDoc, null, 2), 'utf8');
            logger_1.logger.info('Swagger documentation generated successfully.');
        }
        catch (error) {
            logger_1.logger.error('Error generating Swagger documentation:', error);
            throw error;
        }
    }
    /**
     * Adds an endpoint to the Swagger document.
     * @param swaggerDoc Swagger document
     * @param endpoint API endpoint
     */
    addEndpointToSwagger(swaggerDoc, endpoint) {
        const path = endpoint.path.replace(/:([^/]+)/g, '{$1}');
        const method = endpoint.method.toLowerCase();
        if (!swaggerDoc.paths[path]) {
            swaggerDoc.paths[path] = {};
        }
        const operation = {
            tags: endpoint.tags,
            summary: endpoint.summary || `${endpoint.method} ${endpoint.path}`,
            description: endpoint.description || '',
            operationId: this.generateOperationId(endpoint),
            deprecated: endpoint.deprecated,
            produces: this.getProducesFromResponses(endpoint.responses),
            parameters: this.convertParametersToSwagger(endpoint.parameters),
            responses: this.convertResponsesToSwagger(endpoint.responses)
        };
        // Remove undefined properties
        Object.keys(operation).forEach(key => {
            if (operation[key] === undefined ||
                (Array.isArray(operation[key]) && operation[key].length === 0)) {
                delete operation[key];
            }
        });
        swaggerDoc.paths[path][method] = operation;
        // Add schemas from body parameters and responses to definitions
        this.addParameterSchemasToDefinitions(swaggerDoc, endpoint.parameters);
        this.addResponseSchemasToDefinitions(swaggerDoc, endpoint.responses);
    }
    /**
     * Converts API parameters to Swagger parameters.
     * @param parameters API parameters
     * @returns Swagger parameters
     */
    convertParametersToSwagger(parameters) {
        return parameters.map(param => {
            const swaggerParam = {
                name: param.name,
                in: param.in,
                description: param.description || '',
                required: param.required
            };
            if (param.in === 'body') {
                if (param.schema) {
                    swaggerParam.schema = this.processSchema(param.schema);
                }
                else {
                    swaggerParam.schema = {
                        type: 'object',
                        properties: {}
                    };
                }
            }
            else {
                swaggerParam.type = param.type;
                if (param.enum) {
                    swaggerParam.enum = param.enum;
                }
                if (param.default !== undefined) {
                    swaggerParam.default = param.default;
                }
                if (param.format) {
                    swaggerParam.format = param.format;
                }
            }
            return swaggerParam;
        });
    }
    /**
     * Converts API responses to Swagger responses.
     * @param responses API responses
     * @returns Swagger responses
     */
    convertResponsesToSwagger(responses) {
        const swaggerResponses = {};
        responses.forEach(response => {
            const statusCode = response.statusCode.toString();
            swaggerResponses[statusCode] = {
                description: response.description || `Status ${statusCode} response`
            };
            if (response.schema) {
                swaggerResponses[statusCode].schema = this.processSchema(response.schema);
            }
        });
        return swaggerResponses;
    }
    /**
     * Processes a schema object for Swagger compatibility.
     * @param schema Schema object
     * @returns Processed schema
     */
    processSchema(schema) {
        if (!schema)
            return schema;
        // Create a deep copy to avoid modifying the original
        const copy = JSON.parse(JSON.stringify(schema));
        // If schema has a title, convert it to a reference
        if (copy.title) {
            const title = copy.title;
            delete copy.title;
            return { $ref: `#/definitions/${title}` };
        }
        return copy;
    }
    /**
     * Adds parameter schemas to Swagger definitions.
     * @param swaggerDoc Swagger document
     * @param parameters API parameters
     */
    addParameterSchemasToDefinitions(swaggerDoc, parameters) {
        for (const param of parameters) {
            if (param.in === 'body' && param.schema && param.schema.title) {
                const title = param.schema.title;
                const schema = { ...param.schema };
                delete schema.title;
                swaggerDoc.definitions[title] = schema;
            }
        }
    }
    /**
     * Adds response schemas to Swagger definitions.
     * @param swaggerDoc Swagger document
     * @param responses API responses
     */
    addResponseSchemasToDefinitions(swaggerDoc, responses) {
        for (const response of responses) {
            if (response.schema && response.schema.title) {
                const title = response.schema.title;
                const schema = { ...response.schema };
                delete schema.title;
                swaggerDoc.definitions[title] = schema;
            }
        }
    }
    /**
     * Gets the content types produced by the API based on responses.
     * @param responses API responses
     * @returns Array of content types
     */
    getProducesFromResponses(responses) {
        const produces = new Set();
        responses.forEach(response => {
            switch (response.format) {
                case types_1.ResponseFormat.JSON:
                    produces.add('application/json');
                    break;
                case types_1.ResponseFormat.XML:
                    produces.add('application/xml');
                    break;
                case types_1.ResponseFormat.TEXT:
                    produces.add('text/plain');
                    break;
                case types_1.ResponseFormat.HTML:
                    produces.add('text/html');
                    break;
                default:
                    produces.add('application/json');
            }
        });
        return Array.from(produces);
    }
    /**
     * Generates an operation ID for an endpoint.
     * @param endpoint API endpoint
     * @returns Operation ID
     */
    generateOperationId(endpoint) {
        const method = endpoint.method.toLowerCase();
        const path = endpoint.path
            .replace(/^\//, '')
            .replace(/\//g, '_')
            .replace(/:/g, '')
            .replace(/-/g, '_')
            .replace(/\{|\}/g, '');
        return `${method}_${path}`;
    }
    /**
     * Returns the default Swagger template if no template file is found.
     * @returns Default Swagger template
     */
    getDefaultSwaggerTemplate() {
        return {
            swagger: '2.0',
            info: {
                title: '',
                description: '',
                version: '1.0.0',
                contact: {
                    name: 'API Support',
                    url: 'https://www.example.com/support',
                    email: 'support@example.com'
                },
                license: {
                    name: 'MIT',
                    url: 'https://opensource.org/licenses/MIT'
                }
            },
            host: 'localhost:3000',
            basePath: '/',
            schemes: ['http'],
            consumes: ['application/json'],
            produces: ['application/json'],
            paths: {},
            definitions: {},
            securityDefinitions: {
                ApiKeyAuth: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'Authorization'
                }
            }
        };
    }
}
exports.SwaggerGenerator = SwaggerGenerator;
