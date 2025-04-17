/**
 * @file routers_auth.ts
 * @description The definition of auth routers.
 * There are 8 endpoints:
 * 1. register a new user
 * 2. user login
 * 3. user change password
 * 4. refresh access token
 * 5. logout
 * 6. oauth login
 * 7. oauth callback
 * 8. unlink oauth provider
 */

import { Router } from "express";

const authRouter = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - confirmPassword
 *               - consent
 *             properties:
 *               username:
 *                 type: string
 *                 example: "newuser"
 *                 minLength: 1
 *                 maxLength: 50
 *                 pattern: "^[a-zA-Z0-9._-]+$"
 *                 description: Must contain only letters, numbers, dots, hyphens, or underscores.
 *               consent:
 *                 type: boolean
 *                 example: true
 *                 description: Whether the user consents to the terms and conditions (must be true)
 *               password:
 *                 type: string
 *                 example: "$Passw0rd1111"
 *                 minLength: 8
 *                 maxLength: 50
 *                 description: Must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.
 *               avatarUrl:
 *                 type: string
 *                 format: uri
 *                 example: "https://example.com/avatar.jpg"
 *                 minLength: 15
 *                 maxLength: 200
 *     responses:
 *       201:
 *         description: User registered successfully
 *         headers:
 *           Location:
 *             description: URL of the created user profile
 *             schema:
 *               type: string
 *               example: /users/user1
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   example: "aaa.bbb"
 *                 refreshToken:
 *                   type: string
 *                   example: "bbb.ccc"
 *                 id:
 *                   type: string
 *                   example: "user1"
 *                 username:
 *                   type: string
 *                   example: "johndoe"
 *                 avatarUrl:
 *                   type: string
 *                   format: uri
 *                   example: "https://example.com/avatar.jpg"
 *                 role:
 *                   type: string
 *                   example: "user"
 *       400:
 *         description: Invalid input
 */
authRouter.post("/register", (req, res) => {
  res.status(201).json({ message: "Register to be implemented" });
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with username and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: "newuser"
 *                 minLength: 1
 *                 maxLength: 50
 *                 pattern: "^[a-zA-Z0-9._-]+$"
 *                 description: Must contain only letters, numbers, dots, hyphens, or underscores.
 *               password:
 *                 type: string
 *                 example: "$Passw0rd1111"
 *                 minLength: 8
 *                 maxLength: 50
 *                 description: Must match the password field.
 *     responses:
 *       200:
 *         description: Login successful, returns tokens
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   example: "aaa.bbb"
 *                 refreshToken:
 *                   type: string
 *                   example: "bbb.ccc"
 *                 id:
 *                   type: string
 *                   example: "user1"
 *                 username:
 *                   type: string
 *                   example: "johndoe"
 *                 avatarUrl:
 *                   type: string
 *                   format: uri
 *                   example: "https://example.com/avatar.jpg"
 *                 role:
 *                   type: string
 *                   example: "user"
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Invalid credentials
 */
authRouter.post("/login", (req, res) => {
  res.status(200).json({ message: "Login to be implemented" });
});

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Change current user's password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 example: "$Passw0rd1111"
 *                 minLength: 8
 *                 maxLength: 50
 *                 description: Must match the password field.
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   example: "aaa.bbb"
 *                 refreshToken:
 *                   type: string
 *                   example: "bbb.ccc"
 *                 id:
 *                   type: string
 *                   example: "user1"
 *                 username:
 *                   type: string
 *                   example: "johndoe"
 *                 avatarUrl:
 *                   type: string
 *                   format: uri
 *                   example: "https://example.com/avatar.jpg"
 *                 role:
 *                   type: string
 *                   example: "user"
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized or current password incorrect
 */
authRouter.post("/change-password", (req, res) => {
  res.status(200).json({ message: "Join feature is to be implemented" });
});

/**
 * @swagger
 * /api/auth/join-admin:
 *   put:
 *     summary: Join admin role
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - referenceCode
 *             properties:
 *               referenceCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Joined admin role successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Invalid reference code
 */
authRouter.put("/join-admin", (req, res) => {
  res.status(200).json({ message: "Unlink provider to be implemented" });
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: "aaaaaa.bbbbbb.cccccc"
 *     responses:
 *       200:
 *         description: New access token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   example: "aaa.bbb"
 *                 refreshToken:
 *                   type: string
 *                   example: "bbb.ccc"
 *       403:
 *         description: Invalid or expired refresh token
 */
authRouter.post("/refresh", (req, res) => {
  res.status(200).json({ message: "Refresh to be implemented" });
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout current user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Logout successful
 */
authRouter.post("/logout", (req, res) => {
  res.status(204).send();
});

/**
 * @swagger
 * /api/auth/oauth/{provider}:
 *   get:
 *     summary: Start OAuth flow with a provider
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *           enum: [google, github]
 *         description: OAuth provider name
 *       - in: query
 *         name: consent
 *         required: true
 *         schema:
 *           type: boolean
 *         description: Whether the user consents to the terms and conditions (must be true)
 *     responses:
 *       302:
 *         description: Redirects to the provider's OAuth consent screen
 *       400:
 *         description: Invalid provider or missing consent
 */
authRouter.get("/oauth/:provider", (req, res) => {
  res.status(302).json({ message: "OAuth redirect to be implemented" });
});

/**
 * @swagger
 * /api/auth/oauth/{provider}/callback:
 *   get:
 *     summary: OAuth callback
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *           enum: [google, github]
 *         description: OAuth provider name
 *     responses:
 *       200:
 *         description: OAuth login success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   example: "aaa.bbb"
 *                 refreshToken:
 *                   type: string
 *                   example: "bbb.ccc"
 *                 id:
 *                   type: string
 *                   example: "user1"
 *                 username:
 *                   type: string
 *                   example: "johndoe"
 *                 avatarUrl:
 *                   type: string
 *                   format: uri
 *                   example: "https://example.com/avatar.jpg"
 *                 role:
 *                   type: string
 *                   example: "user"
 *       400:
 *         description: OAuth failed
 */
authRouter.get("/oauth/:provider/callback", (req, res) => {
  res.status(200).json({ message: "OAuth callback to be implemented" });
});

/**
 * @swagger
 * /api/auth/oauth/unlink/{provider}:
 *   delete:
 *     summary: Unlink an OAuth provider
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *           enum: [google, github]
 *         description: OAuth provider to unlink
 *     responses:
 *       200:
 *         description: Unlinked successfully
 *       401:
 *         description: Unauthorized
 */
authRouter.delete("/oauth/unlink/:provider", (req, res) => {
  res.status(200).json({ message: "Unlink provider to be implemented" });
});

export default authRouter;
