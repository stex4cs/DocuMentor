#!/usr/bin/env node
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
const commander = __importStar(require("commander"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const analyzers_1 = require("./analyzers");
const generators_1 = require("./generators");
const testers_1 = require("./testers");
const logger_1 = require("./utils/logger");
// Get package version
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
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
            logger_1.logger.setLevel(logger_1.LogLevel.DEBUG);
        }
        logger_1.logger.info('Analyzing API endpoints...');
        // Load application
        const appPath = path.resolve(options.path);
        if (!fs.existsSync(appPath)) {
            logger_1.logger.error(`Path does not exist: ${appPath}`);
            process.exit(1);
        }
        // Require the application module
        const app = require(appPath);
        const frameworkType = options.framework;
        // Analyze endpoints
        const endpoints = (0, analyzers_1.analyzeApp)(app, frameworkType);
        // Save to file
        const outputPath = path.resolve(options.output);
        fs.writeFileSync(outputPath, JSON.stringify(endpoints, null, 2), 'utf8');
        logger_1.logger.info(`Found ${endpoints.length} endpoints.`);
        logger_1.logger.info(`Endpoints saved to ${outputPath}`);
    }
    catch (error) {
        logger_1.logger.error('Error analyzing API endpoints:', error);
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
            logger_1.logger.setLevel(logger_1.LogLevel.DEBUG);
        }
        logger_1.logger.info('Generating API documentation...');
        // Load endpoints file
        const inputPath = path.resolve(options.input);
        if (!fs.existsSync(inputPath)) {
            logger_1.logger.error(`Input file does not exist: ${inputPath}`);
            process.exit(1);
        }
        const endpoints = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
        // Validate format
        const format = options.format.toLowerCase();
        if (!['markdown', 'html', 'swagger'].includes(format)) {
            logger_1.logger.error(`Invalid format: ${format}`);
            process.exit(1);
        }
        // Generate documentation
        const outputPath = path.resolve(options.output);
        const templateDir = options.templateDir
            ? path.resolve(options.templateDir)
            : undefined;
        (0, generators_1.generateDocumentation)(endpoints, format, outputPath, {
            title: options.title,
            description: options.description,
            version: options.version,
            baseUrl: options.baseUrl
        }, templateDir);
        logger_1.logger.info(`Documentation generated at ${outputPath}`);
    }
    catch (error) {
        logger_1.logger.error('Error generating documentation:', error);
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
            logger_1.logger.setLevel(logger_1.LogLevel.DEBUG);
        }
        logger_1.logger.info('Testing API endpoints...');
        // Load endpoints file
        const inputPath = path.resolve(options.input);
        if (!fs.existsSync(inputPath)) {
            logger_1.logger.error(`Input file does not exist: ${inputPath}`);
            process.exit(1);
        }
        const endpoints = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
        // Load parameters file if provided
        let paramValues = {};
        if (options.params) {
            const paramsPath = path.resolve(options.params);
            if (fs.existsSync(paramsPath)) {
                paramValues = JSON.parse(fs.readFileSync(paramsPath, 'utf8'));
            }
            else {
                logger_1.logger.warn(`Parameters file does not exist: ${paramsPath}`);
            }
        }
        // Run tests
        const results = await (0, testers_1.testApiEndpoints)(endpoints, {
            baseUrl: options.baseUrl,
            timeout: parseInt(options.timeout, 10),
            validateSchema: options.validateSchema,
            paramValues
        });
        // Save test results
        const outputPath = path.resolve(options.output);
        fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');
        const successCount = results.filter(r => r.success).length;
        logger_1.logger.info(`Test results: ${successCount}/${results.length} passed`);
        logger_1.logger.info(`Test results saved to ${outputPath}`);
        // Exit with error code if tests failed
        if (successCount < results.length) {
            process.exit(1);
        }
    }
    catch (error) {
        logger_1.logger.error('Error testing API endpoints:', error);
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
            logger_1.logger.setLevel(logger_1.LogLevel.DEBUG);
        }
        // Create output directory if it doesn't exist
        const outputDir = path.resolve(options.outputDir);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        // Analyze endpoints
        logger_1.logger.info('Analyzing API endpoints...');
        const appPath = path.resolve(options.path);
        if (!fs.existsSync(appPath)) {
            logger_1.logger.error(`Path does not exist: ${appPath}`);
            process.exit(1);
        }
        const app = require(appPath);
        const frameworkType = options.framework;
        const endpoints = (0, analyzers_1.analyzeApp)(app, frameworkType);
        // Save endpoints
        const endpointsPath = path.join(outputDir, 'api-endpoints.json');
        fs.writeFileSync(endpointsPath, JSON.stringify(endpoints, null, 2), 'utf8');
        logger_1.logger.info(`Found ${endpoints.length} endpoints. Saved to ${endpointsPath}`);
        // Generate documentation
        logger_1.logger.info('Generating API documentation...');
        const formats = options.docFormat === 'all'
            ? ['markdown', 'html', 'swagger']
            : [options.docFormat];
        for (const format of formats) {
            const extension = format === 'swagger' ? 'json' : format;
            const outputPath = path.join(outputDir, `api.${extension}`);
            (0, generators_1.generateDocumentation)(endpoints, format, outputPath, {
                title: options.title,
                description: options.description,
                version: options.version,
                baseUrl: options.baseUrl
            });
            logger_1.logger.info(`Generated ${format} documentation at ${outputPath}`);
        }
        // Run tests if requested
        if (options.test) {
            logger_1.logger.info('Testing API endpoints...');
            const results = await (0, testers_1.testApiEndpoints)(endpoints, {
                baseUrl: options.baseUrl,
                timeout: 5000,
                validateSchema: true
            });
            // Save test results
            const resultsPath = path.join(outputDir, 'test-results.json');
            fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2), 'utf8');
            const successCount = results.filter(r => r.success).length;
            logger_1.logger.info(`Test results: ${successCount}/${results.length} passed. Saved to ${resultsPath}`);
        }
        logger_1.logger.info('All operations completed successfully.');
    }
    catch (error) {
        logger_1.logger.error('Error in auto command:', error);
        process.exit(1);
    }
});
// Parse command line arguments
program.parse(process.argv);
// Show help if no command is provided
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
