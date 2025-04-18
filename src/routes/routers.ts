/**
 * @file routers.ts
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
import authRouter from "./routers_auth";
import userRouter from "./router_user";
import postRouter from "./routers_post";
import commentRouter from "./routers_comment";
import likeRouter from "./route_like";
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
  ] as const;

apiRouters.forEach(([path, router]) => {
    apiRouter.use(path, router);
});

// Swagger UI
apiRouter.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

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
