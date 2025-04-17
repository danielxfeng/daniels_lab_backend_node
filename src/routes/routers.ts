/**
 * @file routers.ts
 * @description The definition of routers.
 *
 * 1. Auth router
 * 2. User router
 * 3. Post router
 * 4. Comment router
 * 5. Like router
 * 5. Swagger UI
 */

import { Router } from "express";
import authRouter from "./routers_auth";
import userRouter from "./router_user";
import postRouter from "./routers_post";
import commentRouter from "./routers_comment";
import likeRouter from "./route_like";
import swaggerUi from "swagger-ui-express";
import { openApiDocument } from "../utils/openapi_documents/openapi";

const routers = Router();

routers.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
routers.use("/auth", authRouter);
routers.use("/users", userRouter);
routers.use("/blog/posts", postRouter);
routers.use("/blog/likes", likeRouter);
routers.use("/blog/comments", commentRouter);

export default routers;
