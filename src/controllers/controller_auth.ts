import { Response } from "express";
import prisma from "../db/prisma";
import {
  RegisterBody,
  LoginBody,
  ChangePasswordBody,
  RefreshTokenBody,
  JoinAdminBody,
  OAuthProviderParam,
  OAuthConsentQuery,
  AuthResponse,
  TokenRefreshResponse,
  DeviceIdBody,
  UserNameBody,
  OauthStateSchema,
  SetPasswordBody,
  DeviceIdQuery,
  OAuthRedirectResponse,
  OAuthRedirectResponseSchema,
} from "../schema/schema_auth";
import { AuthRequest, User } from "../types/type_auth";
import { terminateWithErr } from "../utils/terminate_with_err";
import {
  generate_user_response,
  linkOauthAccount,
  loginOauthUser,
  registerUser,
  verifyUser,
} from "../service/auth/service_auth";
import { hashPassword, verifyPassword } from "../utils/crypto";
import {
  issueUserTokens,
  revokeRefreshToken,
  useRefreshToken,
} from "../service/auth/service_user_token";
import { signJwt } from "../utils/jwt_tools/sign_jwt";
import { verifyJwt } from "../utils/jwt_tools/verify_jwt";
import { OauthServiceMap } from "../service/oauth/oauth";
import { UserIdParam } from "../schema/schema_users";
import { Prisma } from "@prisma/client";

/**
 * @summary Get OAuth URL
 * @description
 * A helper function to get the OAuth URL for a given provider, for oauth login/register/link.
 * @returns the redirect URL to the OAuth provider's login page.
 */
const getOauthUrl = (
  provider: "google" | "github" | "linkedin",
  consentAt: string,
  deviceId: string,
  redirectTo?: string,
  userId?: string
): string => {
  const parsed = OauthStateSchema.safeParse({
    consentAt,
    deviceId,
    redirectTo: redirectTo || "/",
    userId,
  });
  if (!parsed.success) {
    return terminateWithErr(400, "Invalid OAuth state parameters");
  }

  const payload = {
    state: parsed.data,
    type: "state" as const,
  };

  const state = signJwt(payload, "15m");

  return OauthServiceMap[provider].getOauthUrl(state);
};

/**
 * @summary Authentication Controller
 */
