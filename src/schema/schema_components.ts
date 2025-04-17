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
  .datetime({ message: "Invalid date format" })
  .openapi({
    example: "2001-01-01T01:00:00Z",
    description: "ISO 8601 formatted date-time string",
  });

/**
 * @summary UUID schema requires a valid UUID format.
 */
const UUIDSchema = z.string().uuid("Invalid UUID format").openapi({
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
  .min(3)
  .max(16)
  .regex(/^[a-zA-Z0-9._-]+$/, {
    message:
      "Username must contain only letters, numbers, dots, hyphens, or underscores",
  })
  .openapi({
    example: "john_doe-99",
    description: "3–16 characters, only a-z, 0-9, dots, hyphens, underscores",
  });

/**
 * @summary A legal avatar URL should be:
 * - Valid URL
 * - 15–200 characters long
 * - Must start with https://
 */
const AvatarUrlSchema = z
  .string()
  .url()
  .min(15)
  .max(200)
  .refine((url) => url.startsWith("https://"), {
    message: "Avatar URL must start with https://",
  })
  .openapi({
    example: "https://example.com/avatar.png",
    description: "Must be a valid https:// URL",
  });

/**
 * @summary Consent to terms and conditions
 * - Must be true
 */
const ConsentSchema = z.literal(true).openapi({
  example: true,
  description: "Must explicitly be `true` to give consent",
});

/**
 * @summary OAuth providers schema
 * - Either 'google' or 'github'
 */
const OauthProvidersSchema = z.enum(["google", "github"]).openapi({
  example: "google",
  description: "OAuth provider: google or github",
});

export {
  DateTimeSchema,
  UUIDSchema,
  UsernameSchema,
  AvatarUrlSchema,
  ConsentSchema,
  OauthProvidersSchema,
};
