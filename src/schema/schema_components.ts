/**
 * @file schema_components.ts
 * @description Some common schemas.
 */

import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

/**
 * @summary DateTime schema requires a valid date time format.
 */
const DateTimeSchema = z
  .string()
  .trim()
  .datetime({ message: "Invalid date format" })
  .openapi({
    example: "2001-01-01T01:00:00Z",
    description: "ISO 8601 formatted date-time string",
    format: "date-time",
  });

/**
 * @summary UUID schema requires a valid UUID format.
 */
const UUIDSchema = z
  .string()
  .trim()
  .toLowerCase()
  .uuid("Invalid UUID format")
  .openapi({
    example: "f4b44e61-8c6f-4534-b9bb-8dc8eab9f713",
    description: "A valid UUID v4 string",
  });

/**
 * @summary A legal username should be:
 * - 3–16 characters
 * - Letters, numbers, dots, hyphens, or underscores
 */
const UsernameSchema = z
  .string()
  .trim()
  .min(3)
  .max(16)
  .regex(/^[a-zA-Z0-9._-]+$/, {
    message:
      "Username must contain only letters, numbers, dots, hyphens, or underscores",
  })
  .openapi({
    title: "Username",
    example: "john_doe-99",
    description: "3–16 characters, only a-z, 0-9, dots, hyphens, underscores",
  });

/**
 * @summary A legal URL should be:
 * - Valid URL
 * - 15–200 characters long
 * - Must start with https://
 */
const UrlSchema = z
  .string()
  .trim()
  .url()
  .min(15)
  .max(200)
  .refine((url) => url.startsWith("https://"), {
    message: " URL must start with https://",
  })
  .openapi({
    title: "Avatar URL",
    example: "https://example.com/url.png",
    description: "Must be a valid https:// URL",
  });

/**
 * @summary Consent to terms and conditions
 * - Must be true
 */
const ConsentSchema = z.literal(true).openapi({
  title: "Consent",
  example: true,
  description: "Must explicitly be `true` to give consent",
});

/**
 * @summary OAuth providers
 */
const OauthProviderValues = ["google", "github", "linkedin"] as const;

/**
 * @summary OAuth provider type
 */
type OauthProvider = (typeof OauthProviderValues)[number];


/**
 * @summary OAuth providers schema
 * - Either 'google' or 'github'
 */
const OauthProvidersSchema = z
  .enum(OauthProviderValues)
  .openapi({
    title: "OAuth Provider",
    example: "google",
  });

/**
 * @summary A legal offset should be:
 * - 0 or greater
 * - Default is 0
 * - Used for pagination
 */
const OffsetSchema = z
  .string()
  .trim()
  .optional()
  .transform((val) => {
    const parsed = Number(val || "0");
    return parsed;
  })
  .refine((val) => Number.isInteger(val) && val >= 0, {
    message: "Offset must be an integer and >= 0",
  })
  .openapi({
    title: "Offset",
    description: "Offset for pagination, default is 0",
    example: "0",
  });

/**
 * @summary A output offset
 */
const OffsetOutputSchema = z.number().openapi({
  title: "Offset",
  description: "Offset for pagination",
  example: 10,
});

/**
 * @summary A legal limit should be:
 * - 1-50
 * - Default is 10
 * - Used for pagination
 */
const LimitSchema = z
  .string()
  .trim()
  .optional()
  .transform((val) => {
    const parsed = Number(val || "10");
    return parsed;
  })
  .refine((val) => Number.isInteger(val) && val > 0 && val <= 50, {
    message: "Limit must be an integer and between 1 and 50",
  })
  .openapi({
    title: "Limit",
    description: "Number of comments per page, max 50",
    example: "10",
  });

/**
 * @summary A output limit
 */
const LimitOutputSchema = z.number().openapi({
  title: "Limit",
  description: "Limit for pagination",
  example: 10,
});

/**
 * @summary A output total
 */
const TotalOutputSchema = z.number().openapi({
  title: "Total",
  description: "Total number",
  example: 100,
});

/**
 * @summary Post ID schema
 * - Must be a valid UUID
 */
const PostIdSchema = UUIDSchema.openapi({
  title: "PostIdParam",
  description: "Post ID parameter",
});

/**
 * @summary Post Slug schema
 * - Slug is required
 */
const PostSlugSchema = z
  .string()
  .min(1, "Slug is required")
  .openapi({
    title: "PostSlug",
    description: "Post Slug",
    example: "my-first-post",
  });

/**
 * @summary CreateAt schema
 * - Optional date time
 * - Used for creation date
 */
const CreateAtSchema = DateTimeSchema.optional().openapi({
  title: "CreateAt",
  description: "Creation date",
});

/**
 * @summary UpdateAt schema
 * - Optional date time
 * - Used for update date
 */
const UpdateAtSchema = DateTimeSchema.optional().openapi({
  title: "UpdateAt",
  description: "Updating date",
});

const PostIdQuerySchema = z.object({
  postId: PostIdSchema,
});

const PostSlugQuerySchema = z.object({
  slug: PostSlugSchema,
});

const AuthorIdSchema = UUIDSchema.openapi({
  title: "AuthorId",
  description: "Author ID",
});

export {
  DateTimeSchema,
  UUIDSchema,
  UsernameSchema,
  UrlSchema,
  ConsentSchema,
  OauthProvidersSchema,
  PostIdSchema,
  PostSlugSchema,
  OffsetSchema,
  OffsetOutputSchema,
  LimitSchema,
  LimitOutputSchema,
  CreateAtSchema,
  UpdateAtSchema,
  PostIdQuerySchema,
  PostSlugQuerySchema,
  TotalOutputSchema,
  AuthorIdSchema,
  OauthProviderValues
};

//
// Inferred types
//

/**
 * @summary Schema for the post ID parameter
 */
type PostIdQuery = z.infer<typeof PostIdQuerySchema>;

/**
 * @summary Schema for the post slug parameter
 */
type PostSlugQuery = z.infer<typeof PostSlugQuerySchema>;

export type { PostIdQuery, PostSlugQuery, OauthProvider };
