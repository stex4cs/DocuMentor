"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentFormat = void 0;
exports.generateDocumentation = generateDocumentation;
const markdown_1 = require("./markdown");
const html_1 = require("./html");
const swagger_1 = require("./swagger");
const logger_1 = require("../utils/logger");
/**
 * Document format types supported by generators
 */
var DocumentFormat;
(function (DocumentFormat) {
    DocumentFormat["MARKDOWN"] = "markdown";
    DocumentFormat["HTML"] = "html";
    DocumentFormat["SWAGGER"] = "swagger";
})(DocumentFormat || (exports.DocumentFormat = DocumentFormat = {}));
/**
 * Generates API documentation in the specified format.
 * @param endpoints Array of API endpoints
 * @param format Documentation format
 * @param outputPath Path to save the output file
 * @param apiInfo API general information
 * @param templateDir Optional directory containing templates
 */
function generateDocumentation(endpoints, format, outputPath, apiInfo, templateDir) {
    logger_1.logger.info(`Generating ${format} documentation...`);
    try {
        switch (format) {
            case DocumentFormat.MARKDOWN:
                const mdGenerator = new markdown_1.MarkdownGenerator(templateDir);
                mdGenerator.generateDocs(endpoints, outputPath, apiInfo);
                break;
            case DocumentFormat.HTML:
                const htmlGenerator = new html_1.HtmlGenerator(templateDir);
                htmlGenerator.generateDocs(endpoints, outputPath, apiInfo);
                break;
            case DocumentFormat.SWAGGER:
                const swaggerGenerator = new swagger_1.SwaggerGenerator(templateDir);
                swaggerGenerator.generateDocs(endpoints, outputPath, apiInfo);
                break;
            default:
                logger_1.logger.error(`Unsupported document format: ${format}`);
                throw new Error(`Unsupported document format: ${format}`);
        }
        logger_1.logger.info(`Documentation generated successfully at ${outputPath}`);
    }
    catch (error) {
        logger_1.logger.error(`Error generating documentation: ${error}`);
        throw error;
    }
}
