/**
 * @file router_post.ts
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
  postController.getPostList,
);

postRouter.get("/search",
  validate({ query: KeywordSearchQuerySchema}),
  postController.searchPosts as unknown as RequestHandler,
);

postRouter.get("/:slug",
  validate({ params: PostSlugQuerySchema}),
  postController.getPostBySlug,
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
