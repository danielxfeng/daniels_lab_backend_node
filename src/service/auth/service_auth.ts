/**
 * @file service_auth.ts
 * @description The service for auth controller.
 */
import { Prisma } from "@prisma/client";
import prisma from "../../db/prisma";
import {
  AuthResponseSchema,
  AuthResponse,
  OauthUserInfo,
} from "../../schema/schema_auth";
import { validate_res } from "../../utils/validate_res";
import { terminateWithErr } from "../../utils/terminate_with_err";
import { issueUserTokens } from "./service_user_token";
import { randomId, hashPassword, verifyPassword } from "../../utils/crypto";
import { OauthProvider } from "../../schema/schema_components";

const includeTags = {
  include: { oauthAccounts: { select: { provider: true } } },
};

type UserResponse = Prisma.UserGetPayload<typeof includeTags>;

/**
 * @summary Generate a user response object.
 */
const generate_user_response = (
  user: UserResponse,
  tokens: { accessToken: string; refreshToken: string }
): AuthResponse => {
  const response: AuthResponse = {
    id: user.id,
    username: user.username,
    avatarUrl: user.avatarUrl,
    isAdmin: user.isAdmin,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    oauthProviders: user.oauthAccounts.map(
      (account) => account.provider as OauthProvider
    ),
    hasPassword: !!user.encryptedPwd, // true if the user has a password set
  };

  return validate_res(AuthResponseSchema, response);
};

/**
 * @summary A service to register a new user.
 */
const registerUser = async (
  consentAt: string,
  isOauth: boolean,
  deviceId: string,
  username?: string,
  password?: string,
  avatarUrl?: string,
  oauthProvider?: string,
  oauthId?: string
): Promise<AuthResponse> => {
  if (!isOauth && (!username || !password))
    return terminateWithErr(
      400,
      "Username is required for normal registration"
    );
  if (isOauth && (!oauthProvider || !oauthId))
    return terminateWithErr(400, "Invalid oauth provider or id");

  let newUser = null;
  try {
    newUser = await prisma.user.create({
      data: {
        username: isOauth ? randomId("user-", 10) : username!, // random username for oauth
        encryptedPwd: isOauth ? undefined : await hashPassword(password!), // hash password for normal
        avatarUrl,
        isAdmin: false,
        consentAt: new Date(consentAt),
        deletedAt: null,
        oauthAccounts: isOauth
          ? { create: [{ provider: oauthProvider!, providerId: oauthId! }] }
          : undefined,
      },
      ...includeTags,
    });
  } catch (err: any) {
    if (err.code == "P2002") terminateWithErr(409, "User already exists");
    throw err;
  }

  const tokens = await issueUserTokens(
    newUser.id,
    newUser.isAdmin,
    deviceId,
    true
  );

  return generate_user_response(newUser, tokens);
};

/**
 * @summary To verify a user.
 */
const verifyUser = async (
  userId: string,
  password: string,
  checkPassword: boolean = true
): Promise<UserResponse> => {
  if (checkPassword && !password) terminateWithErr(400, "Password is required");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    ...includeTags,
  });

  if (
    !user || // user not found
    user.deletedAt || // user is deleted
    (checkPassword &&
      (!user.encryptedPwd || // user has no password (oauth user)
        !(await verifyPassword(password, user.encryptedPwd)))) // password mismatch
  )
    return checkPassword
      ? terminateWithErr(401, "Invalid username or password")
      : terminateWithErr(404, "Page not found");

  return user!;
};

/**
 * @summary Link an OAuth account to a user.
 */
const linkOauthAccount = async (
  userId: string,
  provider: OauthProvider,
  userInfo: OauthUserInfo
): Promise<void> => {
  // Here we use the transaction to ensure the data consistency for high sensitive operations
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt) return terminateWithErr(404, "User not found");

    const existingOauth = await tx.oauthAccount.findUnique({
      where: {
        provider_providerId: {
          provider,
          providerId: userInfo.id,
        },
      },
    });
    if (existingOauth && existingOauth.userId !== userId)
      return terminateWithErr(409, "OAuth account already exists");

    // delete the existing link if exists, in case that the provide exists but the providerId is different
    await tx.oauthAccount.deleteMany({
      where: {
        userId,
        provider,
      },
    });

    await tx.oauthAccount.create({
      data: {
        userId,
        provider,
        providerId: userInfo.id,
      },
    });

    if (userInfo.avatar) {
      await tx.user.update({
        where: { id: userId },
        data: { avatarUrl: userInfo.avatar },
      });
    }
  });
};

/**
 * @summary Try to login a user with Oauth
 */
const loginOauthUser = async (
  provider: OauthProvider,
  userInfo: OauthUserInfo
): Promise<string | null> => {
  const oauthUser = await prisma.oauthAccount.findUnique({
    where: {
      provider_providerId: { provider, providerId: userInfo.id },
    },
    include: { user: { select: { id: true, isAdmin: true, deletedAt: true, avatarUrl: true } } },
  });

  if (!oauthUser || oauthUser.user.deletedAt) return null;

  if (userInfo.avatar && oauthUser.user.avatarUrl !== userInfo.avatar) {
    await prisma.user.update({
      where: { id: oauthUser.user.id },
      data: { avatarUrl: userInfo.avatar },
    });
  }

  return oauthUser.userId;
};

export {
  generate_user_response,
  registerUser,
  verifyUser,
  linkOauthAccount,
  loginOauthUser,
};

export type {UserResponse};
