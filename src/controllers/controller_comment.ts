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

type CommentWithAuthor = Prisma.CommentGetPayload<TypeIncludeTagsType>;

/**
 * @summary Maps the Prisma comment response to the CommentResponse schema.
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
 * helper for `POST /comments` and `PUT /comments/:id`"
 */
const createOrUpdateComment = (
  req: AuthRequest<unknown, CreateCommentBody | UpdateCommentBody>,
  isUpdate: boolean
): { data: Prisma.CommentCreateInput | Prisma.CommentUpdateInput } => {
  const { content, postId: postIdParam } = req.locals!
    .body! as Partial<CreateCommentBody>;

  const { id: userid } = req.locals!.user!;

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
 */
const commentController = {
  async getComments(
    req: AuthRequest<unknown, unknown, GetCommentsQuery>,
    res: Response<CommentsListResponse>
  ) {
    const { postId, limit, offset } = req.locals!.query!;

    const comments = async () =>
      prisma.comment.findMany({
        where: { postId },
        skip: offset,
        take: limit,
        orderBy: { createdAt: "desc" },
        ...includeTags,
      });

    const count = async () => prisma.comment.count({ where: { postId } });

    const [commentsList, totalCount] = await Promise.all([comments(), count()]);

    const mappedComments: CommentResponse[] = commentsList.map(
      (comment: CommentWithAuthor) => mapCommentResponse(comment)
    );

    const validatedComments: CommentsListResponse = validate_res(
      CommentsListResponseSchema,
      {
        comments: mappedComments,
        total: totalCount,
        limit,
        offset,
      }
    );

    res.status(200).json(validatedComments);
  },

  async getCommentById(
    req: AuthRequest<CommentIdParam>,
    res: Response<CommentResponse>
  ) {
    const { commentId } = req.locals!.params!;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      ...includeTags,
    });

    if (!comment) return terminateWithErr(404, "Comment not found");

    const mappedComment: CommentResponse = mapCommentResponse(comment);

    const validatedComment: CommentResponse = validate_res(
      CommentResponseSchema,
      mappedComment
    );

    res.status(200).json(validatedComment);
  },

  async createComment(
    req: AuthRequest<unknown, CreateCommentBody>,
    res: Response
  ) {
    const data: { data: Prisma.CommentCreateInput } = createOrUpdateComment(
      req,
      false
    ) as { data: Prisma.CommentCreateInput };

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

  async updateComment(
    req: AuthRequest<CommentIdParam, UpdateCommentBody>,
    res: Response<CommentResponse>
  ) {
    const { commentId } = req.locals!.params!;

    const data: { data: Prisma.CommentUpdateInput } = createOrUpdateComment(
      req,
      true
    );

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

    const mappedComment: CommentResponse = mapCommentResponse(newComment);

    const validatedComment: CommentResponse = validate_res(
      CommentResponseSchema,
      mappedComment
    );

    res.status(200).json(validatedComment);
  },

  async deleteComment(req: AuthRequest<CommentIdParam>, res: Response) {
    const { commentId } = req.locals!.params!;

    const authCondition = req.locals!.user!!.isAdmin
      ? undefined
      : { authorId: req.locals!.user!!.id };

    let deleted = null;

    try {
      deleted = await prisma.comment.delete({
        where: { id: commentId, ...authCondition },
      });
    } catch (error: any) {
      if (error.code === "P2025")
        return terminateWithErr(404, "Comment not found or forbidden");
      else throw error;
    }

    res.status(204).send();
  },
};

export default commentController;

export type { CommentWithAuthor };
