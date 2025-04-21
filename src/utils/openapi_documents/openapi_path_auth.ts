/**
 * @file openapi_path_auth.ts
 * @description The path definitions for auth-related endpoints.
 */

import {
  RegisterBodySchema,
  LoginBodySchema,
  ChangePasswordBodySchema,
  RefreshTokenBodySchema,
  OAuthProviderParamSchema,
  OAuthConsentQuerySchema,
  JoinAdminBodySchema,
  AuthResponseSchema,
  TokenRefreshResponseSchema,
  DeviceIdBodySchema,
} from "../../schema/schema_auth";

import { registry } from "./openapi_registry";

// POST /api/auth/register - Register a new user
registry.registerPath({
  method: "post",
  path: "/api/auth/register",
  summary: "Register a new user",
  tags: ["Auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: RegisterBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "User registered successfully",
      content: {
        "application/json": {
          schema: AuthResponseSchema,
        },
      },
    },
    400: { description: "Invalid input" },
    409: { description: "Username already exists" },
    500: { description: "Internal server error" },
  },
});

// POST /api/auth/login - Login a user
registry.registerPath({
  method: "post",
  path: "/api/auth/login",
  summary: "Login a user",
  tags: ["Auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: LoginBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Login successful",
      content: {
        "application/json": {
          schema: AuthResponseSchema,
        },
      },
    },
    401: { description: "Invalid credentials" },
    500: { description: "Internal server error" },
  },
});

// POST /api/auth/change-password - Change user password
registry.registerPath({
  method: "post",
  path: "/api/auth/change-password",
  summary: "Change user password",
  tags: ["Auth"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: ChangePasswordBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Password changed successfully",
      content: {
        "application/json": {
          schema: AuthResponseSchema,
        },
      },
    },
    400: { description: "Invalid input" },
    401: { description: "Unauthorized or current password incorrect" },
    498: { description: "Access token expired" },
    500: { description: "Internal server error" },
  },
});

// POST /api/auth/refresh - Refresh access token
registry.registerPath({
  method: "post",
  path: "/api/auth/refresh",
  summary: "Refresh access token",
  description: "Refresh access token using refresh token",
  tags: ["Auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: RefreshTokenBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Refreshed access token",
      content: {
        "application/json": {
          schema: TokenRefreshResponseSchema,
        },
      },
    },
    403: { description: "Invalid or expired refresh token" },
    500: { description: "Internal server error" },
  },
});

// PUT /api/auth/join-admin - Join admin role
registry.registerPath({
  method: "put",
  path: "/api/auth/join-admin",
  summary: "Join admin role",
  description:
    "Join admin role using reference code, be sure you have a valid code",
  tags: ["Auth"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: JoinAdminBodySchema,
        },
      },
    },
  },
  responses: {
    200: { description: "Joined admin role successfully" },
    401: { description: "Unauthorized" },
    403: { description: "Invalid reference code" },
    498: { description: "Access token expired" },
    500: { description: "Internal server error" },
  },
});

// POST /auth/logout - Logout a user
registry.registerPath({
  method: "post",
  path: "/api/auth/logout",
  summary: "Logout a user",
  description: "Logout a user and invalidate the refresh token",
  tags: ["Auth"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: DeviceIdBodySchema,
        },
      },
    },
  },
  responses: {
    204: { description: "Logout successful" },
    401: { description: "Invalid credentials" },
    498: { description: "Access token expired" },
    500: { description: "Internal server error" },
  },
});

// GET /auth/oauth/{provider} - Start OAuth flow
registry.registerPath({
  method: "get",
  path: "/api/auth/oauth/{provider}",
  tags: ["Auth"],
  summary: "Start OAuth flow with a provider",
  description:
    "Access token is optional. To login/register without token, or link with a valid token.",
  security: [{ bearerAuth: [] }],
  request: {
    params: OAuthProviderParamSchema,
    query: OAuthConsentQuerySchema,
  },
  responses: {
    302: { description: "Redirects to the provider's consent screen" },
    400: { description: "Missing consent or invalid provider" },
    500: { description: "Internal server error" },
  },
});

// GET /auth/oauth/{provider}/callback - OAuth callback
registry.registerPath({
  method: "get",
  path: "/api/auth/oauth/{provider}/callback",
  summary: "OAuth callback",
  description: "Callback URL for OAuth provider only",
  tags: ["Auth"],
  request: {
    params: OAuthProviderParamSchema,
  },
  responses: {
    200: {
      description: "OAuth login success",
      content: {
        "application/json": {
          schema: AuthResponseSchema,
        },
      },
    },
    400: { description: "OAuth failed" },
    500: { description: "Internal server error" },
  },
});

// DELETE /auth/oauth/unlink/{provider} - Unlink OAuth provider
registry.registerPath({
  method: "delete",
  path: "/api/auth/oauth/unlink/{provider}",
  summary: "Unlink OAuth provider",
  tags: ["Auth"],
  security: [{ bearerAuth: [] }],
  request: {
    params: OAuthProviderParamSchema,
  },
  responses: {
    200: { description: "Unlinked successfully" },
    401: { description: "Invalid credentials" },
    498: { description: "Access token expired" },
    500: { description: "Internal server error" },
  },
});
