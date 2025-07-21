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
import { OauthProvider } from "../schema/schema_components";

// @summary A user with OAuth accounts from Prisma query
const selectUserWithOauth = {
  select: {
    id: true,
    username: true,
    avatarUrl: true,
    isAdmin: true,
    encryptedPwd: true,
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
    oauthProviders: user.oauthAccounts.map((account) => account.provider as OauthProvider),
    hasPassword: !!user.encryptedPwd, // true if the user has a password set
  };
};

/**
 * @summary The auth double check function for high sensitive operations
 */
const authDoubleCheck = async (req: AuthRequest) : Promise<void> => {
  const { id : userId } = req.locals!.user!!;

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  // Throw an error if the user is not found or not an admin
  if (!user || user.deletedAt) return terminateWithErr(401, "User not found");
  if (!user!.isAdmin) return terminateWithErr(403, "Permission denied");
}

/**
 * @summary To handle the users related operations.
 */
const userController = {
  async getCurrentUserProfile(req: AuthRequest, res: Response<UserResponse>) {
    const { id: userId } = req.locals!.user!!;

    const user: UserWithOauth | null = await prisma.user.findUnique({
      where: { id: userId },
      ...selectUserWithOauth,
    });

    if (!user || user.deletedAt) return terminateWithErr(500, "User not found");

    const validatedUser = validate_res(
      UserResponseSchema,
      MapUserResponse(user)
    );

    res.status(200).json(validatedUser);
  },

  /**
   * @summary Update current user info.
   */
  async updateCurrentUserInfo(
    req: AuthRequest<unknown, UpdateUserBody>,
    res: Response<UserResponse>
  ) {
    const { username } = req.locals!.body!;

    const { id: userId } = req.locals!.user!!;

    let user = null;

    try {
      user = await prisma.user.update({
        where: { id: userId, deletedAt: null },
        data: {
          username,
        },
        ...selectUserWithOauth,
      });
    } catch (error: any) {
      if (error.code === "P2025")
        return terminateWithErr(500, "User not found");
      if (error.code === "P2002")
          return terminateWithErr(409, "Username already taken");
      throw error;
    }

    const validatedUser = validate_res(
      UserResponseSchema,
      MapUserResponse(user)
    );

    res.status(200).json(validatedUser);
  },

  /**
   * @summary List all users (admin only).
   */
  async listAllUsers(req: AuthRequest, res: Response<UserListResponse>) {

    await authDoubleCheck(req);

    const users: UserWithOauth[] = await prisma.user.findMany({
      where: { deletedAt: null },
      ...selectUserWithOauth,
    });

    const validatedUsers = validate_res(
      UsersResponseSchema,
      users.map((user) => MapUserResponse(user))
    );

    res.status(200).json(validatedUsers);
  },
};

export default userController;

export type { TypeSelectUserWithOauth };
