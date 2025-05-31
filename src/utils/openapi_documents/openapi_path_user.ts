/**
 * @file openapi_path_user.ts
 * @description Path definitions for user-related endpoints.
 */

import { registry } from "./openapi_registry";
import {
  UpdateUserBodySchema,
  UserIdParamSchema,
  UserResponseSchema,
  UsersResponseSchema,
} from "../../schema/schema_users";

// GET /api/users - Get current user profile
registry.registerPath({
  method: "get",
  path: "/api/users",
  summary: "Get current user profile",
  description: "Return the profile of the authenticated user",
  tags: ["Users"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "User profile",
      content: {
        "application/json": {
          schema: UserResponseSchema,
        },
      },
    },
    401: { description: "Unauthorized" },
    498: { description: "Access token expired" },
    500: { description: "Internal server error" },
  },
});

// PUT /api/users - Update current user info
registry.registerPath({
  method: "put",
  path: "/api/users",
  summary: "Update current user info",
  description: "Authenticated users can update their own profile",
  tags: ["Users"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: UpdateUserBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Updated user info",
      content: {
        "application/json": {
          schema: UserResponseSchema,
        },
      },
    },
    400: { description: "Bad request, invalid username or avatarUrl" },
    401: { description: "Unauthorized" },
    409: { description: "Username already taken" },
    498: { description: "Access token expired" },
    500: { description: "Internal server error" },
  },
});

// GET /api/users/all - List all users
registry.registerPath({
  method: "get",
  path: "/api/users/all",
  summary: "List all users (admin only)",
  description: "Admins only",
  tags: ["Users"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "List of users",
      content: {
        "application/json": {
          schema: UsersResponseSchema,
        },
      },
    },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden - Admins only" },
    498: { description: "Access token expired" },
    500: { description: "Internal server error" },
  },
});
