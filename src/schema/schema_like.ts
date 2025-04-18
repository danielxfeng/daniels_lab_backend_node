/**
 * @file schema_like.ts
 * @description The definition of like DTOs.
 * This file contains the schemas for the parameters and responses of the like routes.
 */

import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { SchemaMapToValidated } from "../types/validated_type";
import { PostIdQuerySchema } from "./schema_components";

extendZodWithOpenApi(z);

//
// Response Schemas
//

/**
 * @summary Schema for the like status response.
 */
export const LikeStatusResponseSchema = z.object({
  count: z.number().int().nonnegative().openapi({
    title: "Like Count",
    example: 10,
    description: "The total number of likes for the post.",
  }),
  liked: z.boolean().openapi({
    title: "Liked Status",
    example: true,
    description:
      "Whether the current user has liked the post, always false for anonymous users.",
  }),
});

// Inferred the type

/**
 * @summary Schema Maps for like requests
 */
export const LikeReqSchemaMaps = {
  postId: { query: PostIdQuerySchema },
} as const;

/**
 * @summary Type for the validated like request
 */
type LikeValidatedReq = SchemaMapToValidated<typeof LikeReqSchemaMaps>;

/**
 * @summary Type for the like status response
 */
type LikeStatusResponse = z.infer<typeof LikeStatusResponseSchema>;

export type { LikeValidatedReq, LikeStatusResponse };
