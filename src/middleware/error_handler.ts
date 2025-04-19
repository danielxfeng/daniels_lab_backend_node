/**
 * @file error_handler.ts
 * @description Middleware to handle errors in the application.
 * It's the last middleware in the stack.
 */
import { Request, Response, NextFunction } from "express";

/**
 * @summary Middleware to handle errors in the application.
 * @description It logs the error and sends a JSON response to the client.
 * In production, it does not send the stack trace to the client,
 * however, in development it does.
 * In Express 5, all the errors are passed to here.
 *
 * @param err The error object.
 * @param req The request object.
 * @param res The response object.
 * @param next The next middleware function, not used, but required by Express.
 * @returns {void}
 */
const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Check the environment.
  const isProd = process.env.NODE_ENV === "production";

  // Check if the error is an internal server error.
  const isInternal = err.status >= 500 && err.status < 600;

  // Log the error.
  console.error(err);

  // Send the response, with the error message and status code.
  res.status(err.status || 500).json({
    message: !isProd || !isInternal ? err.message : "Internal Server Error",
    errors: !isProd || !isInternal ? err.errors : undefined,
    ...(isProd ? {} : { stack: err.stack }),
  });
};

export default errorHandler;
