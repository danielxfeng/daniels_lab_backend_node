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
 */
const authHelper = (req: Request, requireAdmin: boolean): void => {
  // Get the token from the request headers
  const token = req.headers.authorization?.split(" ")[1];

  // If no token is provided, throw 401
  if (!token) terminateWithErr(401, "No token provided");

  // Verify and parse the JWT token
  const decodedToken: VerifiedToken = verifyJwt(token as string);

  // Throw 498 if the token is expired
  if ("expired" in decodedToken) terminateWithErr(498, "Token expired");

  // Throw 401 if the token is invalid
  if ("invalid" in decodedToken) terminateWithErr(401, "Invalid token");

  // Should not reach here
  if (!("valid" in decodedToken)) terminateWithErr(500, "Unknown token error");

  // Extract the user from the decoded token, would throw 500 if the type is not matched
  const user: User = (decodedToken as { valid: User }).valid;

  // If the user role does not match, throw 403
  if (requireAdmin && !user.isAdmin) {
    terminateWithErr(403, "Forbidden");
  }

  // Attach the user to the request object and return
  (req as AuthRequest).user = user;
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
 * @throws 401 if no token is provided
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
 * @throws 401 if no token is provided
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

export { auth, authAdmin };
