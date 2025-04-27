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

import { ZodTypeAny } from "zod";
import { Request, Response, NextFunction } from "express";
import { terminateWithErr } from "../utils/terminate_with_err";

/**
 * @summary The source of the request parameters.
 * @description union of the possible sources of the request parameters.
 *
 * @remark
 * - `"body" | "query" | "params"`: `enum` like `union` as the key.
 *   1. This kind of union is often used as an `enum`.
 *   2. Unions can also include primitive types like `string | number | boolean`.
 *
 * - `literal`: In TypeScript, a literal is a specific, exact value of a type.
 *   1. For example, `1` is a number literal, and `"hello"` is a string literal.
 *   2. Literals can also be used as **types** in TypeScript.
 *   3. Just like `#define ONE 1` in C/C++.
 */
type Source = "body" | "query" | "params";

// The literal list of all sources, for iteration use
const sources: readonly Source[] = ["body", "query", "params"];

/**
 * @summary SchemaMap
 * @description The type of parameter schemas for the validation.
 * like `{ body: ZodTypeAny, query: ZodTypeAny, params: ZodTypeAny }`
 * or `{ body: ZodTypeAny }`, or `{ }`, etc.
 *
 * @remark
 * - `Record`: a data structure in TS like `hashmap`.
 *   1. The key is not a value, but an `union`.
 *   2. By default, it initializes a `hashmap` with all the keys.
 *   3. The keys are `literal` types.
 *
 * - `Partial`: then the properties optional,
 *    which means then the `Record` can be {} or with all 3 properties.
 *
 * - `ZodTypeAny`: the `Zod` schema.
 */
type SchemaMap = Partial<Record<Source, ZodTypeAny>>;

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
    // Use a `reduce` to aggregate the errors from all sources.
    const errors: Record<string, any> = sources.reduce(
      (acc: Record<string, any>, source: Source) => {
        // Skip the empty source.
        if (!schemas[source]) return acc;

        const schema = schemas[source];
        // Call `safeParse` in `zod` to validate the request data.
        // An 500 may be thrown during the validation.
        const result = schema.safeParse(req[source]);

        // Handle the validation error.
        if (!result.success)
          acc[source] = result.error.format();
        else {
          Object.assign((req as any)[source], result.data);
          console.log(`validated: ${JSON.stringify(req[source])}`);
        }

        return acc;
      },
      {} as Record<string, any>
    );

    // If there are errors, throw a 400 with the error message, and terminate the pipe.
    if (Object.keys(errors).length > 0)
      return terminateWithErr(400, "Request validation failed", errors);

    // Go next if no errors.
    next();
  };

export default validate;

export type { SchemaMap };
