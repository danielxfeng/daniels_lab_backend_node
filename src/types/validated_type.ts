/**
 * @file validated_type.ts
 * @description An adaptor that bridges Zod schemas and Express request types.
 * 
 * This module is used in `schema/schema_*.ts` files
 * to infer the types of `req.validated` based on Zod validation schemas.
 */

import { z, ZodTypeAny } from "zod";

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
type SchemaMap = Partial<Record<"body" | "query" | "params", ZodTypeAny>>;

// The type helpers for the validated request.

// To merge the all schemas from a schema map into a single type.
// { body: zodSchema, query: zodSchema } =>
// { id: string, name: string, ... }
type MergeInfer<S extends SchemaMap> = Flatten<{
  [K in keyof S]: S[K] extends ZodTypeAny ? z.infer<S[K]> : {};
}>;

// To flatten the merged type and original `req`, helper of `MergeInfer`.
// { body: { id: string, ... }, query: { name: string, ... } } =>
// { id: string, name: string, ... }
type Flatten<T> = { [K in keyof T]: T[K] };

// To add the validated prefix.
// { id: string, name: string, ... } =>
// { ...req, validated: { id: string, name: string, ... } }
type ValidatedReq<S extends SchemaMap> = Request & {
  validated: MergeInfer<S>;
};

/**
 * @summary Generate dynamic types for the validated requests.
 * @description After the request is validated, the validated data is attached to `req.validated`.
 * But the properties of `req.validated` are vary depending on different requests.
 * So a dynamic type is generated to represent the new req,
 * and help the TS compiler to infer the type of `req.validated`.
 * This tool is to generate the dynamic type in batch.
 */
type SchemaMapToValidated<T extends Record<string, SchemaMap>> = {
  [K in keyof T]: ValidatedReq<T[K]>;
};

export { sources };

export type { Source, SchemaMap, SchemaMapToValidated };
