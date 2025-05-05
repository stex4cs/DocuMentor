import * as fs from 'fs';
import * as path from 'path';
import { ApiEndpoint, Parameter , ResponseFormat } from '../utils/types';
import { logger } from '../utils/logger';

/**
 * Generates HTML documentation for API endpoints.
 */
export class HtmlGenerator {
  private readonly templateDir: string;
  
  /**
   * Creates a new HtmlGenerator instance.
   * @param templateDir Directory containing templates
   */
  constructor(templateDir?: string) {
    this.templateDir = templateDir || path.join(__dirname, '..', '..', 'templates', 'html');
  }
  
  /**
   * Generates API documentation in HTML format.
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
    logger.info(`Generating HTML documentation at ${outputPath}...`);
    
    try {
      // Read HTML template
      let templatePath = path.join(this.templateDir, 'api.html');
      if (!fs.existsSync(templatePath)) {
        logger.warn(`Template not found at ${templatePath}, using default template`);
        templatePath = path.join(__dirname, '..', '..', 'templates', 'html', 'api.html');
      }
      
      let template = '';
      if (fs.existsSync(templatePath)) {
        template = fs.readFileSync(templatePath, 'utf8');
      } else {
        template = this.getDefaultTemplate();
      }
      
      // Replace placeholders with content
      let html = template
        .replace('{{TITLE}}', apiInfo.title)
        .replace('{{DESCRIPTION}}', apiInfo.description)
        .replace('{{VERSION}}', apiInfo.version)
        .replace('{{BASE_URL}}', apiInfo.baseUrl || '')
        .replace('{{GENERATED_DATE}}', new Date().toLocaleString());
      
      // Group endpoints by tags
      const tagGroups: Record<string, ApiEndpoint[]> = {};
      const untaggedEndpoints: ApiEndpoint[] = [];
      
      endpoints.forEach(endpoint => {
        if (endpoint.tags && endpoint.tags.length > 0) {
          endpoint.tags.forEach(tag => {
            tagGroups[tag] = tagGroups[tag] || [];
            tagGroups[tag].push(endpoint);
          });
        } else {
          untaggedEndpoints.push(endpoint);
        }
      });
      
      // Generate navigation
      let navigation = '<ul class="nav">';
      
      Object.keys(tagGroups).forEach(tag => {
        navigation += `<li><a href="#${this.createId(tag)}">${tag}</a><ul>`;
        tagGroups[tag].forEach(endpoint => {
          const title = endpoint.summary || `${endpoint.method} ${endpoint.path}`;
          navigation += `<li><a href="#${this.createId(title)}">${title}</a></li>`;
        });
        navigation += '</ul></li>';
      });
      
      if (untaggedEndpoints.length > 0) {
        navigation += '<li><a href="#api-endpoints">API Endpoints</a><ul>';
        untaggedEndpoints.forEach(endpoint => {
          const title = endpoint.summary || `${endpoint.method} ${endpoint.path}`;
          navigation += `<li><a href="#${this.createId(title)}">${title}</a></li>`;
        });
        navigation += '</ul></li>';
      }
      
      navigation += '</ul>';
      
      html = html.replace('{{NAVIGATION}}', navigation);
      
      // Generate endpoint documentation
      let content = '';
      
      // Add tagged endpoints
      Object.keys(tagGroups).forEach(tag => {
        content += `<section id="${this.createId(tag)}" class="tag-section">`;
        content += `<h2>${tag}</h2>`;
        
        tagGroups[tag].forEach(endpoint => {
          content += this.generateEndpointHtml(endpoint, apiInfo.baseUrl);
        });
        
        content += '</section>';
      }); // Add untagged endpoints
      if (untaggedEndpoints.length > 0) {
        content += '<section id="api-endpoints" class="tag-section">';
        content += '<h2>API Endpoints</h2>';
        
        untaggedEndpoints.forEach(endpoint => {
          content += this.generateEndpointHtml(endpoint, apiInfo.baseUrl);
        });
        
        content += '</section>';
      }
      
      html = html.replace('{{CONTENT}}', content);
      
      // Create output directory if it doesn't exist
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // Write to file
      fs.writeFileSync(outputPath, html, 'utf8');
      
      logger.info('HTML documentation generated successfully.');
    } catch (error) {
      logger.error('Error generating HTML documentation:', error);
      throw error;
    }
  }
  
  /**
   * Generates HTML for a single endpoint.
   * @param endpoint API endpoint
   * @param baseUrl Optional base URL
   * @returns HTML string for the endpoint
   */
  private generateEndpointHtml(endpoint: ApiEndpoint, baseUrl?: string): string {
    const title = endpoint.summary || `${endpoint.method} ${endpoint.path}`;
    let html = `<div id="${this.createId(title)}" class="endpoint">`;
    
    // Title and method/path
    html += `<h3>${title}</h3>`;
    
    if (endpoint.deprecated) {
      html += '<div class="deprecated-warning">This endpoint is deprecated and may be removed in future versions.</div>';
    }
    
    html += '<div class="endpoint-path">';
    html += `<span class="method method-${endpoint.method.toLowerCase()}">${endpoint.method}</span>`;
    html += `<span class="path">${endpoint.path}</span>`;
    html += '</div>';
    
    // Description
    if (endpoint.description) {
      html += `<div class="description">${endpoint.description}</div>`;
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
      
      html += '<div class="example-url">';
      html += '<strong>Example URL:</strong> ';
      html += `<code>${exampleUrl}</code>`;
      html += '</div>';
    }
    
    // Parameters
    const pathParams = endpoint.parameters.filter(p => p.in === 'path');
    const queryParams = endpoint.parameters.filter(p => p.in === 'query');
    const bodyParams = endpoint.parameters.filter(p => p.in === 'body');
    const headerParams = endpoint.parameters.filter(p => p.in === 'header');
    
    if (endpoint.parameters.length > 0) {
      html += '<div class="parameters">';
      html += '<h4>Parameters</h4>';
      
      if (pathParams.length > 0) {
        html += '<div class="param-section">';
        html += '<h5>Path Parameters</h5>';
        html += this.generateParamsTable(pathParams);
        html += '</div>';
      }
      
      if (queryParams.length > 0) {
        html += '<div class="param-section">';
        html += '<h5>Query Parameters</h5>';
        html += this.generateParamsTable(queryParams);
        html += '</div>';
      }
      
      if (headerParams.length > 0) {
        html += '<div class="param-section">';
        html += '<h5>Header Parameters</h5>';
        html += this.generateParamsTable(headerParams);
        html += '</div>';
      }
      
      if (bodyParams.length > 0) {
        html += '<div class="param-section">';
        html += '<h5>Request Body</h5>';
        
        if (bodyParams[0].schema) {
          html += '<pre class="code-block"><code class="language-json">';
          html += JSON.stringify(bodyParams[0].schema, null, 2)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
          html += '</code></pre>';
        } else {
          html += this.generateParamsTable(bodyParams);
        }
        
        html += '</div>';
      }
      
      html += '</div>'; // End parameters
    }
    
    // Responses
    if (endpoint.responses.length > 0) {
      html += '<div class="responses">';
      html += '<h4>Responses</h4>';
      
      for (const response of endpoint.responses) {
        html += '<div class="response">';
        html += `<h5>Status Code: ${response.statusCode}</h5>`;
        html += `<p>${response.description}</p>`;
        
        if (response.schema) {
          html += '<pre class="code-block"><code class="language-json">';
          html += JSON.stringify(response.schema, null, 2)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
          html += '</code></pre>';
        }
        
        html += '</div>'; // End response
      }
      
      html += '</div>'; // End responses
    }
    
    html += '</div>'; // End endpoint
    
    return html;
  }
  
