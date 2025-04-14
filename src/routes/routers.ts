/**
 * @File routers.ts
 * The defination of routers.
 *
 * 1. Auth router
 * 2. User router
 * 3. Post router
 * 4. Comment router
 */

import { Router } from "express";

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

routers.use("/comment", (req, res) => {
  res.status(200).json({message: "Comment is to be implemented"});
});

export default routers;
