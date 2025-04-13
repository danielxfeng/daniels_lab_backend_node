/**
 * @File app.ts
 * This is the main entry point of the application.
 *
 * 1. loads env.
 * 2. initializes express.
 * 3. loads middlewares.
 * 4. loads routes.
 * 5. handles 404 errors if no route is matched.
 * 6. handles other errors (via error handler middleware).
 * 7. starts the server and listens on the specified port.
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
  next(httpErrors(404, "Not Found"));
});

// Error handler
// Log the error and send the response.
// Will not send the internal error message in production.
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const isProd = process.env.NODE_ENV === "production";
    const isInternal = err.status >= 500 && err.status < 600;

    console.error(err);
    res.status(err.status || 500).json({
      error: !isProd || !isInternal ? err.message : "Internal Server Error",
    });
  }
);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

export default app;
