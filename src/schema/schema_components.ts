/**
 * @file schema_components.ts
 * @description Some common schemas.
 */

import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

const DateTimeSchema = z
  .string()
  .trim()
  .datetime({ message: "Invalid date format" })
  .openapi({
    example: "2001-01-01T01:00:00Z",
    description: "ISO 8601 formatted date-time string",
    format: "date-time",
  });

const UUIDSchema = z
  .string()
  .trim()
  .toLowerCase()
  .uuid("Invalid UUID format")
  .openapi({
    example: "f4b44e61-8c6f-4534-b9bb-8dc8eab9f713",
    description: "A valid UUID v4 string",
  });

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

const ConsentSchema = z.literal(true).openapi({
  title: "Consent",
  example: true,
  description: "Must explicitly be `true` to give consent",
});

const OauthProviderValues = ["google", "github", "linkedin"] as const;

type OauthProvider = (typeof OauthProviderValues)[number];

const OauthProvidersSchema = z
  .enum(OauthProviderValues)
  .openapi({
    title: "OAuth Provider",
    example: "google",
  });

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

const OffsetOutputSchema = z.number().openapi({
  title: "Offset",
  description: "Offset for pagination",
  example: 10,
});

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

const LimitOutputSchema = z.number().openapi({
  title: "Limit",
  description: "Limit for pagination",
  example: 10,
});

const TotalOutputSchema = z.number().openapi({
  title: "Total",
  description: "Total number",
  example: 100,
});

const PostIdSchema = UUIDSchema.openapi({
  title: "PostIdParam",
  description: "Post ID parameter",
});

const PostSlugSchema = z
  .string()
  .min(1, "Slug is required")
  .openapi({
    title: "PostSlug",
    description: "Post Slug",
    example: "my-first-post",
  });

const CreateAtSchema = DateTimeSchema.optional().openapi({
  title: "CreateAt",
  description: "Creation date",
});

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

type PostIdQuery = z.infer<typeof PostIdQuerySchema>;

type PostSlugQuery = z.infer<typeof PostSlugQuerySchema>;

export type { PostIdQuery, PostSlugQuery, OauthProvider };
