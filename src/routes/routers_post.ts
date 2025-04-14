/**
 * @File routers_post.ts
 * Defines all routes for managing blog posts.
 * There are 5 main routes:
 * 1. Get a list of blog posts with pagination and filtering.
 * 2. Get a single post.
 * 3. Create a new blog post (markdown format), only admin user can create a post.
 * 4. Update a blog post (markdown format), only admin user can update a post.
 * 5. Delete a blog post, only admin user can delete a post.
 */

import { Router } from "express";

const postRouter = Router();

/**
 * @swagger
 * /posts:
 *   get:
 *     summary: Get a list of blog posts
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: The offset for pagination (default is 0)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of posts per page (default is 10)
 *       - in: query
 *         name: tags
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         style: form
 *         explode: false
 *         description: Filter by tags
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (ISO)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (ISO)
 *     responses:
 *       200:
 *         description: List of posts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: post001
 *                   title:
 *                     type: string
 *                     example: "Title"
 *                   excerpt:
 *                     type: string
 *                     description: preview of the post content
 *                     example: "Hi there..."
 *                   tags:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["a", "b"]
 *                   authorId:
 *                     type: string
 *                     example: user1
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-01-01T00:00:00Z"
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-01-02T00:00:00Z"
 */
postRouter.get("/posts", (req, res) => {
  res.status(200).json({ message: "Fetch post list (to be implemented)" });
});

/**
 * @swagger
 * /posts/{postId}:
 *   get:
 *     summary: Get a single post including its comments
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post
 *     responses:
 *       200:
 *         description: The post content
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "post1"
 *                 title:
 *                   type: string
 *                   example: "Title"
 *                 content:
 *                   type: string
 *                   example: "Content"
 *                 authorId:
 *                   type: string
 *                   example: "user1"
 *                 tags:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["tag1", "tag2"]
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-04-01T10:00:00Z"
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-04-01T10:00:00Z"
 *       404:
 *         description: Post not found
 */
postRouter.get("/posts/:postId", (req, res) => {
  res.status(200).json({ message: "Fetch single post with comments" });
});

/**
 * @swagger
 * /posts:
 *   post:
 *     summary: Create a new blog post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - markdown
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Title"
 *               markdown:
 *                 type: string
 *                 example: "Content"
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["dev", "life"]
 *               createdAt:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-01-01T00:00:00Z"
 *     responses:
 *       201:
 *         description: Post created
 *         headers:
 *           Location:
 *             description: URL of the newly created post
 *             schema:
 *               type: string
 *               example: /posts/abc123
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
postRouter.post("/posts", (req, res) => {
  res
    .status(201)
    .json({ message: "Post creation (markdown) to be implemented" });
});

/**
 * @swagger
 * /posts/{postId}:
 *   put:
 *     summary: Update a blog post
 *     tags: [Posts]
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
 *             properties:
 *               markdown:
 *                 type: string
 *                 example: "Content"
 *               title:
 *                 type: string
 *                 example: "Title"
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               createdAt:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-01-01T00:00:00Z"
 *     responses:
 *       200:
 *         description: Post updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "post1"
 *                 title:
 *                   type: string
 *                   example: "Title"
 *                 content:
 *                   type: string
 *                   example: "Content"
 *                 authorId:
 *                   type: string
 *                   example: "user1"
 *                 tags:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["tag1", "tag2"]
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-04-01T10:00:00Z"
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-04-01T10:00:00Z"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Post not found
 */
postRouter.put("/posts/:postId", (req, res) => {
  res.status(200).json({ message: "Post update to be implemented" });
});

/**
 * @swagger
 * /posts/{postId}:
 *   delete:
 *     summary: Delete a blog post
 *     tags: [Posts]
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
 *         description: Post deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Post not found
 */
postRouter.delete("/posts/:postId", (req, res) => {
  res.status(204).send();
});

export default postRouter;
