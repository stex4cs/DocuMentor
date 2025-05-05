#!/usr/bin/env node
import * as commander from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import { analyzeApp, FrameworkType } from './analyzers';
import { generateDocumentation, DocumentFormat } from './generators';
import { testApiEndpoints } from './testers';
import { logger, LogLevel } from './utils/logger';

// Get package version
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')
);

const program = new commander.Command();

program
  .name('documentor')
  .description('Automatically generate API documentation')
  .version(packageJson.version);

// Global options
program
  .option('-v, --verbose', 'Enable verbose output')
  .option('-c, --config <path>', 'Path to configuration file');

// Analyze command
program
  .command('analyze')
  .description('Analyze API endpoints from application code')
  .option('-f, --framework <type>', 'Framework type (express, fastify, nestjs, auto)', 'auto')
  .option('-p, --path <path>', 'Path to application entry file or directory', './src')
  .option('-o, --output <path>', 'Output file path', './api-endpoints.json')
  .action(async (options) => {
    try {
      if (program.opts().verbose) {
        logger.setLevel(LogLevel.DEBUG);
      }
      
      logger.info('Analyzing API endpoints...');
      
      // Load application
      const appPath = path.resolve(options.path);
      
      if (!fs.existsSync(appPath)) {
        logger.error(`Path does not exist: ${appPath}`);
        process.exit(1);
      }
      
      // Require the application module
      const app = require(appPath);
      const frameworkType = options.framework as FrameworkType;
      
      // Analyze endpoints
      const endpoints = analyzeApp(app, frameworkType);
      
      // Save to file
      const outputPath = path.resolve(options.output);
      fs.writeFileSync(outputPath, JSON.stringify(endpoints, null, 2), 'utf8');
      
      logger.info(`Found ${endpoints.length} endpoints.`);
      logger.info(`Endpoints saved to ${outputPath}`);
    } catch (error) {
      logger.error('Error analyzing API endpoints:', error);
      process.exit(1);
    }
  });

// Generate command
program
  .command('generate')
  .description('Generate API documentation')
  .option('-i, --input <path>', 'Input endpoints file path', './api-endpoints.json')
  .option('-o, --output <path>', 'Output documentation file path', './docs/api.md')
  .option('-f, --format <format>', 'Documentation format (markdown, html, swagger)', 'markdown')
  .option('-t, --title <title>', 'API title', 'API Documentation')
  .option('-d, --description <description>', 'API description', 'Generated API documentation')
  .option('-v, --version <version>', 'API version', '1.0.0')
  .option('-b, --base-url <url>', 'API base URL', 'http://localhost:3000')
  .option('--template-dir <path>', 'Custom templates directory')
  .action(async (options) => {
    try {
      if (program.opts().verbose) {
        logger.setLevel(LogLevel.DEBUG);
      }
      
      logger.info('Generating API documentation...');
      
      // Load endpoints file
      const inputPath = path.resolve(options.input);
      
      if (!fs.existsSync(inputPath)) {
        logger.error(`Input file does not exist: ${inputPath}`);
        process.exit(1);
      }
      
      const endpoints = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
      
      // Validate format
      const format = options.format.toLowerCase();
      
      if (!['markdown', 'html', 'swagger'].includes(format)) {
        logger.error(`Invalid format: ${format}`);
        process.exit(1);
      }
      
      // Generate documentation
      const outputPath = path.resolve(options.output);
      const templateDir = options.templateDir 
        ? path.resolve(options.templateDir) 
        : undefined;
      
      generateDocumentation(
        endpoints,
        format as DocumentFormat,
        outputPath,
        {
          title: options.title,
          description: options.description,
          version: options.version,
          baseUrl: options.baseUrl
        },
        templateDir
      );
      
      logger.info(`Documentation generated at ${outputPath}`);
    } catch (error) {
      logger.error('Error generating documentation:', error);
      process.exit(1);
    }
  });

