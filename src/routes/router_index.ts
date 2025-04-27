/**
 * @file router_index.ts
 * @description The definition of main router, api routers, and 404 handler.
 *
 * API routers:
 * 1. Auth router
 * 2. User router
 * 3. Post router
 * 4. Comment router
 * 5. Like router
 * 6. Swagger UI
 */

import { Router } from "express";
import authRouter from "./router_auth";
import userRouter from "./router_user";
import postRouter from "./router_post";
import commentRouter from "./router_comment";
import likeRouter from "./router_like";
import tagRouter from "./router_tag";
import swaggerUi from "swagger-ui-express";
import { openApiDocument } from "../utils/openapi_documents/openapi";
import { terminateWithErr } from "../utils/terminate_with_err";

const routers = Router();

//
// API router
//

const apiRouter = Router();

const apiRouters: [string, Router][] = [
  ["/auth", authRouter],
  ["/users", userRouter],
  ["/blog/posts", postRouter],
  ["/blog/likes", likeRouter],
  ["/blog/comments", commentRouter],
  ["/blog/tags", tagRouter],
] as const;

apiRouters.forEach(([path, router]) => {
  apiRouter.use(path, router);
});

// Swagger UI
apiRouter.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

// Health check
apiRouter.get("/health", (req, res) => {
  res.status(200).json({
    message: "OK",
  });
});

//
// Main Router
//

routers.use("/api", apiRouter);

//
// 404 handler, if no route matched
//

routers.use((req, res, next) => {
  terminateWithErr(404, "Not Found");
});

export default routers;
