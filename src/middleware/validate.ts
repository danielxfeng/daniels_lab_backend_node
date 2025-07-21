/**
 * @file validate.ts
 * @description Middleware to validate request data using Zod schemas.
 */

import { ZodTypeAny } from "zod";
import { Request, Response, NextFunction } from "express";
import { terminateWithErr } from "../utils/terminate_with_err";
import { AuthRequest } from "../types/type_auth";

type Source = "body" | "query" | "params";

const sources: readonly Source[] = ["body", "query", "params"];

type SchemaMap = Partial<Record<Source, ZodTypeAny>>;

/**
 * @summary Middleware to validate request data using Zod schemas.
 */
const validate =
  (schemas: SchemaMap) => (req: Request, res: Response, next: NextFunction) => {
    // Use a `reduce` to aggregate the errors from all sources.
    const errors: Record<string, any> = sources.reduce(
      (acc: Record<string, any>, source: Source) => {
        if (!schemas[source]) return acc;

        const schema = schemas[source];
        const result = schema.safeParse(req[source]);

        if (!result.success) acc[source] = result.error.format();
        else {
          (req as AuthRequest).locals = (req as AuthRequest).locals || {};
          (req as AuthRequest).locals![source] = {
            ...req[source],
            ...result.data,
          };
        }

        return acc;
      },
      {} as Record<string, any>
    );

    if (Object.keys(errors).length > 0)
      return terminateWithErr(400, "Request validation failed", errors);

    next();
  };

export default validate;

export type { SchemaMap };
