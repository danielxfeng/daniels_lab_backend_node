/**
 * @file schema_auth.ts
 * @description Schemas for auth-related requests using Zod.
 */

import { z, ZodTypeAny } from "zod";
import {
  DateTimeSchema,
  UUIDSchema,
  UsernameSchema,
  AvatarUrlSchema,
  ConsentSchema,
  OauthProvidersSchema,
} from "./schema_components";

import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);
//
// Schema components
//

/**
 * @summary A legal password should be:
 * - 8-20 characters long
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * - No spaces
 */
const passwordSchema = z
  .string()
  .trim()
  .min(8)
  .max(20)
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
    "Password must include uppercase, lowercase, number and special character"
  )
  .openapi({
    title: "Password",
    example: "Password1$",
    description:
      "8-20 characters with uppercase, lowercase, number, special char",
  });

/**
 * @summary We validate the password confirmation in PasswordConfirmationSchema
 */
const confirmPasswordSchema = z.string().trim().openapi({
  title: "Confirm Password",
  example: "Password1$",
  description: "Should match the password",
});

/**
 * @summary A legal token should be:
 * - minimum 20 characters long
 */
const tokenSchema = z.string().trim().min(20).openapi({
  title: "Token",
  example: "aaa...",
  description: "JWT token",
});

/**
 * @summary A password confirmation schema
 * - Validates that the password and confirmPassword fields match
 * @param schema - The schema to refine.
 * The schema must be a ZodTypeAny and should have an input type of
 * { password: string; confirmPassword: string }.
 * @returns A refined schema
 */
const passwordConfirmationSchema = <
  T extends ZodTypeAny &
    z.ZodType<{ password: string; confirmPassword: string }>
>(
  schema: T
) => {
  return schema.refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
};

//
// Request Schemas
//

/**
 * @summary Register a new user, including:
 * - username, password, confirmPassword, consent, and consentAt
 * - Optional avatarUrl
 */
const RegisterBodySchema = passwordConfirmationSchema(
  z.object({
    username: UsernameSchema,
    password: passwordSchema,
    confirmPassword: confirmPasswordSchema,
    avatarUrl: AvatarUrlSchema.optional(),
    consent: ConsentSchema,
    consentAt: DateTimeSchema,
  })
);

/**
 * @summary Login with username and password, including:
 * username and password
 */
const LoginBodySchema = z.object({
  username: UsernameSchema,
  password: passwordSchema,
});

/**
 * @summary Change user password, including:
 * currentPassword, password, and confirmPassword
 */
const ChangePasswordBodySchema = passwordConfirmationSchema(
  z.object({
    currentPassword: passwordSchema,
    password: passwordSchema,
    confirmPassword: confirmPasswordSchema,
  })
);

/**
 * @summary Refresh token body including refreshToken
 */
const RefreshTokenBodySchema = z.object({
  refreshToken: tokenSchema,
  deviceId: z
    .string()
    .trim()
    .min(16)
    .max(128)
    .regex(/^[a-fA-F0-9]+$/, "Invalid device ID")
    .openapi({
      example: "a2e917f6c49cfb127fb28cd8e8d8cf59",
      description: "Device ID",
    }),
});

/**
 * @summary Join admin schema including referenceCode
 */
const JoinAdminBodySchema = z.object({
  referenceCode: z
    .string()
    .trim()
    .uuid("Invalid reference code format")
    .openapi({
      example: "aaa...",
      description: "Invitation code to join as admin",
    }),
});

/**
 * @summary OAuth param initiating provider
 */
const OAuthProviderParamSchema = z.object({
  provider: OauthProvidersSchema,
});

/**
 * @summary Oauth consent query including consent
 */
const OAuthConsentQuerySchema = z.object({
  consent: ConsentSchema,
});

//
// Response Schemas
//

/**
 * @summary Schema for the authentication response, including:
 * - accessToken, refreshToken, id, username, avatarUrl, and isAdmin
 */
const AuthResponseSchema = z.object({
  accessToken: tokenSchema,
  refreshToken: tokenSchema,
  id: UUIDSchema,
  username: UsernameSchema,
  avatarUrl: AvatarUrlSchema.nullable(),
  isAdmin: z.boolean().openapi({
    title: "IsAdmin",
    example: false,
    description: "Is an admin user?",
  }),
});

/**
 * @summary Schema for the token refresh response
 */
const TokenRefreshResponseSchema = z.object({
  accessToken: tokenSchema,
  refreshToken: tokenSchema,
});

export {
  RegisterBodySchema,
  LoginBodySchema,
  ChangePasswordBodySchema,
  RefreshTokenBodySchema,
  OAuthProviderParamSchema,
  OAuthConsentQuerySchema,
  JoinAdminBodySchema,
  AuthResponseSchema,
  TokenRefreshResponseSchema,
};

//
// Inferred Types
//

type RegisterBody = z.infer<typeof RegisterBodySchema>;
type LoginBody = z.infer<typeof LoginBodySchema>;
type ChangePasswordBody = z.infer<typeof ChangePasswordBodySchema>;
type RefreshTokenBody = z.infer<typeof RefreshTokenBodySchema>;
type JoinAdminBody = z.infer<typeof JoinAdminBodySchema>;
type OAuthProviderParam = z.infer<typeof OAuthProviderParamSchema>;
type OAuthConsentQuery = z.infer<typeof OAuthConsentQuerySchema>;

type AuthResponse = z.infer<typeof AuthResponseSchema>;
type TokenRefreshResponse = z.infer<typeof TokenRefreshResponseSchema>;

export type {
  RegisterBody,
  LoginBody,
  ChangePasswordBody,
  RefreshTokenBody,
  JoinAdminBody,
  OAuthProviderParam,
  OAuthConsentQuery,
  AuthResponse,
  TokenRefreshResponse,
};
