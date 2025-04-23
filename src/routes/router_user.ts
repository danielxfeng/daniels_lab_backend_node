/**
 * @file router_user.ts
 * @description The definition of user routers.
 * There are 4 main routes:
 * 1. Get current user profile.
 * 2. Update current user info.
 * 3. List all users (admin only).
 * 4. Delete a user (admin only).
 */

import { Router } from "express";

const userRouter = Router();

userRouter.get("/", (req, res) => {
  res.status(200).json({ message: "User profile to be implemented" });
});

userRouter.put("/", (req, res) => {
  res.status(200).json({ message: "Update user profile to be implemented" });
});

userRouter.get("/all", (req, res) => {
  res.status(200).json({ message: "Admin: List users to be implemented" });
});

export default userRouter;
