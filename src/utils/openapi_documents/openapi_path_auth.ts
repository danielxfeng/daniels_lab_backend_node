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
} from "../../schema/schema_auth";

import { registry } from "./openapi_registry"

// POST /api/auth/register - Register a new user
registry.registerPath({
  method: "post",
  path: "/api/auth/register",
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
    400: {
      description: "Invalid input",
    },
  },
});

// POST /api/auth/login - Login a user
registry.registerPath({
  method: "post",
  path: "/api/auth/login",
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
    401: {
      description: "Invalid credentials",
    },
  },
});

// POST /api/auth/change-password - Change user password
registry.registerPath({
  method: "post",
  path: "/api/auth/change-password",
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
    401: {
      description: "Unauthorized or current password incorrect",
    },
  },
});

// POST /api/auth/refresh - Refresh access token
registry.registerPath({
  method: "post",
  path: "/api/auth/refresh",
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
    403: {
      description: "Invalid or expired refresh token",
    },
  },
});

// PUT /api/auth/join-admin - Join admin role
registry.registerPath({
  method: "put",
  path: "/api/auth/join-admin",
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
    200: {
      description: "Joined admin role successfully",
    },
    401: {
      description: "Invalid credentials",
    },
    403: {
      description: "Invalid reference code",
    },
  },
});

// POST /auth/logout - Logout a user
registry.registerPath({
  method: "post",
  path: "/api/auth/logout",
  tags: ["Auth"],
  security: [{ bearerAuth: [] }],
  responses: {
    204: {
      description: "Logout successful",
    },
    401: {
      description: "Invalid credentials",
    },
  },
});

// GET /auth/oauth/{provider} - Start OAuth flow
registry.registerPath({
  method: "get",
  path: "/api/auth/oauth/{provider}",
  tags: ["Auth"],
  summary: "Start OAuth flow with a provider",
  description:
    "OAuth registration/login for unregistered users, or linking for registered users.",
  security: [{ bearerAuth: [] }],
  request: {
    params: OAuthProviderParamSchema,
    query: OAuthConsentQuerySchema,
  },
  responses: {
    302: {
      description: "Redirects to the provider's consent screen",
    },
    400: {
      description: "Missing consent or invalid provider",
    },
    401: {
      description: "Invalid credentials",
    },
  },
});


// GET /auth/oauth/{provider}/callback - OAuth callback
registry.registerPath({
  method: "get",
  path: "/api/auth/oauth/{provider}/callback",
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
    400: {
      description: "OAuth failed",
    },
  },
});

// DELETE /auth/oauth/unlink/{provider} - Unlink OAuth provider
registry.registerPath({
  method: "delete",
  path: "/api/auth/oauth/unlink/{provider}",
  tags: ["Auth"],
  security: [{ bearerAuth: [] }],
  request: {
    params: OAuthProviderParamSchema,
  },
  responses: {
    200: {
      description: "Unlinked successfully",
    },
    401: {
      description: "Invalid credentials",
    },
  },
});