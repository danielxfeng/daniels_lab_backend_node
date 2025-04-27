/**
 * @file service_user_token.ts
 * @description For User JWT tokens management.
 */

import ms from "ms";
import prisma from "../../db/prisma";
import { User, VerifiedToken } from "../../types/type_auth";
import { terminateWithErr } from "../../utils/terminate_with_err";
import { signJwt } from "../../utils/jwt_tools/sign_jwt";
import { verifyJwt } from "../../utils/jwt_tools/verify_jwt";
import { hashedToken } from "../../utils/crypto";

/**
 * @summary A helper function to issue a new refresh token.
 * @description DON'T EXPORT THIS FUNCTION.
 *
 * @param user The payload of the token.
 * @param deviceId The device ID to issue the refresh token.
 */
const issueRefreshToken = async (user: User, deviceId: string) => {
  const payload = {
    user,
    type: "refresh",
  };
  // sign the refresh token
  const refreshToken = signJwt(
    payload,
    process.env.JWT_REFRESH_EXPIRES_IN || "1d"
  );

  // Save the refresh token to the database.
  // There is still a very small chance that the refresh token is conflicted
  // with the existing one, but we will just ignore it,
  // The error will be handled by Express error handler.
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      deviceId,
      token: hashedToken(refreshToken),
      expiresAt: new Date(
        Date.now() +
          ms((process.env.JWT_REFRESH_EXPIRES_IN as ms.StringValue) || "1d")
      ),
    },
  });

  return refreshToken;
};

/**
 * @summary A service to revoke the refresh token.
 * @description Support revoke certain device refresh token or all refresh tokens for a user.
 * It takes effect immediately. All expired refresh tokens will also be deleted.
 *
 * @param userId The user ID to revoke the refresh token.
 * @param deviceId Optional, if not provided, all refresh tokens of this user will be revoked.
 * Otherwise, only the user's refresh token of this device will be revoked.
 */
const revokeRefreshToken = async (userId: string, deviceId?: string) => {
  // the revoke condition
  const revokeCondition = deviceId ? { deviceId } : { userId };

  // Clear all expired refresh tokens in the database, and revoke the refresh token
  await prisma.refreshToken.deleteMany({
    where: { OR: [{ expiresAt: { lte: new Date() } }, revokeCondition] },
  });
};

/**
 * @summary A service to issue a set of JWT tokens: access token and refresh token.
 * @description The policy for JWT tokens is:
 * - Access token cannot be revoked, which means it will be valid during the lifetime of the token.
 * - Refresh token is saved in the database, so it can be revoked.
 * And an Rotation Policy is applied for refresh token.
 * Which means when a new refresh token is issued, the old one will be revoked immediately.
 *
 * @param userId The user ID as the payload of JWT.
 * @param isAdmin The isAdmin as the payload of JWT.
 * @param deviceId The device Id we used to identify the device.
 * @param isRevokeAll revoke all refresh tokens if true,
 * otherwise revoke the refresh token of this device only.
 * @returns { accessToken, refreshToken } The access token and refresh token.
 */
const issueUserTokens = async (
  userId: string,
  isAdmin: boolean,
  deviceId: string,
  isRevokeAll: boolean
): Promise<{ accessToken: string; refreshToken: string }> => {
  // Prepare the payload of JWT
  const user: User = { id: userId, isAdmin };

  // Revoke the previous refresh token(s).
  await revokeRefreshToken(userId, isRevokeAll ? undefined : deviceId);

  // Issue a new access token.
  const accessToken = signJwt(
    { user, type: "access" },
    process.env.JWT_ACCESS_EXPIRES_IN || "15m"
  );

  // return them.
  return {
    accessToken: accessToken,
    refreshToken: await issueRefreshToken(user, deviceId),
  };
};

/**
 * @summary A service to use the refresh token.
 * @description A rotation policy is applied for refresh token.
 * Which means if the refresh token is used, it will be revoked immediately.
 * So in this function, we will revoke the refresh token.
 *
 * @param refreshToken the refresh token to be validated
 * @param deviceId the device ID to be validated
 * @returns the user object
 * @throws 401 if the token is invalid
 * @throws 500 if the token is unknown
 */
const useRefreshToken = async (
  refreshToken: string,
  deviceId: string
): Promise<User> => {
  const verifiedToken: VerifiedToken = verifyJwt(refreshToken);

  // Check if the token is expired or invalid
  if ("expired" in verifiedToken || "invalid" in verifiedToken)
    return terminateWithErr(401, "Invalid token");

  // Should not reach here
  if (!("valid" in verifiedToken))
    return terminateWithErr(500, "Unknown token error");

  // Get the user and type from the verified token
  const { user, type } = verifiedToken.valid as {
    user?: User;
    state?: string;
    type: "access" | "refresh" | "state";
  };

  // Check if the token is a refresh token
  if (type !== "refresh") return terminateWithErr(401, "Invalid token");

  // Try to revoke the refresh token, if success, means the token is valid.
  const revoked = await prisma.refreshToken.deleteMany({
    where: { token: hashedToken(refreshToken), deviceId },
  });

  // If the token is not found, or the deviceId does not match, throw 401 error
  if (revoked.count === 0) terminateWithErr(401, "Invalid token");

  // Return the user
  return user!;
};

export { revokeRefreshToken, issueUserTokens, useRefreshToken };
