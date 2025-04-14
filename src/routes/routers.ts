/**
 * @File routers.ts
 * The definition of routers.
 *
 * 1. Auth router
 * 2. User router
 * 3. Post router
 * 4. Comment router
 * 5. Swagger UI
 */

import { Router } from "express";
import authRouter from "./routers_auth";
import userRouter from "./router_user";
import postRouter from "./routers_post";
import commentRouter from "./routers_comment";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "../../swagger.json";

const routers = Router();

routers.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
routers.use("/auth", authRouter);
routers.use("/users", userRouter);
routers.use("/posts", postRouter);
routers.use("/comments", commentRouter);

export default routers;
