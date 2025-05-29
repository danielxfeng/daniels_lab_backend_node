/**
 * @File app.ts
 * This is the main entry point of the application,
 * which defines the processing pipeline of the web server.
 *
 * 1. loads env.
 * 2. initializes express.
 * 3. loads pre-processing middlewares.
 *   - to parse json.
 *   - to parse urlencoded data.
 *   - to host static files.
 *   - ...
 * 4. loads route, which is the main logic of the pipeline.
 * 5. loads post-processing middlewares.
 *   - error handler.
 * 6. starts the server and listens on the specified port.
 */

import express from "express";
import path from "path";
import cors from "cors";
import routers from "./routes/router_index";
import errorHandler from "./middleware/error_handler";
import loadEnv from "./utils/load_env";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";

// Import env
loadEnv();

// Init express
const app = express();

// Security middlewares
app.use(helmet());
// - Pre-processing middlewares
// Allow CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  })
);
// Logging middleware
if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "prod" ? "combined" : "dev"));
}
// to parse json
app.use(express.json());
// to parse urlencoded data
app.use(express.urlencoded({ extended: true }));
// to host static files
app.use(express.static(path.join(__dirname, "../public")));
// gzip compression
app.use(compression());
// Rate limiting middleware
app.use(
  rateLimit({
    windowMs: process.env.RATE_LIMIT_WINDOW_MS
      ? parseInt(process.env.RATE_LIMIT_WINDOW_MS)
      : 15 * 60 * 1000,
    max: process.env.RATE_LIMIT_MAX
      ? parseInt(process.env.RATE_LIMIT_MAX)
      : 100,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.SEED === "true" || process.env.NODE_ENV === "test",
  })
);

// The routers, as well as the main logic of the pipeline.
app.use("/", routers);

// - Post-processing middlewares

// In Express 5, all the errors are passed to here.
app.use(errorHandler);

// Start server
const PORT: number = parseInt(process.env.PORT || "3000", 10);
app.listen(PORT, () => {
  console.log(`Server is running at ${process.env.BASE_URL} port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

export default app;