// Test command
program
  .command('test')
  .description('Test API endpoints')
  .option('-i, --input <path>', 'Input endpoints file path', './api-endpoints.json')
  .option('-o, --output <path>', 'Output test results file path', './test-results.json')
  .option('-b, --base-url <url>', 'API base URL', 'http://localhost:3000')
  .option('-t, --timeout <ms>', 'Request timeout in milliseconds', '5000')
  .option('-s, --validate-schema', 'Validate response schema', false)
  .option('-p, --params <path>', 'Path to parameters file')
  .action(async (options) => {
    try {
      if (program.opts().verbose) {
        logger.setLevel(LogLevel.DEBUG);
      }
      
      logger.info('Testing API endpoints...');
      
      // Load endpoints file
      const inputPath = path.resolve(options.input);
      
      if (!fs.existsSync(inputPath)) {
        logger.error(`Input file does not exist: ${inputPath}`);
        process.exit(1);
      }
      
      const endpoints = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
      
      // Load parameters file if provided
      let paramValues = {};
      
      if (options.params) {
        const paramsPath = path.resolve(options.params);
        
        if (fs.existsSync(paramsPath)) {
          paramValues = JSON.parse(fs.readFileSync(paramsPath, 'utf8'));
        } else {
          logger.warn(`Parameters file does not exist: ${paramsPath}`);
        }
      }
      
      // Run tests
      const results = await testApiEndpoints(endpoints, {
        baseUrl: options.baseUrl,
        timeout: parseInt(options.timeout, 10),
        validateSchema: options.validateSchema,
        paramValues
      });
      
      // Save test results
      const outputPath = path.resolve(options.output);
      fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');
      
      const successCount = results.filter(r => r.success).length;
      logger.info(`Test results: ${successCount}/${results.length} passed`);
      logger.info(`Test results saved to ${outputPath}`);
      
      // Exit with error code if tests failed
      if (successCount < results.length) {
        process.exit(1);
      }
    } catch (error) {
      logger.error('Error testing API endpoints:', error);
      process.exit(1);
    }
  });

// All-in-one command
program
  .command('auto')
  .description('Analyze, generate documentation, and test in one step')
  .option('-f, --framework <type>', 'Framework type (express, fastify, nestjs, auto)', 'auto')
  .option('-p, --path <path>', 'Path to application entry file or directory', './src')
  .option('-o, --output-dir <path>', 'Output directory', './docs')
  .option('-d, --doc-format <format>', 'Documentation format (markdown, html, swagger, all)', 'markdown')
  .option('-b, --base-url <url>', 'API base URL', 'http://localhost:3000')
  .option('-t, --title <title>', 'API title', 'API Documentation')
  .option('--description <description>', 'API description', 'Generated API documentation')
  .option('--version <version>', 'API version', '1.0.0')
  .option('--test', 'Run tests after documentation generation', false)
  .action(async (options) => {
    try {
      if (program.opts().verbose) {
        logger.setLevel(LogLevel.DEBUG);
      }
      
      // Create output directory if it doesn't exist
      const outputDir = path.resolve(options.outputDir);
      
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // Analyze endpoints
      logger.info('Analyzing API endpoints...');
      
      const appPath = path.resolve(options.path);
      
      if (!fs.existsSync(appPath)) {
        logger.error(`Path does not exist: ${appPath}`);
        process.exit(1);
      }
      
      const app = require(appPath);
      const frameworkType = options.framework as FrameworkType;
      
      const endpoints = analyzeApp(app, frameworkType);
      
      // Save endpoints
      const endpointsPath = path.join(outputDir, 'api-endpoints.json');
      fs.writeFileSync(endpointsPath, JSON.stringify(endpoints, null, 2), 'utf8');
      
      logger.info(`Found ${endpoints.length} endpoints. Saved to ${endpointsPath}`);
      
      // Generate documentation
      logger.info('Generating API documentation...');
      
      const formats = options.docFormat === 'all' 
        ? ['markdown', 'html', 'swagger'] 
        : [options.docFormat];
      
      for (const format of formats) {
        const extension = format === 'swagger' ? 'json' : format;
        const outputPath = path.join(outputDir, `api.${extension}`);
        
        generateDocumentation(
          endpoints,
          format as DocumentFormat,
          outputPath,
          {
            title: options.title,
            description: options.description,
            version: options.version,
            baseUrl: options.baseUrl
          }
        );
        
        logger.info(`Generated ${format} documentation at ${outputPath}`);
      }
      
      // Run tests if requested
      if (options.test) {
        logger.info('Testing API endpoints...');
        
        const results = await testApiEndpoints(endpoints, {
          baseUrl: options.baseUrl,
          timeout: 5000,
          validateSchema: true
        });
        
        // Save test results
        const resultsPath = path.join(outputDir, 'test-results.json');
        fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2), 'utf8');
        
        const successCount = results.filter(r => r.success).length;
        logger.info(`Test results: ${successCount}/${results.length} passed. Saved to ${resultsPath}`);
      }
      
      logger.info('All operations completed successfully.');
    } catch (error) {
      logger.error('Error in auto command:', error);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse(process.argv);

// Show help if no command is provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}