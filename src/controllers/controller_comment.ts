import { Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../db/prisma";
import { CommentResponseSchema, CommentsListResponseSchema } from "../schema/schema_comment";
import {
  GetCommentsQuery,
  CreateOrUpdateCommentBody,
  CommentIdParam,
  CommentResponse,
  CommentsListResponse,
} from "../schema/schema_comment";
import { PostIdQuery } from "../schema/schema_components";
import { AuthRequest } from "../types/type_auth";
import { validate_res } from "../utils/validate_res";
import { terminateWithErr } from "../utils/terminate_with_err";
import { get } from "http";

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
    const { postId, limit, offset } = req.query;

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
    const count = async () =>
      prisma.comment.count({ where: { postId }});

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
    const { commentId } = req.params;

    // Find the comment by ID
    const comment = await prisma.comment.findUnique({
      where: { id: commentId, },
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
};

export default commentController;

export type { CommentWithAuthor };
