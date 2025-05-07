/**
 * @file schema_auth.ts
 * @description Schemas for auth-related requests using Zod.
 */

import { z, ZodTypeAny } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import {
  DateTimeSchema,
  UUIDSchema,
  UsernameSchema,
  UrlSchema,
  OauthProvidersSchema,
} from "./schema_components";

extendZodWithOpenApi(z);
//
// Schema components
//

// Device ID schema
const deviceIdSchema = z
  .string()
  .trim()
  .min(16)
  .max(128)
  .regex(/^[a-fA-F0-9]+$/, "Invalid device ID")
  .openapi({
    example: "a2e917f6c49cfb127fb28cd8e8d8cf59",
    description: "Device ID",
  });

/**
 * @summary A legal username should be:
 * - DateTime in ISO 8601 format
 * - Cannot be in the future
 */
const consentAtSchema = DateTimeSchema.refine(
  (val) => new Date(val) <= new Date(),
  { message: "consentAt cannot be in the future" }
).openapi({
  title: "Consent At",
  example: "2023-01-01T00:00:00Z",
  description: "Date and time when the user consented to the terms",
});

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
 * - username, password, confirmPassword, consentAt, and deviceId
 * - Optional avatarUrl
 */
const RegisterBodySchema = passwordConfirmationSchema(
  z.object({
    username: UsernameSchema,
    password: passwordSchema,
    confirmPassword: confirmPasswordSchema,
    avatarUrl: UrlSchema.optional(),
    consentAt: consentAtSchema,
    deviceId: deviceIdSchema,
  })
);

/**
 * @summary Login with username and password, including:
 * username, password, and deviceId
 */
const LoginBodySchema = z.object({
  username: UsernameSchema,
  password: passwordSchema,
  deviceId: deviceIdSchema,
});

/**
 * @summary Change user password, including:
 * currentPassword, password, confirmPassword, and deviceId
 */
const ChangePasswordBodySchema = passwordConfirmationSchema(
  z.object({
    currentPassword: passwordSchema,
    password: passwordSchema,
    confirmPassword: confirmPasswordSchema,
    deviceId: deviceIdSchema,
  })
).refine((data) => data.currentPassword !== data.password, {
  message: "New password must be different from current password",
  path: ["password"],
});

const SetPasswordBodySchema = passwordConfirmationSchema(
  z.object({
    password: passwordSchema,
    confirmPassword: confirmPasswordSchema,
    deviceId: deviceIdSchema,
  })
)

/**
 * @summary Refresh token body including refreshToken
 */
const RefreshTokenBodySchema = z.object({
  refreshToken: tokenSchema,
  deviceId: deviceIdSchema,
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
  deviceId: deviceIdSchema,
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
  consentAt: consentAtSchema,
  deviceId: deviceIdSchema,
});

/**
 * @summary Device ID body
 */
const DeviceIdBodySchema = z.object({
  deviceId: deviceIdSchema.optional(),
});

/**
 * @summary User name body
 */
const UserNameBodySchema = z.object({
  username: UsernameSchema,
});

/**
 * @summary The schema for the OAuth state
 */
const OauthStateSchema = z.object({
  userId: UUIDSchema.optional().nullable(),
  deviceId: deviceIdSchema,
  consentAt: consentAtSchema,
});

/**
 * @summary The schema for the OAuth user info
 * - provider: The OAuth provider (e.g., Google, GitHub)
 * - id: The unique ID of the user in the provider's system
 * - avatar: The URL of the user's avatar image
 */
const OauthUserInfoSchema = z.object({
  provider: OauthProvidersSchema,
  id: z.string().trim(),
  avatar: UrlSchema.optional(),
});

/**
 * @summary The schema for the OAuth user info
 * - provider: The OAuth provider (e.g., Google, GitHub)
 */
const DeviceIdQuerySchema = z.object({
  deviceId: deviceIdSchema,
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
  avatarUrl: UrlSchema.nullable(),
  isAdmin: z.boolean().openapi({
    title: "IsAdmin",
    example: false,
    description: "Is an admin user?",
  }),
  oauthProviders: OauthProvidersSchema.array(),
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
  SetPasswordBodySchema,
  DeviceIdBodySchema,
  UserNameBodySchema,
  DeviceIdQuerySchema,
  OauthStateSchema,
  OauthUserInfoSchema,
  AuthResponseSchema,
  TokenRefreshResponseSchema,
};

//
// Inferred Types
//

/**
 * @summary Schema for body parameters of registering a new user
 */
type RegisterBody = z.infer<typeof RegisterBodySchema>;

/**
 * @summary Schema for body parameters of logging in
 */
type LoginBody = z.infer<typeof LoginBodySchema>;

/**
 * @summary Schema for body parameters of changing password
 */
type ChangePasswordBody = z.infer<typeof ChangePasswordBodySchema>;

/**
 * @summary Schema for body parameters of setting password
 */
type SetPasswordBody = z.infer<typeof SetPasswordBodySchema>;

/**
 * @summary Schema for body parameters of refreshing token
 */
type RefreshTokenBody = z.infer<typeof RefreshTokenBodySchema>;

/**
 * @summary Schema for body parameters of joining admin
 */
type JoinAdminBody = z.infer<typeof JoinAdminBodySchema>;

/**
 * @summary Schema for OAuth provider parameters
 */
type OAuthProviderParam = z.infer<typeof OAuthProviderParamSchema>;

/**
 * @summary Schema for OAuth consent query parameters
 */
type OAuthConsentQuery = z.infer<typeof OAuthConsentQuerySchema>;

/**
 * @summary Schema for the auth response
 */
type AuthResponse = z.infer<typeof AuthResponseSchema>;

/**
 * @summary Schema for the token refresh response
 */
type TokenRefreshResponse = z.infer<typeof TokenRefreshResponseSchema>;

/**
 * @summary Schema for the device ID body
 */
type DeviceIdBody = z.infer<typeof DeviceIdBodySchema>;

/**
 * @summary Schema for the user name body
 */
type UserNameBody = z.infer<typeof UserNameBodySchema>;

/**
 * @summary Schema for the device ID query
 */
type DeviceIdQuery = z.infer<typeof DeviceIdQuerySchema>;

/**
 * @summary Schema for the OAuth state
 */
type OauthState = z.infer<typeof OauthStateSchema>;

/**
 * @summary Schema for the OAuth user info
 */
type OauthUserInfo = z.infer<typeof OauthUserInfoSchema>;

export type {
  RegisterBody,
  LoginBody,
  ChangePasswordBody,
  RefreshTokenBody,
  JoinAdminBody,
  OAuthProviderParam,
  OAuthConsentQuery,
  DeviceIdBody,
  UserNameBody,
  SetPasswordBody,
  DeviceIdQuery,
  OauthState,
  OauthUserInfo,
  AuthResponse,
  TokenRefreshResponse,
};
