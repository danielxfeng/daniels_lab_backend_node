/**
 * @file router_auth.ts
 * @description The definition of auth routers.
 * There are 8 endpoints:
 * 1. register a new user
 * 2. user login
 * 3. user change password
 * 4. join admin
 * 5. refresh access token
 * 6. logout
 * 7. oauth login
 * 8. oauth callback
 * 9. unlink oauth provider
 * 10. delete user
 * 11. get user by username
 */

import { Router } from "express";

const authRouter = Router();

authRouter.post("/register", (req, res) => {
  res.status(201).json({ message: "Register to be implemented" });
});

authRouter.post("/login", (req, res) => {
  res.status(200).json({ message: "Login to be implemented" });
});

authRouter.post("/change-password", (req, res) => {
  res.status(200).json({ message: "Join feature is to be implemented" });
});

authRouter.put("/join-admin", (req, res) => {
  res.status(200).json({ message: "Unlink provider to be implemented" });
});

authRouter.post("/refresh", (req, res) => {
  res.status(200).json({ message: "Refresh to be implemented" });
});

authRouter.post("/logout", (req, res) => {
  res.status(204).send();
});

authRouter.get("/username/:username", (req, res) => {
  res.status(200).json({ message: "Get user by username to be implemented" });
});

authRouter.get("/oauth/:provider", (req, res) => {
  res.status(302).json({ message: "OAuth redirect to be implemented" });
});

authRouter.get("/oauth/:provider/callback", (req, res) => {
  res.status(200).json({ message: "OAuth callback to be implemented" });
});

authRouter.delete("/oauth/unlink/:provider", (req, res) => {
  res.status(200).json({ message: "Unlink provider to be implemented" });
});

authRouter.delete("/:userId", (req, res) => {
  res.status(204).send();
});


export default authRouter;
