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
exports.parseRouteParams = parseRouteParams;
exports.readFile = readFile;
exports.findFiles = findFiles;
exports.extractComments = extractComments;
exports.extractExpressRoutes = extractExpressRoutes;
exports.extractNestDecorators = extractNestDecorators;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const logger_1 = require("./logger");
/**
 * Parses route parameters from a path string.
 * @param path Route path
 * @returns Array of parameter names
 */
function parseRouteParams(path) {
    const params = [];
    const regex = /:([a-zA-Z0-9_]+)/g;
    let match;
    while ((match = regex.exec(path)) !== null) {
        params.push(match[1]);
    }
    // Also handle Express.js style {paramName} format
    const bracketRegex = /{([a-zA-Z0-9_]+)}/g;
    while ((match = bracketRegex.exec(path)) !== null) {
        params.push(match[1]);
    }
    return params;
}
/**
 * Reads and parses a JavaScript or TypeScript file.
 * @param filePath Path to the file
 * @returns File content as string
 */
function readFile(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8');
    }
    catch (error) {
        logger_1.logger.error(`Error reading file ${filePath}:`, error);
        throw error;
    }
}
/**
 * Finds all files matching a pattern in a directory.
 * @param dir Directory path
 * @param extensions File extensions to include
 * @param recursive Whether to search subdirectories
 * @returns Array of file paths
 */
function findFiles(dir, extensions = ['.js', '.ts'], recursive = true) {
    try {
        if (!fs.existsSync(dir)) {
            logger_1.logger.warn(`Directory does not exist: ${dir}`);
            return [];
        }
        const files = [];
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory() && recursive) {
                // Recursively search subdirectories
                files.push(...findFiles(fullPath, extensions, recursive));
            }
            else if (entry.isFile()) {
                // Check if file extension matches
                const ext = path.extname(entry.name);
                if (extensions.includes(ext)) {
                    files.push(fullPath);
                }
            }
        }
        return files;
    }
    catch (error) {
        logger_1.logger.error(`Error finding files in ${dir}:`, error);
        throw error;
    }
}
/**
 * Extracts JSDoc or similar comments from a file.
 * @param content File content
 * @returns Object mapping function names to comment strings
 */
function extractComments(content) {
    const comments = {};
    // Match JSDoc style comments
    const regex = /\/\*\*([\s\S]*?)\*\/\s*(?:export\s+)?(?:async\s+)?(?:function\s+|const\s+|let\s+|var\s+)?([a-zA-Z0-9_$]+)/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
        const comment = match[1]
            .replace(/^\s*\*/gm, '') // Remove * at the start of lines
            .trim();
        const funcName = match[2];
        comments[funcName] = comment;
    }
    return comments;
}
/**
 * Extracts router definitions from an Express.js file.
 * @param content File content
 * @returns Array of router definitions
 */
function extractExpressRoutes(content) {
    const routes = [];
    // Match router.METHOD patterns
    const routerRegex = /(?:router|app)[.](get|post|put|delete|patch|head|options)\s*\(\s*['"]([^'"]+)['"]\s*,\s*(?:.*?)?([a-zA-Z0-9_$]+)\s*(?:,|\))/g;
    let match;
    while ((match = routerRegex.exec(content)) !== null) {
        routes.push({
            method: match[1].toUpperCase(),
            path: match[2],
            handlerName: match[3]
        });
    }
    return routes;
}
/**
 * Extracts NestJS decorators from a file.
 * @param content File content
 * @returns Object with controller and route information
 */
function extractNestDecorators(content) {
    const result = {
        routes: []
    };
    // Match @Controller decorator
    const controllerRegex = /@Controller\s*\(\s*['"]([^'"]*)['"]\s*\)\s*(?:export\s+)?class\s+([a-zA-Z0-9_$]+)/;
    const controllerMatch = controllerRegex.exec(content);
    if (controllerMatch) {
        result.controller = {
            path: controllerMatch[1],
            name: controllerMatch[2]
        };
    }
    // Match route decorators
    const routeRegex = /@(Get|Post|Put|Delete|Patch|Options|Head)\s*\(\s*['"]([^'"]*)['"]\s*\)\s*(?:async\s+)?([a-zA-Z0-9_$]+)/g;
    let match;
    while ((match = routeRegex.exec(content)) !== null) {
        result.routes.push({
            method: match[1].toUpperCase(),
            path: match[2],
            handlerName: match[3]
        });
    }
    return result;
}
