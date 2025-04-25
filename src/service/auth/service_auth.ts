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

// The include tags for the user object
const includeTags = {
  include: { oauthAccounts: { select: { provider: true } } },
};

type UserResponse = Prisma.UserGetPayload<typeof includeTags>;

/**
 * @summary Generate a user response object.
 * @param user The user object to be returned.
 * @param tokens The tokens object to be returned.
 * @returns The assembled user response object.
 */
const generate_user_response = (
  user: UserResponse,
  tokens: { accessToken: string; refreshToken: string }
): AuthResponse => {
  // Prepare the response.
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
  };

  // Return the validated response.
  return validate_res(AuthResponseSchema, response);
};

/**
 * @summary A service to register a new user.
 * @description For creating a new user, or oauth registration.
 *
 * @param username The username of the user, unique.
 * @param consentAt The consent timestamp.
 * @param isOauth Whether the user is registering via oauth.
 * @param deviceId The device ID of the user device.
 * @param password The password of the user, optional for oauth registration.
 * @param avatarUrl The avatar URL of the user, optional.
 * @param oauthProvider The oauth provider, optional for normal registration.
 * @param oauthId The oauth ID of the user, optional for normal registration.
 * @return The created user object.
 * @throws 400 if the oauth provider or id is invalid.
 * @throws 409 if the user already exists.
 * @throws 500 if the user creation failed.
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
  // Validate the input
  if (!isOauth && (!username || !password))
    return terminateWithErr(
      400,
      "Username is required for normal registration"
    );
  if (isOauth && (!oauthProvider || !oauthId))
    return terminateWithErr(400, "Invalid oauth provider or id");

  // Try to insert to the database
  let newUser = null;
  try {
    newUser = await prisma.user.create({
      data: {
        username: isOauth ? randomId("user-", 10) : username!, // random username for oauth
        password: isOauth ? undefined : await hashPassword(password!), // hash password for normal
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
    // If there is a unique constraint error, 409 is thrown.
    if (err.code == "P2002") terminateWithErr(409, "User already exists");

    // Other errors are thrown.
    throw err;
  }

  // Save the refresh token in the database, may throw
  const tokens = await issueUserTokens(
    newUser.id,
    newUser.isAdmin,
    deviceId,
    true
  );

  // Return the response
  return generate_user_response(newUser, tokens);
};

/**
 * @summary To verify a user.
 * @description This function is used to verify a user by checking the user ID or with password.
 * @param userId the user ID
 * @param password the input password
 * @param checkPassword whether to check the password
 * @returns a user object
 */
const verifyUser = async (
  userId: string,
  password: string,
  checkPassword: boolean = true
): Promise<UserResponse> => {
  // Validate the input
  if (checkPassword && !password) terminateWithErr(400, "Password is required");

  // Check the user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    ...includeTags,
  });

  if (
    !user || // user not found
    user.deletedAt || // user is deleted
    (checkPassword &&
      (!user.password || // user has no password (oauth user)
        !(await verifyPassword(password, user.password)))) // password mismatch
  )
    return checkPassword
      ? terminateWithErr(401, "Invalid username or password")
      : terminateWithErr(404, "Page not found");

  // We use "!" because we have checked before
  return user!;
};

/**
 * @summary Link an OAuth account to a user.
 * @description This function executes a transaction to bind the OAuth account to the user.
 * @param userId the user ID
 * @param provider the OAuth provider
 * @param userInfo the OAuth user info
 *
 * @throws 404 if the user is not found
 * @throws 409 if the OAuth account is already linked to another user
 * @throws 500 if the transaction fails
 */
const linkOauthAccount = async (
  userId: string,
  provider: OauthProvider,
  userInfo: OauthUserInfo
): Promise<void> => {
  // Here we use the transaction to ensure the data consistency for high sensitive operations
  await prisma.$transaction(async (tx) => {
    // Check if the user exists
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt) return terminateWithErr(404, "User not found");

    // If the oauth account has been linked to another user, we throw 409
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

    // delete the existing link if exists
    await tx.oauthAccount.deleteMany({
      where: {
        userId,
        provider,
      },
    });

    // create a new link
    await tx.oauthAccount.create({
      data: {
        userId,
        provider,
        providerId: userInfo.id,
      },
    });
  });
};

/**
 * @summary Try to login a user with Oauth
 * @param provider the Oauth provider
 * @param userInfo the Oauth user info
 * @returns the user ID if the user exists, null otherwise
 * @throws 500 if the database query fails
 */
const loginOauthUser = async (
  provider: OauthProvider,
  userInfo: OauthUserInfo
): Promise<string | null> => {
  const oauthUser = await prisma.oauthAccount.findUnique({
    where: {
      provider_providerId: { provider, providerId: userInfo.id },
    },
    include: { user: { select: { id: true, isAdmin: true, deletedAt: true } } },
  });

  // If the user is not found, or the user is deleted, return null
  if (!oauthUser || oauthUser.user.deletedAt) return null;

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
