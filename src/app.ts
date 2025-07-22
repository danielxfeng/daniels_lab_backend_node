/**
 * @File app.ts
 * This is the main entry point of the application,
 */

import express from "express";
import path from "path";
import cors from "cors";
import "./utils/instrument.js";
import routers from "./routes/router_index";
import errorHandler from "./middleware/error_handler";
import loadEnv from "./utils/load_env";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import * as Sentry from "@sentry/node";

loadEnv();
const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  })
);

if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "prod" ? "combined" : "dev"));
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));
app.use(compression());
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

app.use("/", routers);

Sentry.setupExpressErrorHandler(app);

app.use(errorHandler);

const PORT: number = parseInt(process.env.PORT || "3000", 10);
app.listen(PORT, () => {
  console.log(`Server is running at ${process.env.BASE_URL} port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

export default app;
