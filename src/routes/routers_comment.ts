/**
 * @File routers_comment.ts
 * The definition of comment routers.
 * There are 4 main routes:
 * 1. Get a list of comments for a post with pagination.
 * 2. Create a comment on a post, only the registered user can create a comment.
 * 3. Delete a comment, only the author or admin can delete a comment.
 * 4. Update a comment, only the author can update a comment.
 */

import { Router } from "express";

const commentRouter = Router();

/**
 * @swagger
 * /api/comments:
 *   get:
 *     summary: Get comments for a specific post
 *     tags: [Comments]
 *     parameters:
 *       - in: query
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: The offset for pagination (default is 0)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Number of comments per page (default is 10)
 *     responses:
 *       200:
 *         description: List of comments for the post
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "comment001"
 *                   postId:
 *                     type: string
 *                     example: "post001"
 *                   authorId:
 *                     type: string
 *                     example: "user1"
 *                   authorName:
 *                     type: string
 *                     example: John Doe
 *                   authorAvatar:
 *                     type: string
 *                     example: https://example.com/avatar.jpg
 *                   content:
 *                     type: string
 *                     example: "Great"
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Post not found
 */
commentRouter.get("/comments", (req, res) => {
  res.status(200).json({ message: "Fetch comments to be implemented" });
});

/**
 * @swagger
 * /api/posts/{postId}/comments:
 *   post:
 *     summary: Create a comment on a post, registered users only
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
  res.status(201).json({ message: "Post comment is to be implemented" });
});

/**
 * @swagger
 * /api/comments/{commentId}:
 *   delete:
 *     summary: Delete a comment, author or admin only
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
 *       403:
 *         description: Forbidden - Only the author or admin can delete the comment
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Comment not found
 */
commentRouter.delete("/comments/:commentId", (req, res) => {
  res.status(204).send();
});

/**
 * @swagger
 * /api/comments/{commentId}:
 *   put:
 *     summary: Update a comment, author only
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
 *                 authorName:
 *                   type: string
 *                   example: John Doe
 *                 authorAvatar:
 *                   type: string
 *                   example: https://example.com/avatar.jpg
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-01-01T00:00:00Z"
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-04-14T12:00:00Z"
 *       403:
 *        description: Forbidden - Only the author can update the comment
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Comment not found
 */
commentRouter.put("/comments/:commentId", (req, res) => {
  res.status(200).json({ message: "Update comment is to be implemented" });
});

export default commentRouter;
