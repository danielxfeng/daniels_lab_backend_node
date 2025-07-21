/**
 * @file schema_auth.ts
 * @description Schemas for auth-related requests using Zod.
 */

import { string, z, ZodTypeAny } from "zod";
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
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])(?!.*\s).+$/,
    "Password must include uppercase, lowercase, number and special character"
  )
  .openapi({
    title: "Password",
    example: "Password1$",
    description:
      "8-20 characters with uppercase, lowercase, number, special char",
  });

const confirmPasswordSchema = z.string().trim().openapi({
  title: "Confirm Password",
  example: "Password1$",
  description: "Should match the password",
});

const tokenSchema = z.string().trim().min(20).openapi({
  title: "Token",
  example: "aaa...",
  description: "JWT token",
});

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

const RegisterBodySchema = passwordConfirmationSchema(
  z.object({
    username: UsernameSchema,
    password: passwordSchema,
    confirmPassword: confirmPasswordSchema,
    consentAt: consentAtSchema,
    deviceId: deviceIdSchema,
  })
);

const LoginBodySchema = z.object({
  username: UsernameSchema,
  password: passwordSchema,
  deviceId: deviceIdSchema,
});

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
);

const RefreshTokenBodySchema = z.object({
  refreshToken: tokenSchema,
  deviceId: deviceIdSchema,
});

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

const OAuthProviderParamSchema = z.object({
  provider: OauthProvidersSchema,
});

const OAuthConsentQuerySchema = z.object({
  consentAt: consentAtSchema,
  deviceId: deviceIdSchema,
  redirectTo: string().trim().openapi({
    title: "Redirect To",
    example: "/",
    description: "URL to redirect after OAuth pipeline",
  }),
});

const DeviceIdBodySchema = z.object({
  deviceId: deviceIdSchema.optional(),
});

const UserNameBodySchema = z.object({
  username: UsernameSchema,
});

const OauthStateSchema = z.object({
  userId: UUIDSchema.optional().nullable(),
  deviceId: deviceIdSchema,
  consentAt: consentAtSchema,
  redirectTo: string().trim(),
});

const OauthUserInfoSchema = z.object({
  provider: OauthProvidersSchema,
  id: z.string().trim(),
  avatar: UrlSchema.optional(),
});

const DeviceIdQuerySchema = z.object({
  deviceId: deviceIdSchema,
});

//
// Response Schemas
//

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
  hasPassword: z.boolean().openapi({
    title: "Has Password",
    example: true,
    description: "Does the user have a password set?",
  }),
});

const TokenRefreshResponseSchema = z.object({
  accessToken: tokenSchema,
  refreshToken: tokenSchema,
});

const OAuthRedirectResponseSchema = z.object({
  redirectUrl: string().trim().openapi({
    title: "Redirect URL",
    example: "https://example.com/oauth?state=abc123",
    description: "URL to redirect after OAuth pipeline",
  }),
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
  OAuthRedirectResponseSchema,
};

//
// Inferred Types
//

type RegisterBody = z.infer<typeof RegisterBodySchema>;

type LoginBody = z.infer<typeof LoginBodySchema>;

type ChangePasswordBody = z.infer<typeof ChangePasswordBodySchema>;

type SetPasswordBody = z.infer<typeof SetPasswordBodySchema>;

type RefreshTokenBody = z.infer<typeof RefreshTokenBodySchema>;

type JoinAdminBody = z.infer<typeof JoinAdminBodySchema>;

type OAuthProviderParam = z.infer<typeof OAuthProviderParamSchema>;

type OAuthConsentQuery = z.infer<typeof OAuthConsentQuerySchema>;

type AuthResponse = z.infer<typeof AuthResponseSchema>;

type TokenRefreshResponse = z.infer<typeof TokenRefreshResponseSchema>;

type DeviceIdBody = z.infer<typeof DeviceIdBodySchema>;

type UserNameBody = z.infer<typeof UserNameBodySchema>;

type DeviceIdQuery = z.infer<typeof DeviceIdQuerySchema>;

type OauthState = z.infer<typeof OauthStateSchema>;

type OauthUserInfo = z.infer<typeof OauthUserInfoSchema>;

type OAuthRedirectResponse = z.infer<typeof OAuthRedirectResponseSchema>;

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
  OAuthRedirectResponse,
};
