# DocuMentor

[![npm version](https://img.shields.io/npm/v/documenator.svg)](https://www.npmjs.com/package/documenator)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.7-blue)](https://www.typescriptlang.org/)

DocuMentor is a powerful tool for automatically generating, testing, and maintaining API documentation from your code. It works with Express.js, NestJS, and Fastify applications to create beautiful, accurate, and always up-to-date documentation for your APIs.

## Features

- **Automatic API Analysis**: Automatically extracts API endpoints from your Express.js, NestJS, or Fastify applications.
- **Multiple Documentation Formats**: Generate documentation in Markdown, HTML, or Swagger/OpenAPI format.
- **API Testing**: Test your API endpoints to ensure they work as documented.
- **Schema Validation**: Validate response schemas against your API documentation.
- **Customizable Templates**: Use built-in templates or create your own to match your project's style.
- **Command Line Interface**: Easy-to-use CLI for integrating into your workflow.
- **Programmable API**: Use DocuMentor in your own scripts and tools.

## Installation

```bash
# Install globally
npm install -g documenator

# Or as a development dependency
npm install --save-dev documenator
Quick Start
Generate Documentation
bash# Analyze an Express.js app and generate Markdown documentation
documenator auto --path ./src/app.js --output-dir ./docs

# Generate Swagger documentation for a NestJS app
documenator auto --framework nestjs --path ./src/main.ts --output-dir ./docs --doc-format swagger

# Generate all documentation formats and run tests
documenator auto --path ./src/app.js --output-dir ./docs --doc-format all --test
Using as a Library
typescriptimport { analyzeApp, generateDocumentation, DocumentFormat, FrameworkType } from 'documenator';
import * as express from 'express';

// Create your Express app
const app = express();
app.get('/users', (req, res) => res.json({ users: [] }));
// ... more routes

// Analyze the app to extract endpoints
const endpoints = analyzeApp(app, FrameworkType.EXPRESS);

// Generate documentation
generateDocumentation(
  endpoints,
  DocumentFormat.MARKDOWN,
  './docs/api.md',
  {
    title: 'My API',
    description: 'My awesome API documentation',
    version: '1.0.0',
    baseUrl: 'https://api.example.com'
  }
);
Supported Frameworks

Express.js: Automatically detects routes, router modules, and middleware.
NestJS: Extracts controller decorators, route handlers, and metadata.
Fastify: Analyzes route registrations and schema definitions.

Documentation Formats

Markdown: Clean, readable documentation perfect for GitHub and GitLab repositories.
HTML: Interactive HTML documentation with syntax highlighting and navigation.
Swagger/OpenAPI: Standard Swagger documentation for use with Swagger UI or Redoc.

CLI Commands
analyze
Analyzes your application and extracts API endpoints.
bashdocumenator analyze --framework express --path ./src/app.js --output ./api-endpoints.json
generate
Generates documentation from API endpoints.
bashdocumenator generate --input ./api-endpoints.json --output ./docs/api.md --format markdown
test
Tests API endpoints to ensure they work as documented.
bashdocumenator test --input ./api-endpoints.json --base-url http://localhost:3000
auto
All-in-one command to analyze, generate documentation, and optionally test.
bashdocumenator auto --path ./src/app.js --output-dir ./docs --doc-format all --test
Configuration
DocuMentor can be configured using command-line options or a configuration file.
Example configuration file (documenator.config.json):
json{
  "framework": "express",
  "path": "./src/app.js",
  "outputDir": "./docs",
  "docFormat": "all",
  "baseUrl": "http://localhost:3000",
  "title": "My API",
  "description": "Documentation for my awesome API",
  "version": "1.0.0",
  "test": true
}
Examples
Check out the examples directory for sample applications and documentation:

Express.js application
TypeScript application
Generated documentation examples

Contributing
Contributions are welcome! Please check out our contributing guidelines.