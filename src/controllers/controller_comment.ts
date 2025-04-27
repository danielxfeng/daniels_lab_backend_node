import { Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../db/prisma";
import {
  CommentResponseSchema,
  CommentsListResponseSchema,
} from "../schema/schema_comment";
import {
  GetCommentsQuery,
  CommentIdParam,
  CommentResponse,
  CommentsListResponse,
  CreateCommentBody,
  UpdateCommentBody,
} from "../schema/schema_comment";
import { PostIdQuery } from "../schema/schema_components";
import { AuthRequest } from "../types/type_auth";
import { validate_res } from "../utils/validate_res";
import { terminateWithErr } from "../utils/terminate_with_err";

/**
 * @summary The include tags for Prisma queries.
 */
const includeTags = {
  include: {
    author: {
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        deletedAt: true,
      },
    },
  },
};

type TypeIncludeTagsType = typeof includeTags;

/**
 * @summary Type retrieved from Prisma for the Comments model with author and tags.
 */
type CommentWithAuthor = Prisma.CommentGetPayload<TypeIncludeTagsType>;

/**
 * @summary Maps the Prisma comment response to the CommentResponse schema.
 * @param post the Prisma comment response
 * @returns the mapped CommentResponse
 */
const mapCommentResponse = (comment: CommentWithAuthor): CommentResponse => {
  return {
    id: comment.id,
    content: comment.content,
    authorId: comment.author.id,
    postId: comment.postId,
    authorName: comment.author.deletedAt
      ? "DeletedUser"
      : comment.author.username,
    authorAvatar: comment.author.deletedAt ? null : comment.author.avatarUrl,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
  };
};

/**
 * @summary Generate Prisma `data` to create or update a comment
 *
 * helper for `POST /comments` and `PUT /comments/:id`"
 * @param req the request object
 * @param isUpdate whether the request is for update or create
 * @returns the Prisma `data` to create or update a post.
 */
const createOrUpdateComment = (
  req: AuthRequest<unknown, CreateCommentBody | UpdateCommentBody>,
  isUpdate: boolean
): { data: Prisma.CommentCreateInput | Prisma.CommentUpdateInput } => {
  // postIdParam will be `undefined` when update, but it's fine bc we don't need it.
  const { content, postId: postIdParam } = req.locals!
    .body! as Partial<CreateCommentBody>;

  const { id: userid } = req.locals!.user!;

  // For `create`, the postId is provided by API query,
  // while for `update`, we don't update the postId.
  const postId = isUpdate
    ? undefined
    : { post: { connect: { id: postIdParam } } };

  return {
    data: {
      content,
      author: { connect: { id: userid } },
      ...postId,
    },
  };
};

/**
 * @summary The comment controller handles all comment-related operations.
 * @description It handles the following operations:
 * - GET /comments/ Get a list of comments for a post
 * - GET /comments/:commentId Get a comment by ID
 * - POST /comments/ Create a comment on a post
 * - PUT /comments/:commentId Update a comment
 * - DELETE /comments/:commentId Delete a comment
 */
const commentController = {
  /**
   * Get a list of comments for a post
   * @description Get a list of comments by given post ID with pagination.
   */
  async getComments(
    req: AuthRequest<unknown, unknown, GetCommentsQuery>,
    res: Response<CommentsListResponse>
  ) {
    const { postId, limit, offset } = req.locals!.query!;

    // Assemble the comments query
    const comments = async () =>
      prisma.comment.findMany({
        where: { postId },
        skip: offset,
        take: limit,
        orderBy: { createdAt: "desc" },
        ...includeTags,
      });

    // Assemble the count query
    const count = async () => prisma.comment.count({ where: { postId } });

    // Execute the queries in parallel
    const [commentsList, totalCount] = await Promise.all([comments(), count()]);

    // Map the comment to the CommentResponse schema
    const mappedComments: CommentResponse[] = commentsList.map(
      (comment: CommentWithAuthor) => mapCommentResponse(comment)
    );

    // Validate the response
    const validatedComments: CommentsListResponse = validate_res(
      CommentsListResponseSchema,
      {
        comments: mappedComments,
        total: totalCount,
        limit,
        offset,
      }
    );

    // Send the response
    res.status(200).json(validatedComments);
  },

  /**
   * Get a comment by ID
   * @description Get a comment by given ID.
   */
  async getCommentById(
    req: AuthRequest<CommentIdParam>,
    res: Response<CommentResponse>
  ) {
    const { commentId } = req.locals!.params!;

    // Find the comment by ID
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      ...includeTags,
    });

    // If the comment is not found, terminate with an error
    if (!comment) return terminateWithErr(404, "Comment not found");

    // Map the comment to the CommentResponse schema
    const mappedComment: CommentResponse = mapCommentResponse(comment);

    // Validate the response
    const validatedComment: CommentResponse = validate_res(
      CommentResponseSchema,
      mappedComment
    );

    // Send the response
    res.status(200).json(validatedComment);
  },

  /**
   * Create a comment on a post
   * @description Create a comment on a post with the given content.
   */
  async createComment(
    req: AuthRequest<unknown, CreateCommentBody>,
    res: Response
  ) {
    // Call the helper function to assemble the Prisma data
    const data: { data: Prisma.CommentCreateInput } = createOrUpdateComment(
      req,
      false
    ) as { data: Prisma.CommentCreateInput };

    // Create the comment
    let comment = null;
    try {
      comment = await prisma.comment.create({ ...data });
    } catch (error: any) {
      // If the post is not found, terminate with an error
      if (error.code === "P2025")
        return terminateWithErr(404, "Post not found");
      throw error;
    }

    res
      .set("Location", `/comments/${comment.id}`)
      .status(201)
      .json({ message: "Comment created" });
  },

  /**
   * Update a comment
   * @description Update a comment by given ID with the new content.
   */
  async updateComment(
    req: AuthRequest<CommentIdParam, UpdateCommentBody>,
    res: Response<CommentResponse>
  ) {
    const { commentId } = req.locals!.params!;

    // Call the helper function to assemble the Prisma data
    const data: { data: Prisma.CommentUpdateInput } = createOrUpdateComment(
      req,
      true
    );

    // Update the comment
    let newComment = null;

    try {
      newComment = await prisma.comment.update({
        where: { id: commentId, authorId: req.locals!.user!!.id },
        ...data,
        ...includeTags,
      });
    } catch (error: any) {
      if (error.code === "P2025")
        return terminateWithErr(404, "Comment not found or forbidden");
      else throw error;
    }

    // Map the comment to the CommentResponse schema
    const mappedComment: CommentResponse = mapCommentResponse(newComment);

    // Validate the response
    const validatedComment: CommentResponse = validate_res(
      CommentResponseSchema,
      mappedComment
    );

    // Send the response
    res.status(200).json(validatedComment);
  },

  /**
   * Delete a comment
   * @description Delete a comment by given ID.
   */
  async deleteComment(req: AuthRequest<CommentIdParam>, res: Response) {
    const { commentId } = req.locals!.params!;

    // ABAC control
    const authCondition = req.locals!.user!!.isAdmin
      ? undefined
      : { authorId: req.locals!.user!!.id };

    let deleted = null;

    try {
      // Delete the comment
      deleted = await prisma.comment.delete({
        where: { id: commentId, ...authCondition },
      });
    } catch (error: any) {
      // If the comment is not found, terminate with an error
      if (error.code === "P2025")
        return terminateWithErr(404, "Comment not found or forbidden");
      else throw error;
    }

    res.status(204).send();
  },
};

export default commentController;

export type { CommentWithAuthor };
