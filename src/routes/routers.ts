/**
 * @File routers.ts
 * The definition of routers.
 *
 * 1. Auth router
 * 2. User router
 * 3. Post router
 * 4. Comment router
 */

import { Router } from "express";
import commentRouter from "./routers_comment";

const routers = Router();

routers.use("/auth", (req, res) => {
  res.status(200).json({message: "Auth is to be implemented"});
});

routers.use("/user", (req, res) => {
  res.status(200).json({message: "User is to be implemented"});
});

routers.use("/post", (req, res) => {
  res.status(200).json({message: "Post is to be implemented"});
});

routers.use("/comment", commentRouter);

export default routers;
