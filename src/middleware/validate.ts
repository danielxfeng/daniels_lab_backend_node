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

import { z, ZodTypeAny } from "zod";
import { Request, Response, NextFunction } from "express";

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
 * - `"body" | "query" | "params"`: `enum` like `union` as the key.
 *   1. This kind of union is often used as an `enum`.
 *   2. Unions can also include primitive types like `string | number | boolean`.
 *
 * - `literal`: In TypeScript, a literal is a specific, exact value of a type.
 *   1. For example, `1` is a number literal, and `"hello"` is a string literal.
 *   2. Literals can also be used as **types** in TypeScript.
 *   3. Just like `#define ONE 1` in C/C++.
 *
 * - `Partial`: then the properties optional,
 *    which means then the `Record` can be {} or with all 3 properties.
 *
 * - `ZodTypeAny`: the `Zod` schema.
 */
type SchemaMap = Partial<Record<"body" | "query" | "params", ZodTypeAny>>;

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
        const error = new Error(
          `Validation failed for ${source}: ${result.error.message}`
        );
        (error as any).status = 400;
        (error as any).errors = result.error.format();
        throw error;
      }

      // If success, assign the validated data to the validated object.
      Object.assign(validated, result.data);
    }

    req.validated = validated;
    next();
  };

export default validate;

type MergeInfer<S extends SchemaMap> = Simplify<{
  [K in keyof S]: S[K] extends ZodTypeAny ? z.infer<S[K]> : {};
}>;

type Simplify<T> = { [K in keyof T]: T[K] };

/**
 * @summary Generate a dynamic type for the validated request.
 * @description After the request is validated, the validated data is attached to `req.validated`.
 * But the properties of `req.validated` are vary depending on different requests.
 * So a dynamic type is generated to represent the new req,
 * and help the TS compiler to infer the type of `req.validated`.
 */
type ValidatedReq<S extends SchemaMap> = Request & {
  validated: MergeInfer<S>;
};

export { validate };

export type { SchemaMap, ValidatedReq };
