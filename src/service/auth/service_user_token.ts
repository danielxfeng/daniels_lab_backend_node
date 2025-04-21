/**
 * @file service_user_token.ts
 * @description Service for auth_controller.ts.
 */

import crypto from "crypto";
import ms from "ms";
import prisma from "../../db/prisma";
import { User, VerifiedToken } from "../../types/type_auth";
import { terminateWithErr } from "../../utils/terminate_with_err";
import { signJwt } from "../../utils/jwt_tools/sign_jwt";
import { verifyJwt } from "../../utils/jwt_tools/verify_jwt";

/**
 * @summary A helper function to hash a token.
 *
 * @param token The token to be hashed.
 * @returns The hashed token.
 */
const hashedToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

/**
 * @summary A helper function to issue a new access token and refresh token.
 * @description Note for refresh token, we applies a rotation strategy.
 * Then the refresh token will be refreshed when freshing a new access token.
 * So we clear all expired refresh tokens in the database.
 * Also, we will revoke the refresh token as requested.
 *
 * @param userId The user ID as the payload of JWT.
 * @param isAdmin The isAdmin as the payload of JWT.
 * @param deviceId The device Id we used to identify the device.
 * @param isRevokeAll revoke all refresh tokens if true,
 * otherwise revoke the refresh token of this device only.
 * @returns { accessToken, refreshToken } The access token and refresh token.
 */
const issueUserToken = async (
  userId: string,
  isAdmin: boolean,
  deviceId: string,
  isRevokeAll: boolean
): Promise<{ accessToken: string; refreshToken: string }> => {
  // Prepare the payload of JWT
  const user: User = { id: userId, isAdmin };

  // the revoke condition
  const revokeCondition = isRevokeAll ? { deviceId } : { deviceId, userId };

  // Clear all expired refresh tokens in the database
  await prisma.refreshToken.deleteMany({
    where: { OR: [{ expiresAt: { lte: new Date() } }, revokeCondition] },
  });

  // sign the refresh token
  const refreshToken = signJwt(
    user,
    process.env.JWT_REFRESH_EXPIRES_IN || "1d"
  );

  // Save the refresh token to the database.
  // There is still a very small chance that the refresh token is conflicted
  // with the existing one, but we will just ignore it,
  // because the error can be handled by Express error handler.
  await prisma.refreshToken.create({
    data: {
      userId,
      deviceId,
      token: hashedToken(refreshToken),
      expiresAt: new Date(
        Date.now() +
          ms((process.env.JWT_REFRESH_EXPIRES_IN as ms.StringValue) || "1d")
      ),
    },
  });

  return {
    accessToken: signJwt(user, process.env.JWT_ACCESS_EXPIRES_IN || "15m"),
    refreshToken,
  };
};

/**
 * @summary A helper function to validate the refresh token.
 * @param refreshToken the refresh token to be validated
 * @param deviceId the device ID to be validated
 * @returns the user object
 * @throws 401 if the token is invalid
 * @throws 500 if the token is unknown
 */
const validateRefreshToken = async (
  refreshToken: string,
  deviceId: string
): Promise<User> => {
  const verifiedToken: VerifiedToken = verifyJwt(refreshToken);

  // Check if the token is expired or invalid
  if ("expired" in verifiedToken || "invalid" in verifiedToken)
    terminateWithErr(401, "Invalid token");

  // Should not reach here
  if (!("valid" in verifiedToken)) terminateWithErr(500, "Unknown token error");

  // Extract the user from the token, we cast here because we checked the type before
  const user: User = (verifiedToken as { valid: User }).valid;

  // Check if the refresh token is valid
  const token = await prisma.refreshToken.findUnique({
    where: { token: hashedToken(refreshToken) },
  });

  // If the token is not found, or the deviceId does not match, throw 401 error
  if (!token || token.deviceId != deviceId)
    terminateWithErr(401, "Invalid token");

  // Return the user
  return user;
};

export { hashedToken, issueUserToken, validateRefreshToken };
