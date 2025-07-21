/**
 * @file auth.ts
 * @description Middleware to validate the authentication.
 * The authentication is divided by RBAC and ABAC in this project.
 * It handles the RBAC (Role-Based Access Control) for the APIs.
 * For ABAC (Attribute-Based Access Control), please refer to the `services` level.
 */

import { Request, Response, NextFunction } from "express";
import { verifyJwt } from "../utils/jwt_tools/verify_jwt";
import { VerifiedToken } from "../utils/jwt_tools/verify_jwt";
import { terminateWithErr } from "../utils/terminate_with_err";
import { User, AuthRequest } from "../types/type_auth";

/**
 * @summary Helper function to validate the authentication and RBAC.
 */
const authHelper = (
  req: Request,
  requireAdmin: boolean,
  optional: boolean = false
): void => {
  // Get the token from the request headers
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : undefined;

  if (!token) {
    if (optional) return;
    terminateWithErr(401, "No token provided");
  }

  const decodedToken: VerifiedToken = verifyJwt(token as string);

  if ("expired" in decodedToken) return terminateWithErr(498, "Token expired");
  if ("invalid" in decodedToken) return terminateWithErr(401, "Invalid token");

  // Should not reach here
  if (!("valid" in decodedToken)) return terminateWithErr(500, "Unknown token error");

  const { user, type } = decodedToken.valid as {
    user?: User;
    state?: string;
    type: "access" | "refresh" | "state";
  };

  if (type !== "access") return terminateWithErr(401, "Invalid token");

  if (requireAdmin && !user!.isAdmin) return terminateWithErr(403, "Forbidden");

  (req as AuthRequest).locals = (req as AuthRequest).locals || {};
  (req as AuthRequest).locals!.user = user;
};

/**
 * @summary Middleware to validate the authentication and RBAC (registered user only).
 */
const auth = (req: Request, res: Response, next: NextFunction) => {
  authHelper(req, false);
  next();
};

/**
 * @summary Middleware to validate the authentication and RBAC (admin only).
 */
const authAdmin = (req: Request, res: Response, next: NextFunction) => {
  authHelper(req, true);
  next();
};

/**
 * @summary Middleware to attach the authentication information.
 */
const optAuth = (req: Request, res: Response, next: NextFunction) => {
  authHelper(req, false, true);
  next();
};

export { auth, authAdmin, optAuth };
