"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseFormat = exports.HttpMethod = void 0;
/**
 * HTTP methods
 */
var HttpMethod;
(function (HttpMethod) {
    HttpMethod["GET"] = "GET";
    HttpMethod["POST"] = "POST";
    HttpMethod["PUT"] = "PUT";
    HttpMethod["DELETE"] = "DELETE";
    HttpMethod["PATCH"] = "PATCH";
    HttpMethod["HEAD"] = "HEAD";
    HttpMethod["OPTIONS"] = "OPTIONS";
})(HttpMethod || (exports.HttpMethod = HttpMethod = {}));
/**
 * Response formats
 */
var ResponseFormat;
(function (ResponseFormat) {
    ResponseFormat["JSON"] = "json";
    ResponseFormat["XML"] = "xml";
    ResponseFormat["TEXT"] = "text";
    ResponseFormat["HTML"] = "html";
    ResponseFormat["BINARY"] = "binary";
})(ResponseFormat || (exports.ResponseFormat = ResponseFormat = {}));
