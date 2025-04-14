/**
 * @File routers_comment.ts
 * The definition of comment routers.
 * There are 3 main routes:
 * 1. Create a comment on a post, only the registered user can create a comment.
 * 2. Delete a comment, only the author or admin can delete a comment.
 * 3. Update a comment, only the author can update a comment.
 * There is not a route to `get` because the comments are displayed in the post.
 */

import { Router } from "express";

const commentRouter = Router();

/**
 * @swagger
 * /posts/{postId}/comments:
 *   post:
 *     summary: Create a comment on a post
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 example: "This is a comment"
 *                 minLength: 1
 *                 maxLength: 500
 *     responses:
 *       201:
 *         description: Comment created
 *         headers:
 *           Location:
 *             description: URL of the newly created comment
 *             schema:
 *               type: string
 *               example: /comments/aaabbb
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Invalid input
 */
commentRouter.post("/posts/:postId/comments", (req, res) => {
  res.status(200).json({ message: "Post comment is to be implemented" });
});

/**
 * @swagger
 * /comments/{commentId}:
 *   delete:
 *     summary: Delete a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the comment
 *     responses:
 *       204:
 *         description: Comment deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Comment not found
 */
commentRouter.delete("/comments/:commentId", (req, res) => {
  res.status(200).json({ message: "Delete comment is to be implemented" });
});

/**
 * @swagger
 * /comments/{commentId}:
 *   put:
 *     summary: Update a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the comment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 example: "Updated comment content"
 *                 minLength: 1
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "aaabbb"
 *                 postId:
 *                   type: string
 *                   example: "bbbccc"
 *                 content:
 *                   type: string
 *                   example: "Updated comment content"
 *                 authorId:
 *                   type: string
 *                   example: "user1"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-01-01T00:00:00Z"
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-04-14T12:00:00Z"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Comment not found
 */
commentRouter.put("/comments/:commentId", (req, res) => {
  res.status(200).json({ message: "Update comment is to be implemented" });
});

export default commentRouter;
