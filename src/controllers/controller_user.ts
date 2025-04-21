/**
 * @file controller_user.ts
 * @description This file contains the controller functions for handling user-related operations.
 * - Get current user profile.
 * - Update current user info.
 * - List all users (admin only).
 * - Delete a user (admin only).
 */

import { Response } from "express";
import prisma from "../db/prisma";
import {
  UpdateUserBodySchema,
  UserIdParamSchema,
  UserResponseSchema,
  UsersResponseSchema,
} from "../schema/schema_users";
import { AuthRequest } from "../types/type_auth";
import { validate_res } from "../utils/validate_res";
import { terminateWithErr } from "../utils/terminate_with_err";
import {
  UpdateAtSchema,
  UserIdParam,
  UserResponse,
  UserListResponse,
} from "../schema/schema_users";
import { Prisma } from "@prisma/client";

// @summary A user with OAuth accounts from Prisma query
const selectUserWithOauth = {
  select: {
    id: true,
    username: true,
    avatarUrl: true,
    isAdmin: true,
    createdAt: true,
    updatedAt: true,
    consentAt: true,
    oauthAccounts: {
      select: {
        provider: true,
      },
    },
  },
};
type TypeSelectUserWithOauth = typeof selectUserWithOauth;

// @summary A user with OAuth accounts from Prisma query
type UserWithOauth = Prisma.UserGetPayload<TypeSelectUserWithOauth>;

const MapUserResponse = (user: UserWithOauth): UserResponse => {
  return {
    id: user.id,
    username: user.username,
    avatarUrl: user.avatarUrl,
    isAdmin: user.isAdmin,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    consentAt: user.consentAt.toISOString(),
    oauthProviders: user.oauthAccounts.map((account) => account.provider),
  };
};

/**
 * @summary To handle the users related operations.
 * @description This file contains the controller functions for handling user-related operations.
 * - Get current user profile.
 * - Update current user info.
 * - List all users (admin only).
 * - Delete a user (admin only).
 */
const userController = {
  /**
   * @summary Get current user profile.
   * @description This function retrieves the current user's profile information.
   */
  async getCurrentUserProfile(req: AuthRequest, res: Response<UserResponse>) {
    const { id: userId } = req.user!;

    // Query from database
    const user: UserWithOauth | null = await prisma.user.findUnique({
      where: { id: userId },
      ...selectUserWithOauth,
    });

    // We check the current user, so normally it should not be null
    if (!user) return terminateWithErr(500, "User not found");

    // Validate the response
    const validatedUser = validate_res(
      UserResponseSchema,
      MapUserResponse(user)
    );

    return res.status(200).json(validatedUser);
  },
};

export default userController;

export type { TypeSelectUserWithOauth };
