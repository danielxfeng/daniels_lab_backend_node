import { Router } from "express";

const likeRouter = Router();

/**
 * @swagger
 * /api/likes/{postId}:
 *   post:
 *     summary: Like a post, registered user only
 *     tags: [Likes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post
 *     responses:
 *       204:
 *         description: Post liked successfully
 *       401:
 *         description: Unauthorized
 */
likeRouter.post("/:postId", (req, res) => {
  res.status(204).send();
});

/**
 * @swagger
 * /api/likes/{postId}:
 *   delete:
 *     summary: Unlike a post, registered user only
 *     tags: [Likes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post
 *     responses:
 *       204:
 *         description: Post un-liked successfully
 *       401:
 *         description: Unauthorized
 */
likeRouter.delete("/:postId", (req, res) => {
  res.status(204).send({ message: "to be implemented" });
});

/**
 * @swagger
 * /api/likes/{postId}:
 *   get:
 *     summary: Get total number of likes, and if current user liked the post (registered user only)
 *     tags: [Likes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post
 *     responses:
 *       200:
 *         description: Like status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                count:
 *                   type: integer
 *                   example: 2
 *                 liked:
 *                   type: boolean
 *                   example: true
 */
likeRouter.get("/:postId", (req, res) => {
  res.status(200).send();
});

export default likeRouter;
