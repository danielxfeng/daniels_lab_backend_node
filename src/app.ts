/**
 * @File app.ts
 * This is the main entry point of the application.
 * 
 * 1. loads env.
 * 2. initializes express.
 * 3. loads middlewares.
 * 4. loads routes.
 * 5. handles 404 errors if no route is matched.
 * 6. handles other errors, the error handler middleware brings the request here.
 * 7. starts the server.
 * 8. listens on the specified port.
 */

import express from "express";
import dotenv from "dotenv";
import path from "path";
import httpErrors from "http-errors";

// Import env
const envFile = `.env.${process.env.NODE_ENV || "development"}`;
dotenv.config({ path: path.resolve(__dirname, `../${envFile}`) });

// Init express
const app = express();

// Load middlewares
// todo: add middlewares

// Load routes
// todo: add routes

// 404 handler
// When no route is matched, will call this.
app.use((req, res, next) => {
  next(httpErrors(httpErrors.NotFound, "Not Found"));
});

// Error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const isProd = process.env.NODE_ENV === "production";
    const isInteral = err.status >= 500 && err.status < 600;

    console.error(err);
    res.status(err.status || httpErrors.InternalServerError).json({
      error: !isProd || !isInteral ? err.message : "Internal Server Error",
    });
  }
);
