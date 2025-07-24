/**
 * @file error_handler.ts
 * @description Middleware to handle errors in the application.
 * It's the last middleware in the stack.
 */
import { Request, Response, NextFunction } from "express";

/**
 * @summary Middleware to handle errors in the application.
 */
const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const isProd = process.env.NODE_ENV === "production";

  const isInternal = err.status >= 500 && err.status < 600;

  if (!isProd) console.error(JSON.stringify(err));

  res.status(err.status || 500).json({
    message: !isProd || !isInternal ? err.message : "Internal Server Error",
    errors: !isProd || !isInternal ? err.errors : undefined,
  });
};

export default errorHandler;
