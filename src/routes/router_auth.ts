/**
 * @file router_auth.ts
 * @description The definition of auth routers.
 * There are endpoints:
 * - register a new user
 * - user login
 * - user change password
 * - oauthUser set password
 * - join admin
 * - refresh access token
 * - logout
 * - oauth login GET
 * - oauth login POST
 * - oauth user info
 * - oauth callback
 * - unlink oauth provider
 * - delete user
 * - get user by username
 */

import { Router } from "express";
import validate from "../middleware/validate";
import { auth, optAuth } from "../middleware/auth";
import authController from "../controllers/controller_auth";
import {
  ChangePasswordBodySchema,
  DeviceIdBodySchema,
  JoinAdminBodySchema,
  LoginBodySchema,
  OAuthConsentQuerySchema,
  OAuthProviderParamSchema,
  RefreshTokenBodySchema,
  RegisterBodySchema,
  SetPasswordBodySchema,
  UserNameBodySchema,
} from "../schema/schema_auth";
import { UserIdParamSchema } from "../schema/schema_users";
import rateLimit from "express-rate-limit";

const authRouter = Router();

const sensitiveRateLimit = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10), // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_AUTH || "5", 10),
  message: "Too many requests, please try again later.",
  skip: () => process.env.SEED === "true" || process.env.NODE_ENV === "test",
};

authRouter.post(
  "/register",
  rateLimit(sensitiveRateLimit),
  validate({ body: RegisterBodySchema }),
  authController.register
);

authRouter.post(
  "/login",
  rateLimit(sensitiveRateLimit),
  validate({ body: LoginBodySchema }),
  authController.login
);

authRouter.post(
  "/change-password",
  rateLimit(sensitiveRateLimit),
  auth,
  validate({ body: ChangePasswordBodySchema }),
  authController.changePassword
);

authRouter.post(
  "/set-password",
  rateLimit(sensitiveRateLimit),
  auth,
  validate({ body: SetPasswordBodySchema }),
  authController.setPassword
);

authRouter.post(
  "/refresh",
  rateLimit(sensitiveRateLimit),
  validate({ body: RefreshTokenBodySchema }),
  authController.refresh
);

authRouter.post(
  "/logout",
  auth,
  validate({ body: DeviceIdBodySchema }),
  authController.logout
);

authRouter.post(
  "/oauth/:provider",
  optAuth,
  validate({
    params: OAuthProviderParamSchema,
    body: OAuthConsentQuerySchema,
  }),
  authController.oauthLoginPost
);

authRouter.put(
  "/join-admin",
  rateLimit(sensitiveRateLimit),
  auth,
  validate({ body: JoinAdminBodySchema }),
  authController.joinAdmin
);

authRouter.get(
  "/username/:username",
  validate({ params: UserNameBodySchema }),
  authController.checkUsername
);

authRouter.get(
  "/oauth/userinfo",
  auth,
  validate({ query: DeviceIdBodySchema }),
  authController.oauthUserGetInfo
);

authRouter.get(
  "/oauth/callback/:provider",
  validate({ params: OAuthProviderParamSchema }),
  authController.oauthCallback
);

authRouter.delete(
  "/oauth/unlink/:provider",
  auth,
  validate({ params: OAuthProviderParamSchema }),
  authController.unlinkOauth
);

authRouter.get(
  "/oauth/:provider",
  optAuth,
  validate({
    params: OAuthProviderParamSchema,
    query: OAuthConsentQuerySchema,
  }),
  authController.oauthLogin
);

authRouter.delete(
  "/:userId",
  rateLimit(sensitiveRateLimit),
  auth,
  validate({ params: UserIdParamSchema }),
  authController.deleteUser
);

export default authRouter;
