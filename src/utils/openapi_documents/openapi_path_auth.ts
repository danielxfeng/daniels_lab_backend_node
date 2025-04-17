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

// Register /auth/register
registry.registerPath({
  method: "post",
  path: "/auth/register",
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

// Register /auth/login
registry.registerPath({
  method: "post",
  path: "/auth/login",
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

// Register /auth/change-password
registry.registerPath({
  method: "post",
  path: "/auth/change-password",
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

// Register /auth/refresh
registry.registerPath({
  method: "post",
  path: "/auth/refresh",
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

// Register /auth/join-admin
registry.registerPath({
  method: "put",
  path: "/auth/join-admin",
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

// Register /auth/logout
registry.registerPath({
  method: "post",
  path: "/auth/logout",
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

// Register /auth/oauth/{provider}
registry.registerPath({
  method: "get",
  path: "/auth/oauth/{provider}",
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


// Register /auth/oauth/{provider}/callback
registry.registerPath({
  method: "get",
  path: "/auth/oauth/{provider}/callback",
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

// Register /auth/oauth/unlink/{provider}
registry.registerPath({
  method: "delete",
  path: "/auth/oauth/unlink/{provider}",
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