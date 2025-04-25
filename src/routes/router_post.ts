/**
 * @file router_post.ts
 * @description Defines all routes for managing blog posts.
 * There are 5 main routes:
 * 1. Get a list of blog posts with pagination and filtering.
 * 2. Get a single post.
 * 3. Search posts by keyword.
 * 4. Create a new blog post (markdown format), only admin user can create a post.
 * 5. Update a blog post (markdown format), only admin user can update a post.
 * 6. Delete a blog post, only admin user can delete a post.
 */

import { RequestHandler, Router } from "express";
import validate from "../middleware/validate";
import postController from "../controllers/controller_post";
import { CreateOrUpdatePostBodySchema, GetPostListQuerySchema, KeywordSearchQuerySchema } from "../schema/schema_post";
import { PostIdQuerySchema, PostSlugQuerySchema } from "../schema/schema_components";
import { auth, authAdmin } from "../middleware/auth";

const postRouter = Router();

postRouter.get("/",
  validate({ query: GetPostListQuerySchema}),
  postController.getPostList as unknown as RequestHandler,
);

postRouter.get("/:slug",
  validate({ params: PostSlugQuerySchema}),
  postController.getPostBySlug,
);

postRouter.get("/search",
  validate({ query: KeywordSearchQuerySchema}),
  postController.searchPosts as unknown as RequestHandler,
);

// Admin user can create a post.
postRouter.post("/",
  authAdmin,
  validate({ body: CreateOrUpdatePostBodySchema }),
  postController.createPost,
);

// We cannot limit the user role,
// since the author is not an admin now, but was an admin when creating the post.
postRouter.put("/:postId",
  auth,
  validate({ params: PostIdQuerySchema, body: CreateOrUpdatePostBodySchema }),
  postController.updatePost,
);

// We cannot limit the user role,
// since the author is not an admin now, but was an admin when creating the post.
postRouter.delete("/:postId",
  auth,
  validate({ params: PostIdQuerySchema }),
  postController.deletePost,
);

export default postRouter;