  /**
   * Generates an HTML table for parameters.
   * @param params Array of parameters
   * @returns HTML table string
   */
  private generateParamsTable(params: Parameter[]): string {
    let table = '<table class="params-table">';
    table += '<thead><tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr></thead>';
    table += '<tbody>';
    
    params.forEach(param => {
      table += '<tr>';
      table += `<td>${param.name}</td>`;
      table += `<td>${param.type}</td>`;
      table += `<td>${param.required ? 'Yes' : 'No'}</td>`;
      table += `<td>${param.description || ''}</td>`;
      table += '</tr>';
    });
    
    table += '</tbody></table>';
    
    return table;
  }
  
  /**
   * Creates an ID from a title.
   * @param title Title string
   * @returns Sanitized ID for HTML
   */
  private createId(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
  }
  
  /**
   * Returns the default HTML template if no template file is found.
   * @returns Default HTML template
   */
  private getDefaultTemplate(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{TITLE}} API Documentation</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      display: flex;
    }
    
    .sidebar {
      width: 300px;
      background-color: #f5f5f5;
      padding: 20px;
      position: fixed;
      height: 100vh;
      overflow-y: auto;
      box-sizing: border-box;
    }
    
    .sidebar h1 {
      font-size: 1.5rem;
      margin-top: 0;
    }
    
    .main-content {
      flex: 1;
      padding: 30px;
      margin-left: 300px;
      max-width: calc(100% - 300px);
      box-sizing: border-box;
    }
    
    .nav {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .nav li {
      margin-bottom: 5px;
    }
    
    .nav ul {
      list-style: none;
      padding-left: 20px;
      margin-top: 5px;
    }
    
    .nav a {
      color: #0066cc;
      text-decoration: none;
    }
    
    .nav a:hover {
      text-decoration: underline;
    }
    
    .endpoint {
      margin-bottom: 50px;
      padding-bottom: 30px;
      border-bottom: 1px solid #eee;
    }
    
    .endpoint-path {
      margin: 15px 0;
      display: flex;
      align-items: center;
    }
    
    .method {
      padding: 5px 10px;
      border-radius: 4px;
      font-weight: bold;
      color: white;
      margin-right: 10px;
    }
    
    .method-get {
      background-color: #61affe;
    }
    
    .method-post {
      background-color: #49cc90;
    }
    
    .method-put {
      background-color: #fca130;
    }
    
    .method-delete {
      background-color: #f93e3e;
    }
    
    .method-patch {
      background-color: #50e3c2;
    }
    
    .path {
      font-family: monospace;
      font-size: 1.1rem;
    }
    
    .deprecated-warning {
      background-color: #ffe0e0;
      padding: 10px;
      border-radius: 4px;
      margin: 10px 0;
      border-left: 4px solid #ff6b6b;
    }
    
    .params-table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
    }
    
    .params-table th, .params-table td {
      padding: 8px 12px;
      border: 1px solid #ddd;
      text-align: left;
    }
    
    .params-table th {
      background-color: #f5f5f5;
      font-weight: 600;
    }
    
    .code-block {
      background-color: #f5f5f5;
      padding: 15px;
      border-radius: 4px;
      overflow: auto;
      margin: 10px 0;
    }
    
    .param-section, .response {
      margin: 15px 0;
    }
    
    .footer {
      margin-top: 50px;
      font-size: 0.9rem;
      color: #666;
      border-top: 1px solid #eee;
      padding-top: 20px;
    }
    
    @media (max-width: 900px) {
      body {
        flex-direction: column;
      }
      
      .sidebar {
        width: 100%;
        height: auto;
        position: relative;
      }
      
      .main-content {
        margin-left: 0;
        max-width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="sidebar">
    <h1>{{TITLE}}</h1>
    <p>Version: {{VERSION}}</p>
    <p>Base URL: <code>{{BASE_URL}}</code></p>
    <nav>
      {{NAVIGATION}}
    </nav>
  </div>
  
  <div class="main-content">
    <h1>{{TITLE}} API Documentation</h1>
    <p>{{DESCRIPTION}}</p>
    
    {{CONTENT}}
    
    <div class="footer">
      <p>Generated on {{GENERATED_DATE}} by DocuMentor</p>
    </div>
  </div>
  
  <script>
    // Add syntax highlighting if needed
    document.addEventListener('DOMContentLoaded', function() {
      const codeBlocks = document.querySelectorAll('pre code');
      if (codeBlocks.length > 0 && typeof hljs !== 'undefined') {
        codeBlocks.forEach(block => {
          hljs.highlightBlock(block);
        });
      }
    });
  </script>
</body>
</html>`;
  }
}


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