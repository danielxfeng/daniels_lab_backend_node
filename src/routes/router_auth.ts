/**
 * @file router_auth.ts
 * @description The definition of auth routers.
 * There are 8 endpoints:
 * 1. register a new user
 * 2. user login
 * 3. user change password
 * 4. oauthUser set password
 * 5. join admin
 * 6. refresh access token
 * 7. logout
 * 8. oauth login
 * 9. oauth callback
 * 10. unlink oauth provider
 * 11. delete user
 * 12. get user by username
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

const authRouter = Router();

authRouter.post(
  "/register",
  validate({ body: RegisterBodySchema }),
  authController.register
);

authRouter.post(
  "/login",
  validate({ body: LoginBodySchema }),
  authController.login
);

authRouter.post(
  "/change-password",
  auth,
  validate({ body: ChangePasswordBodySchema }),
  authController.changePassword
);

authRouter.post(
  "/set-password",
  auth,
  validate({ body: SetPasswordBodySchema }),
  authController.setPassword
);

authRouter.post(
  "/refresh",
  validate({ body: RefreshTokenBodySchema }),
  authController.refresh
);

authRouter.post(
  "/logout",
  auth,
  validate({ body: DeviceIdBodySchema }),
  authController.logout
);

authRouter.put(
  "/join-admin",
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
  "/oauth/:provider",
  optAuth,
  validate({
    params: OAuthProviderParamSchema,
    query: OAuthConsentQuerySchema,
  }),
  authController.oauthLogin
);

authRouter.get(
  "/oauth/:provider/callback",
  validate({ params: OAuthProviderParamSchema }),
  authController.oauthCallback
);

authRouter.get(
  "/oauth/userinfo",
  auth,
  validate({ query: DeviceIdBodySchema }),
  authController.oauthUserGetInfo
);

authRouter.delete(
  "/oauth/unlink/:provider",
  auth,
  validate({ params: OAuthProviderParamSchema }),
  authController.unlinkOauth
);

authRouter.delete(
  "/:userId",
  auth,
  validate({ params: UserIdParamSchema }),
  authController.deleteUser
);

export default authRouter;
