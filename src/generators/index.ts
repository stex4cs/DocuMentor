import { MarkdownGenerator } from './markdown';
import { HtmlGenerator } from './html';
import { SwaggerGenerator } from './swagger';
import { ApiEndpoint } from '../utils/types';
import { logger } from '../utils/logger';

/**
 * Document format types supported by generators
 */
export enum DocumentFormat {
  MARKDOWN = 'markdown',
  HTML = 'html',
  SWAGGER = 'swagger'
}

/**
 * Generates API documentation in the specified format.
 * @param endpoints Array of API endpoints
 * @param format Documentation format
 * @param outputPath Path to save the output file
 * @param apiInfo API general information
 * @param templateDir Optional directory containing templates
 */
export function generateDocumentation(
  endpoints: ApiEndpoint[],
  format: DocumentFormat,
  outputPath: string,
  apiInfo: {
    title: string;
    description: string;
    version: string;
    baseUrl?: string;
  },
  templateDir?: string
): void {
  logger.info(`Generating ${format} documentation...`);
  
  try {
    switch (format) {
      case DocumentFormat.MARKDOWN:
        const mdGenerator = new MarkdownGenerator(templateDir);
        mdGenerator.generateDocs(endpoints, outputPath, apiInfo);
        break;
        
      case DocumentFormat.HTML:
        const htmlGenerator = new HtmlGenerator(templateDir);
        htmlGenerator.generateDocs(endpoints, outputPath, apiInfo);
        break;
        
      case DocumentFormat.SWAGGER:
        const swaggerGenerator = new SwaggerGenerator(templateDir);
        swaggerGenerator.generateDocs(endpoints, outputPath, apiInfo);
        break;
        
      default:
        logger.error(`Unsupported document format: ${format}`);
        throw new Error(`Unsupported document format: ${format}`);
    }
    
    logger.info(`Documentation generated successfully at ${outputPath}`);
  } catch (error) {
    logger.error(`Error generating documentation: ${error}`);
    throw error;
  }
}