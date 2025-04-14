import { Router } from "express";

const userRouter = Router();

/**
 * @swagger
 * /users:
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
 * /users:
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
 *               avatarUrl:
 *                 type: string
 *                 format: uri
 *                 example: "https://example.com/avatar.jpg"
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
 * /users:
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
 * /users/{userId}:
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
