/**
 * @file schema_users.ts
 * @description The definition of user DTOs.
 * This file contains the schemas for the parameters and responses of the user routes.
 */

import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import {
  AvatarUrlSchema,
  CreateAtSchema,
  UpdateAtSchema,
  UsernameSchema,
} from "./schema_components";
import { SchemaMapToValidated } from "../types/validated_type";
import { PostIdQuerySchema } from "./schema_components";

extendZodWithOpenApi(z);

//
// Schema components
//

/**
 * @summary A legal user ID should be:
 * - UUID format
 */
const userIdSchema = z.string().trim().uuid("Invalid user ID").openapi({
  title: "User ID",
  description: "ID for the user",
});

//
// Request Schemas
//

/**
 * @summary Request body for updating current user info.
 */
const UpdateUserBodySchema = z.object({
  username: UsernameSchema,
  avatarUrl: AvatarUrlSchema.optional(),
});

/**
 * @summary Path parameter schema for userId.
 */
const UserIdParamSchema = z.object({
  userId: userIdSchema,
});

//
// Response Schemas
//

/**
 * @summary Schema for the user response, including:
 * - id, username, avatarUrl, oauthProviders, isAdmin, createdAt, updatedAt, consent, consentAt
 */
const UserResponseSchema = z.object({
  id: userIdSchema,
  username: UsernameSchema,
  avatarUrl: AvatarUrlSchema.optional(),
  oauthProviders: z.array(z.string()).openapi({
    title: "OauthProviders",
    description: "List of OAuth providers linked to the user",
    example: ["google", "github"],
  }),
  isAdmin: z.boolean().openapi({
    title: "IsAdmin",
    description: "If a user is admin",
    example: false,
  }),
  createdAt: CreateAtSchema,
  updatedAt: UpdateAtSchema,
  consent: z.boolean().openapi({
    title: "Consent",
    description: "If a user is consent to term and conditions",
    example: true,
  }),
  consentAt: z.string().datetime().openapi({
    title: "ConsentAt",
    description: "When does a user consent to term and conditions",
    example: "2025-01-01T12:00:00Z",
  }),
});

const UsersResponseSchema = z.array(UserResponseSchema)

export {
  UpdateUserBodySchema,
  UserIdParamSchema,
  UserResponseSchema,
  UsersResponseSchema,
};

// Inferred the type

/**
 * @summary Schema Maps for user requests
 */
export const UserReqSchemaMaps = {
  updateUser: { body: UpdateUserBodySchema },
  deleteUser: { params: UserIdParamSchema },
} as const;

/**
 * @summary Type for the validated user request
 */
type UserValidatedReq = SchemaMapToValidated<typeof UserReqSchemaMaps>;

/**
 * @summary Type for the validated user response
 */
type UserResponse = z.infer<typeof UserResponseSchema>;

/**
 * @summary Type for the list of users response
 */
type UserListResponse = z.infer<typeof UsersResponseSchema>;

export type { UserValidatedReq, UserResponse, UserListResponse };