const authController = {
  /**
   * @summary Register a new user
   * @description POST /auth/register
   */
  async register(
    req: AuthRequest<unknown, RegisterBody>,
    res: Response<AuthResponse>
  ) {
    const { username, password, consentAt, deviceId } = req.locals!.body!;

    const user = await registerUser(
      consentAt,
      false,
      deviceId,
      username,
      password
    );

    res.status(201).json(user);
  },

  /**
   * @summary User login
   * @description POST /auth/login
   * Only support non-OAuth users (OAuth users don't have password)
   */
  async login(
    req: AuthRequest<unknown, LoginBody>,
    res: Response<AuthResponse>
  ) {
    const { username, password, deviceId } = req.locals!.body!;

    const user = await prisma.user.findUnique({
      where: { username },
      include: { oauthAccounts: { select: { provider: true } } },
    });

    if (
      !user || // User not found
      !user.encryptedPwd || // User is OAuth user
      user.deletedAt || // User is deleted
      (await verifyPassword(password, user.encryptedPwd!)) === false // Password mismatch
    )
      return terminateWithErr(401, "Invalid username or password");

    // Issue new tokens, for login we revoke only the current device's refresh token
    const tokens = await issueUserTokens(
      user.id,
      user.isAdmin,
      deviceId,
      false
    );

    res.status(200).json(generate_user_response(user, tokens));
  },

  /**
   * @description POST /auth/change-password
   */
  async changePassword(
    req: AuthRequest<unknown, ChangePasswordBody>,
    res: Response<AuthResponse>
  ) {
    const { currentPassword, password, deviceId } = req.locals!.body!;
    const { id: userId } = req.locals!.user!;

    const user = await verifyUser(userId, currentPassword);

    // possible data race here.
    const newUser = await prisma.user.update({
      where: { id: user.id },
      data: { encryptedPwd: await hashPassword(password) },
      include: { oauthAccounts: { select: { provider: true } } },
    });

    // Revoke all old tokens and issue new ones
    const tokens = await issueUserTokens(
      newUser.id,
      newUser.isAdmin,
      deviceId,
      true
    );

    res.status(200).json(generate_user_response(newUser, tokens));
  },

  /**
   * @description POST /auth/set-password
   * This is used to set the password for a user who has no password (OAuth user).
   */
  async setPassword(
    req: AuthRequest<unknown, SetPasswordBody>,
    res: Response<AuthResponse>
  ) {
    const { password, deviceId } = req.locals!.body!;
    const { id: userId } = req.locals!.user!;

    const user = await prisma.user.findUnique({
      where: { id: userId, deletedAt: null, encryptedPwd: null },
      include: { oauthAccounts: { select: { provider: true } } },
    });

    if (!user)
      return terminateWithErr(404, "User not found, or already has password");

    const newUser = await prisma.user.update({
      where: { id: userId },
      data: { encryptedPwd: await hashPassword(password) },
      include: { oauthAccounts: { select: { provider: true } } },
    });

    // Revoke tokens for just this device and issue new ones
    const tokens = await issueUserTokens(
      newUser.id,
      newUser.isAdmin,
      deviceId,
      false
    );

    res.status(200).json(generate_user_response(newUser, tokens));
  },

  /**
   * @description PUT /auth/join-admin
   */
  async joinAdmin(
    req: AuthRequest<unknown, JoinAdminBody>,
    res: Response<AuthResponse>
  ) {
    const { referenceCode, deviceId } = req.locals!.body!;
    const { id: userId, isAdmin } = req.locals!.user!;

    if (!process.env.ADMIN_REF_CODE?.trim())
      return terminateWithErr(410, "Admin registration is currently disabled");

    if (referenceCode !== process.env.ADMIN_REF_CODE)
      return terminateWithErr(422, "Invalid reference code");

    if (isAdmin) return terminateWithErr(400, "Already an admin");

    let newUser = null;
    try {
      newUser = await prisma.user.update({
        where: { id: userId, deletedAt: null },
        data: { isAdmin: true },
        include: { oauthAccounts: { select: { provider: true } } },
      });
    } catch (err: any) {
      // If the user is not found, return 404
      if (err.code === "P2025") return terminateWithErr(404, "User not found");
      else throw err;
    }

    // Revoke all old tokens and issue new ones, because isAdmin is payload of token
    const tokens = await issueUserTokens(
      newUser.id,
      newUser.isAdmin,
      deviceId,
      true
    );

    res.status(200).json(generate_user_response(newUser, tokens));
  },

  /**
   * @summary Refresh access token
   * @description POST /auth/refresh
   */
  async refresh(
    req: AuthRequest<unknown, RefreshTokenBody>,
    res: Response<TokenRefreshResponse>
  ) {
    const { refreshToken, deviceId } = req.locals!.body!;

    const user = await useRefreshToken(refreshToken, deviceId);

    // Issue new tokens, for refresh we just revoke the old refresh token
    const tokens = await issueUserTokens(
      user.id,
      user.isAdmin,
      deviceId,
      false
    );

    res.status(200).json(tokens);
  },

  /**
   * @summary Logout user
   * @description POST /auth/logout
   * If the deviceId is not provided, all refresh tokens will be revoked.
   * Otherwise, only the refresh token of this device will be revoked.
   */
  async logout(req: AuthRequest<unknown, DeviceIdBody>, res: Response) {
    const { id: userId } = req.locals!.user!;
    const { deviceId } = req.locals!.body!;

    const user = await prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });

    if (!user) return terminateWithErr(404, "User not found");

    // revoke the refresh token
    await revokeRefreshToken(userId, deviceId ? deviceId : undefined);

    res.status(204).send();
  },

  /**
   * @summary Check if username is available
   * @description GET /auth/username/:username
   */
  async checkUsername(
    req: AuthRequest<UserNameBody>,
    res: Response<{ exists: boolean }>
  ) {
    const { username } = req.locals!.params!;

    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    res.status(200).json({ exists: user !== null });
  },

  /**
   * @summary OAuth login/register/link
   * @description POST /auth/oauth/:provider
   * This will sign a JWT token as the state.
   * @returns a redirect to the OAuth provider's login page.
   */
  async oauthLoginPost(
    req: AuthRequest<OAuthProviderParam, OAuthConsentQuery>,
    res: Response<OAuthRedirectResponse>
  ) {
    const { provider } = req.locals!.params!;
    const { consentAt, deviceId, redirectTo } = req.locals!.body!;
    const userId = req.locals!.user?.id;
    const redirectUrl = getOauthUrl(
      provider,
      consentAt,
      deviceId,
      redirectTo,
      userId
    );

    const validatedRedirectUrl = OAuthRedirectResponseSchema.safeParse({
      redirectUrl,
    });
    if (!validatedRedirectUrl.success) {
      return terminateWithErr(500, "Invalid redirect URL parameters");
    }

    res.status(200).json(validatedRedirectUrl.data);
  },

  /**
   * @summary OAuth login/register/link
   * @description GET /auth/oauth/:provider
   * This will redirect the user to the OAuth provider's login page.
   * This will sign a JWT token as the state for keeping the state.
   */
  async oauthLogin(
    req: AuthRequest<OAuthProviderParam, unknown, OAuthConsentQuery>,
    res: Response
  ) {
    const { provider } = req.locals!.params!;
    const { consentAt, deviceId, redirectTo } = req.locals!.query!;
    const userId = req.locals!.user?.id; // May be undefined if the user is not logged in

    const redirectUrl = getOauthUrl(
      provider,
      consentAt,
      deviceId,
      redirectTo,
      userId
    );

    res.redirect(redirectUrl);
  },

  /**
   * @summary OAuth callback
   * @description GET /auth/oauth/:provider/callback
   * Handles the callback from an OAuth provider (e.g., Google, GitHub).
   * The behavior depends on the user's current authentication state:
   * - `not logged in` & `user exists` = `login`
   * - `not logged in` & `user not exists` = `register`
   * - `logged in` & `account has not linked` = `link`
   */
  async oauthCallback(
    req: AuthRequest<OAuthProviderParam>,
    res: Response<AuthResponse>
  ) {
    try {
      const { provider } = req.locals!.params!;
      const { code, state: stateStr } = req.query;

      if (!(provider in OauthServiceMap))
        return res.redirect(
          `${process.env.FRONTEND_ORIGIN}/auth?error=invalid_provider`
        );

      if (!stateStr || typeof stateStr !== "string")
        return res.redirect(
          `${process.env.FRONTEND_ORIGIN}/auth?error=invalid_state`
        );

      if (!code || typeof code !== "string")
        return res.redirect(
          `${process.env.FRONTEND_ORIGIN}/auth?error=invalid_code`
        );

      const decodedState = verifyJwt(stateStr);
      if ("expired" in decodedState || "invalid" in decodedState)
        return res.redirect(
          `${process.env.FRONTEND_ORIGIN}/auth?error=invalid_state`
        );
      if (!("valid" in decodedState))
        return res.redirect(
          `${process.env.FRONTEND_ORIGIN}/auth?error=invalid_state`
        );

      const { state: rawState, type } = decodedState.valid as {
        user?: User;
        state?: string;
        type: "access" | "refresh" | "state";
      };

      if (type !== "state")
        return res.redirect(
          `${process.env.FRONTEND_ORIGIN}/auth?error=invalid_state`
        );

      const parsedState = OauthStateSchema.safeParse(rawState!);
      if (!parsedState.success)
        return res.redirect(
          `${process.env.FRONTEND_ORIGIN}/auth?error=invalid_state`
        );

      let userId = parsedState.data.userId; // May be undefined or null if the user is not logged in
      const { deviceId, consentAt, redirectTo } = parsedState.data;

      const userInfo = await OauthServiceMap[provider].parseCallback(code);

      // We perform the `link` logic for a logged-in user.
      const isLoggedIn = userId !== undefined && userId !== null;
      if (isLoggedIn) {
        await linkOauthAccount(userId!, provider, userInfo);
      } else {
        // We perform the `login/register` logic for a un-logged-in user.

        userId = await loginOauthUser(provider, userInfo);

        // Performs the `register` logic if the user does not exist.
        if (!userId) {
          const response = await registerUser(
            consentAt,
            true,
            deviceId,
            "",
            "",
            userInfo.avatar,
            provider,
            userInfo.id
          );

          userId = response.id;
        }
      }

      // Should not be here, because either we found a user or registered a new one.
      if (!userId)
        return res.redirect(
          `${process.env.FRONTEND_ORIGIN}/auth?error=invalid_user`
        );

      // We check the user, may throw if the user is deleted.
      const checkedUser = await verifyUser(userId, "", false);

      // Issue new tokens, for login we revoke only the current device's refresh token
      const tokens = await issueUserTokens(
        checkedUser.id,
        checkedUser.isAdmin,
        deviceId,
        false
      );

      const hashParams = new URLSearchParams();
      hashParams.set("accessToken", tokens.accessToken);
      hashParams.set("redirectTo", redirectTo);
      res.redirect(
        `${process.env.FRONTEND_ORIGIN}/auth#${hashParams.toString()}`
      );
    } catch (err: any) {
      if (err.status === 409)
        return res.redirect(
          `${process.env.FRONTEND_ORIGIN}/auth?error=user_already_exists`
        );
      console.error(err);
      return res.redirect(
        `${process.env.FRONTEND_ORIGIN}/auth?error=invalid_state`
      );
    }
  },

  /**
   * @description GET /auth/oauth/userinfo
   */
  async oauthUserGetInfo(
    req: AuthRequest<unknown, unknown, DeviceIdQuery>,
    res: Response<AuthResponse>
  ) {
    const { id: userId } = req.locals!.user!;
    const { deviceId } = req.locals!.query!;
    const user = await prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      include: { oauthAccounts: { select: { provider: true } } },
    });
    if (!user) return terminateWithErr(404, "User not found");
    const tokens = await issueUserTokens(user.id, user.isAdmin, deviceId, true);
    res.status(200).json(generate_user_response(user, tokens));
  },

  /**
   * @description DELETE /auth/oauth/unlink/:provider
   */
  async unlinkOauth(
    req: AuthRequest<OAuthProviderParam>,
    res: Response<{ message: string }>
  ) {
    const { provider } = req.locals!.params!;
    const { id: userId } = req.locals!.user!;

    const user: Prisma.UserGetPayload<{
      include: { oauthAccounts: { select: { provider: true } } };
    }> | null = await prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      include: { oauthAccounts: { select: { provider: true } } },
    });

    if (
      !user || // User not found
      !user.oauthAccounts.some((account) => account.provider === provider) // User does not have the provider linked
    )
      return terminateWithErr(404, "User not found");

    // It's not allowed to unlink the last OAuth account if the user has no password.
    if (user.oauthAccounts.length === 1 && user.encryptedPwd === null)
      return terminateWithErr(
        422,
        "Cannot unlink the last OAuth account, please set a password first"
      );

    // Delete it, it's an idempotent operation
    await prisma.oauthAccount.deleteMany({
      where: {
        userId,
        provider,
      },
    });

    res.status(204).send();
  },

  /**
   * @summary Delete user
   * @description DELETE /auth:userId
   * We apply soft delete here.
   */
  async deleteUser(req: AuthRequest<UserIdParam>, res: Response) {
    const { userId } = req.locals!.params!;

    const { id } = req.locals!.user!;

    const doubleCheck = async (): Promise<boolean> => {
      const exists = await prisma.user.findFirst({
        where: { id, deletedAt: null },
        select: { isAdmin: true },
      });
      return exists !== null && exists.isAdmin;
    };

    if (id !== userId && !(await doubleCheck()))
      return terminateWithErr(
        403,
        "Forbidden: only admin or the user itself can delete"
      );

    const deleted = await prisma.user.updateMany({
      where: { id: userId, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    if (deleted.count === 0) return terminateWithErr(404, "User not found");

    // Also delete all the oauth accounts
    await prisma.oauthAccount.deleteMany({ where: { userId } });

    // Revoke all refresh tokens
    await revokeRefreshToken(userId);

    res.status(204).send();
  },
};

export default authController;
