/**
 * @file validate.ts
 * @description Middleware to validate request data using Zod schemas.
 *
 * @remark
 * - A middleware in Express is a closure function.
 * 1. It takes `req`, `res`, and `next` as parameters.
 * 2. Then the middleware can terminate the pipeline by throwing an error
 *    which will be caught by error handling middleware defined in `app.ts`.
 * 3. Or it will pass the request to next node in the pipeline.
 * 4. It can also have side effects like modifying the request or response.
 */

import { Request, Response, NextFunction } from "express";
import { SchemaMap } from "../types/validated_type";
import { terminateWithErr } from "../utils/terminate_with_err";

/**
 * @summary Middleware to validate request data using Zod schemas.
 * @description This middleware checks the request parameters
 * from `body`, `query`, and `params` by given `zod schemas`.
 * Sends 400 if validation fails, or 500 if an internal error occurs.
 * Otherwise, it attaches the validated data to `req.validated` for further use.
 *
 * @param {SchemaMap} schemas - The schemas to validate against.
 * @returns {Function} Middleware function to validate request data.
 * @throws {Error} Will throw with `.status = 400` or `500` if validation fails.
 */
const validate =
  (schemas: SchemaMap) => (req: Request, res: Response, next: NextFunction) => {
    // The result of the validation.
    const validated: Record<string, any> = {};

    // Iterate over the schemas and validate each one.
    for (const source of ["body", "query", "params"] as const) {
      const schema = schemas[source];
      // Skips if the schema is not defined.
      if (!schema) continue;

      // Call `safeParse` in `zod` to validate the request data.
      // An 500 may be thrown during the validation.
      const result = schema.safeParse(req[source]);

      // Handle the validation error.
      // throw a 400 with the error message.
      if (!result.success) {
        terminateWithErr(
          400,
          `Validation failed for ${source}: ${result.error.message}`,
          result.error.format()
        );
      }

      // If success, assign the validated data to the validated object.
      Object.assign(validated, result.data);
    }

    req.validated = validated;
    next();
  };

export default validate;
