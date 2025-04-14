/**
 * @File router_user.ts
 * The definition of user routers.
 * There are 4 main routes:
 * 1. Get current user profile.
 * 2. Update current user info.
 * 3. List all users (admin only).
 * 4. Delete a user (admin only).
 */

import { Router } from "express";

const userRouter = Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "user_123"
 *                 username:
 *                   type: string
 *                   example: "johndoe"
 *                 avatarUrl:
 *                   type: string
 *                   format: uri
 *                   example: "https://example.com/avatar.jpg"
 *                 oauthProviders:
 *                   type: array
 *                   description: List of connected OAuth providers
 *                   items:
 *                     type: string
 *                     example: "google"
 *                   example: ["google", "github"]
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-01-01T12:00:00Z"
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-04-14T12:00:00Z"
 *       401:
 *         description: Unauthorized
 */
userRouter.get("/", (req, res) => {
  res.status(200).json({ message: "User profile to be implemented" });
});

/**
 * @swagger
 * /api/users:
 *   put:
 *     summary: Update current user info
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: John D.
 *                 minLength: 1
 *                 maxLength: 50
 *                 pattern: "^[a-zA-Z0-9._-]+$"
 *                 description: Must contain only letters, numbers, dots, hyphens, or underscores.
 *               avatarUrl:
 *                 type: string
 *                 format: uri
 *                 example: "https://example.com/avatar.jpg"
 *                 minLength: 15
 *                 maxLength: 200
 *     responses:
 *       200:
 *         description: Updated user info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "user_123"
 *                 username:
 *                   type: string
 *                   example: "johndoe"
 *                 avatarUrl:
 *                   type: string
 *                   format: uri
 *                   example: "https://example.com/avatar.jpg"
 *                 oauthProviders:
 *                   type: array
 *                   description: List of connected OAuth providers
 *                   items:
 *                     type: string
 *                     example: "google"
 *                   example: ["google", "github"]
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-01-01T12:00:00Z"
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-04-14T12:00:00Z"
 */
userRouter.put("/", (req, res) => {
  res.status(200).json({ message: "Update user profile to be implemented" });
});

/**
 * @swagger
 * /api/users/all:
 *   get:
 *     summary: List all users (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "user_123"
 *                   username:
 *                     type: string
 *                     example: "johndoe"
 *                   avatarUrl:
 *                     type: string
 *                     format: uri
 *                     example: "https://example.com/avatar.jpg"
 *                   oauthProviders:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["google"]
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-01-01T12:00:00Z"
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-04-14T12:00:00Z"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admins only
 */
userRouter.get("/all", (req, res) => {
  res.status(200).json({ message: "Admin: List users to be implemented" });
});

/**
 * @swagger
 * /api/users/{userId}:
 *   delete:
 *     summary: Delete a user (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user
 *     responses:
 *       204:
 *         description: User deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admins only
 *       404:
 *         description: User not found
 */
userRouter.delete("/:userId", (req, res) => {
  res.status(204).send();
});

export default userRouter;
