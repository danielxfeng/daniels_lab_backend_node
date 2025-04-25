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
import { UserResponseSchema, UsersResponseSchema, } from "../schema/schema_users";
import { AuthRequest } from "../types/type_auth";
import { validate_res } from "../utils/validate_res";
import { terminateWithErr } from "../utils/terminate_with_err";
import {
  UpdateUserBody,
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
    deletedAt: true,
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
 * @summary The auth double check function for high sensitive operations
 * @param req the request object
 */
const authDoubleCheck = async (req: AuthRequest) : Promise<void> => {
  const { id : userId } = req.user!;

  // Check the authentication again because of the high sensitive operation
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  // Throw an error if the user is not found or not an admin
  if (!user || user.deletedAt) return terminateWithErr(401, "User not found");
  if (!user!.isAdmin) return terminateWithErr(403, "Permission denied");
}

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
    if (!user || user.deletedAt) return terminateWithErr(500, "User not found");

    // Validate the response
    const validatedUser = validate_res(
      UserResponseSchema,
      MapUserResponse(user)
    );

    return res.status(200).json(validatedUser);
  },

  /**
   * @summary Update current user info.
   * @description This function updates the current user's information.
   */
  async updateCurrentUserInfo(
    req: AuthRequest<unknown, UpdateUserBody>,
    res: Response<UserResponse>
  ) {
    // parse the request body
    const { username, avatarUrl } = req.body;

    // It should pass the authentication middleware
    const { id: userId } = req.user!;

    // Update the user in the database, may throw an error.
    // It should work because we update the current user.
    // Otherwise, it will throw 500 but it's fine.
    const user = await prisma.user.update({
      where: { id: userId, deletedAt: null },
      data: {
        username,
        avatarUrl,
      },
      ...selectUserWithOauth,
    });

    // Validate the response
    const validatedUser = validate_res(
      UserResponseSchema,
      MapUserResponse(user)
    );

    // Return the response
    return res.status(200).json(validatedUser);
  },

  /**
   * @summary List all users (admin only).
   * @description This function retrieves a list of all users.
   */
  async listAllUsers(req: AuthRequest, res: Response<UserListResponse>) {

    // Check the authentication again because of the high sensitive operation
    // Will throw if the user is not an admin
    await authDoubleCheck(req);

    // Query from database
    const users: UserWithOauth[] = await prisma.user.findMany({
      where: { deletedAt: null },
      ...selectUserWithOauth,
    });

    // Validate the response
    const validatedUsers = validate_res(
      UsersResponseSchema,
      users.map((user) => MapUserResponse(user))
    );

    // Return the response
    return res.status(200).json(validatedUsers);
  },
};

export default userController;

export type { TypeSelectUserWithOauth };
