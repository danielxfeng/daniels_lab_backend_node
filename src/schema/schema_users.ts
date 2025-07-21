/**
 * @file schema_users.ts
 * @description The definition of user DTOs.
 * This file contains the schemas for the parameters and responses of the user routes.
 */

import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import {
  UrlSchema,
  CreateAtSchema,
  UpdateAtSchema,
  UsernameSchema,
  OauthProvidersSchema,
} from "./schema_components";

extendZodWithOpenApi(z);

//
// Schema components
//

const userIdSchema = z.string().trim().uuid("Invalid user ID").openapi({
  title: "User ID",
  description: "ID for the user",
});

//
// Request Schemas
//

const UpdateUserBodySchema = z.object({
  username: UsernameSchema,
});

const UserIdParamSchema = z.object({
  userId: userIdSchema,
});

//
// Response Schemas
//

const UserResponseSchema = z.object({
  id: userIdSchema,
  username: UsernameSchema,
  avatarUrl: UrlSchema.nullable(),
  oauthProviders: OauthProvidersSchema.array(),
  isAdmin: z.boolean().openapi({
    title: "IsAdmin",
    description: "If a user is admin",
    example: false,
  }),
  hasPassword: z.boolean().openapi({
    title: "HasPassword",
    description: "If a user has a password set",
    example: true,
  }),
  createdAt: CreateAtSchema,
  updatedAt: UpdateAtSchema,
  consentAt: z.string().datetime().openapi({
    title: "ConsentAt",
    description: "When does a user consent to term and conditions",
    example: "2025-01-01T12:00:00Z",
  }),
});

const UsersResponseSchema = z.array(UserResponseSchema);

export {
  UpdateUserBodySchema,
  UserIdParamSchema,
  UserResponseSchema,
  UsersResponseSchema,
};

// Inferred the type

type UpdateUserBody = z.infer<typeof UpdateUserBodySchema>;

type UserIdParam = z.infer<typeof UserIdParamSchema>;

type UserResponse = z.infer<typeof UserResponseSchema>;

type UserListResponse = z.infer<typeof UsersResponseSchema>;

export type { UpdateUserBody, UserIdParam, UserResponse, UserListResponse };
