/**
 * @file auth.ts
 * @description Middleware to validate the authentication.
 * The authentication is divided by RBAC and ABAC in this project.
 * It handles the RBAC (Role-Based Access Control) for the APIs.
 * For ABAC (Attribute-Based Access Control), please refer to the `services` level.
 *
 * @remark
 * - A middleware in Express is a closure function.
 * 1. It takes `req`, `res`, and `next` as parameters.
 * 2. Then the middleware can terminate the pipeline by throwing an error
 *    which will be caught by error handling middleware defined in `app.ts`.
 * 3. Or it will pass the request to next node in the pipeline.
 * 4. It can also have side effects like modifying the request or response.
 */

import { Request, Response, NextFunction } from "express";
import { verifyJwt } from "../utils/jwt_tools/verify_jwt";
import { VerifiedToken } from "../utils/jwt_tools/verify_jwt";
import { terminateWithErr } from "../utils/terminate_with_err";
import { User, AuthRequest } from "../types/type_auth";

/**
 * @summary Helper function to validate the authentication and RBAC.
 * @param req the request object
 * @param requireAdmin is the user required to be admin
 * @param optional is the authentication optional
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

  // If no token is provided, throw 401 unless optional is true
  if (!token) {
    if (optional) return;
    terminateWithErr(401, "No token provided");
  }

  // Verify and parse the JWT token
  const decodedToken: VerifiedToken = verifyJwt(token as string);

  // Throw 498 if the token is expired
  if ("expired" in decodedToken) return terminateWithErr(498, "Token expired");

  // Throw 401 if the token is invalid
  if ("invalid" in decodedToken) return terminateWithErr(401, "Invalid token");

  // Should not reach here
  if (!("valid" in decodedToken)) return terminateWithErr(500, "Unknown token error");

  const { user, type } = decodedToken.valid as {
    user?: User;
    state?: string;
    type: "access" | "refresh" | "state";
  };

  if (type !== "access") return terminateWithErr(401, "Invalid token");

  // If the user role does not match, throw 403
  if (requireAdmin && !user!.isAdmin) return terminateWithErr(403, "Forbidden");

  // Attach the user to the request object and return
  (req as AuthRequest).locals = (req as AuthRequest).locals || {};
  (req as AuthRequest).locals!.user = user;
};

/**
 * @summary Middleware to validate the authentication and RBAC (registered user only).
 * @description This middleware handles authentication and Role-Based Access Control (RBAC)
 * for admin-only APIs. It validates the JWT token and checks whether the user is an admin.
 * Since JWT represents a snapshot of user data at the time it was issued,
 * the potential inconsistency in user state during the token’s lifetime should be tolerated.
 * However, a service-level check can be performed to verify current user data, and ABAC
 * can be applied at that stage if needed.
 *
 * @param req the request object
 * @param res the response object
 * @param next the next function
 * @throws 401 if invalid token, or no token is provided
 * @throws 498 if the token is expired
 * @throws 403 if the user is not admin
 * @throws 500 for unknown errors
 */
const auth = (req: Request, res: Response, next: NextFunction) => {
  // requireAdmin is false
  authHelper(req, false);

  // Call next node in the pipeline
  next();
};

/**
 * @summary Middleware to validate the authentication and RBAC (admin only).
 * @description This middleware handles authentication and Role-Based Access Control (RBAC)
 * for admin-only APIs. It validates the JWT token and checks whether the user is an admin.
 * Since JWT represents a snapshot of user data at the time it was issued,
 * the potential inconsistency in user state during the token’s lifetime should be tolerated.
 * However, a service-level check can be performed to verify current user data, and ABAC
 * can be applied at that stage if needed.
 *
 * @param req the request object
 * @param res the response object
 * @param next the next function
 * @throws 401 if no token is provided, or invalid token
 * @throws 498 if the token is expired
 * @throws 403 if the user is not admin
 * @throws 500 for unknown errors
 */
const authAdmin = (req: Request, res: Response, next: NextFunction) => {
  // requireAdmin is true
  authHelper(req, true);

  // Call next node in the pipeline
  next();
};

/**
 * @summary Middleware to attach the authentication information.
 * @description This middleware handles authentication and Role-Based Access Control (RBAC)
 * for optional Authentication APIs.
 * If there is no token, it's fine, but expired token or invalid token will throw 498 or 401.
 * It validates the JWT token and checks whether the user is an admin.
 * Since JWT represents a snapshot of user data at the time it was issued,
 * the potential inconsistency in user state during the token’s lifetime should be tolerated.
 * However, a service-level check can be performed to verify current user data, and ABAC
 * can be applied at that stage if needed.
 *
 * @param req the request object
 * @param res the response object
 * @param next the next function
 * @throws 401 if token is invalid
 * @throws 498 if the token is expired
 * @throws 403 if the user is not admin
 * @throws 500 for unknown errors
 */
const optAuth = (req: Request, res: Response, next: NextFunction) => {
  authHelper(req, false, true);

  next();
};

export { auth, authAdmin, optAuth };
