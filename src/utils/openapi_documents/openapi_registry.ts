/**
 * @file openapi_registry.ts
 * @description The registry is used to register paths to the openapi document.
 * It's a SINGLETON.
 */
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

/**
 * @description A The SINGLETON instance to register paths to the openapi document.
 */
const registry = new OpenAPIRegistry();

export { registry };
