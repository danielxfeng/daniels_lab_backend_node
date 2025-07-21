/**
 * @file service_user_token.ts
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
 */
const issueRefreshToken = async (user: User, deviceId: string) => {
  const payload = {
    user,
    type: "refresh",
  };

  const refreshToken = signJwt(
    payload,
    process.env.JWT_REFRESH_EXPIRES_IN || "1d"
  );

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      deviceId,
      hashedToken: hashedToken(refreshToken),
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
 * @param deviceId Optional, if not provided, all refresh tokens of this user will be revoked.
 * Otherwise, only the user's refresh token of this device will be revoked.
 */
const revokeRefreshToken = async (userId: string, deviceId?: string) => {
  const revokeCondition = deviceId ? { deviceId } : { userId };

  await prisma.refreshToken.deleteMany({
    where: { OR: [{ expiresAt: { lte: new Date() } }, revokeCondition] },
  });
};

/**
 * @summary A service to issue a set of JWT tokens: access token and refresh token.
 */
const issueUserTokens = async (
  userId: string,
  isAdmin: boolean,
  deviceId: string,
  isRevokeAll: boolean
): Promise<{ accessToken: string; refreshToken: string }> => {
  const user: User = { id: userId, isAdmin };

  await revokeRefreshToken(userId, isRevokeAll ? undefined : deviceId);

  const accessToken = signJwt(
    { user, type: "access" },
    process.env.JWT_ACCESS_EXPIRES_IN || "15m"
  );

  return {
    accessToken: accessToken,
    refreshToken: await issueRefreshToken(user, deviceId),
  };
};

/**
 * @summary A service to use the refresh token.
 */
const useRefreshToken = async (
  refreshToken: string,
  deviceId: string
): Promise<User> => {
  const verifiedToken: VerifiedToken = verifyJwt(refreshToken);

  if ("expired" in verifiedToken || "invalid" in verifiedToken)
    return terminateWithErr(401, "Invalid token");

  // Should not reach here
  if (!("valid" in verifiedToken))
    return terminateWithErr(500, "Unknown token error");

  const { user, type } = verifiedToken.valid as {
    user?: User;
    state?: string;
    type: "access" | "refresh" | "state";
  };

  if (type !== "refresh") return terminateWithErr(401, "Invalid token");

  const revoked = await prisma.refreshToken.deleteMany({
    where: { hashedToken: hashedToken(refreshToken), deviceId },
  });

  if (revoked.count === 0) terminateWithErr(401, "Invalid token");

  return user!;
};

export { revokeRefreshToken, issueUserTokens, useRefreshToken };
