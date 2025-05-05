import * as fs from 'fs';
import * as path from 'path';
import { ApiEndpoint, Parameter, ResponseFormat } from '../utils/types';
import { logger } from '../utils/logger';

/**
 * Generates Swagger/OpenAPI documentation for API endpoints.
 */
export class SwaggerGenerator {
  private readonly templateDir: string;
  
  /**
   * Creates a new SwaggerGenerator instance.
   * @param templateDir Directory containing templates
   */
  constructor(templateDir?: string) {
    this.templateDir = templateDir || path.join(__dirname, '..', '..', 'templates', 'swagger');
  }
  
  /**
   * Generates API documentation in Swagger/OpenAPI format.
   * @param endpoints Array of API endpoints
   * @param outputPath Path to save the output file
   * @param apiInfo API general information
   */
  public generateDocs(
    endpoints: ApiEndpoint[],
    outputPath: string,
    apiInfo: {
      title: string;
      description: string;
      version: string;
      baseUrl?: string;
    }
  ): void {
    logger.info(`Generating Swagger documentation at ${outputPath}...`);
    
    try {
      // Start with base template
      let templatePath = path.join(this.templateDir, 'base.json');
      let swaggerDoc: any;
      
      if (fs.existsSync(templatePath)) {
        const template = fs.readFileSync(templatePath, 'utf8');
        swaggerDoc = JSON.parse(template);
      } else {
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
      const tags: Set<string> = new Set();
      
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
      
      logger.info('Swagger documentation generated successfully.');
    } catch (error) {
      logger.error('Error generating Swagger documentation:', error);
      throw error;
    }
  }
  
  /**
   * Adds an endpoint to the Swagger document.
   * @param swaggerDoc Swagger document
   * @param endpoint API endpoint
   */
  private addEndpointToSwagger(swaggerDoc: any, endpoint: ApiEndpoint): void {
    const path = endpoint.path.replace(/:([^/]+)/g, '{$1}');
    const method = endpoint.method.toLowerCase();
    
    if (!swaggerDoc.paths[path]) {
      swaggerDoc.paths[path] = {};
    }
    
    const operation: any = {
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
  private convertParametersToSwagger(parameters: Parameter[]): any[] {
    return parameters.map(param => {
      const swaggerParam: any = {
        name: param.name,
        in: param.in,
        description: param.description || '',
        required: param.required
      };
      
      if (param.in === 'body') {
        if (param.schema) {
          swaggerParam.schema = this.processSchema(param.schema);
        } else {
          swaggerParam.schema = {
            type: 'object',
            properties: {}
          };
        }
      } else {
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
  private convertResponsesToSwagger(responses: Array<{
    statusCode: number;
    description: string;
    format: ResponseFormat;
    schema?: any;
  }>): any {
    const swaggerResponses: any = {};
    
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
  private processSchema(schema: any): any {
    if (!schema) return schema;
    
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
  private addParameterSchemasToDefinitions(swaggerDoc: any, parameters: Parameter[]): void {
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
  private addResponseSchemasToDefinitions(swaggerDoc: any, responses: Array<{
    statusCode: number;
    description: string;
    format: ResponseFormat;
    schema?: any;
  }>): void {
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
  private getProducesFromResponses(responses: Array<{
    statusCode: number;
    description: string;
    format: ResponseFormat;
    schema?: any;
  }>): string[] {
    const produces = new Set<string>();
    
    responses.forEach(response => {
      switch (response.format) {
        case ResponseFormat.JSON:
          produces.add('application/json');
          break;
        case ResponseFormat.XML:
          produces.add('application/xml');
          break;
        case ResponseFormat.TEXT:
          produces.add('text/plain');
          break;
        case ResponseFormat.HTML:
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
  private generateOperationId(endpoint: ApiEndpoint): string {
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
  private getDefaultSwaggerTemplate(): any {
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