/**
 * @file comment.test.ts
 * @description This file contains unit tests for the comment schemas.
 */

import { describe } from "mocha";
import { expect } from "chai";
import {
  GetCommentsQuerySchema,
  CreateOrUpdateCommentBodySchema,
  CommentIdParamSchema,
  CommentResponseSchema,
  CommentsListResponseSchema,
} from "../../src/schema/schema_comment";

const expectFail = (schema: any, input: any) => {
  const result = schema.safeParse(input);
  expect(result.success).to.be.false;
};

describe("Comment Schemas - Valid Inputs", () => {
  it("should accept valid GetCommentsQuery", () => {
    const result = GetCommentsQuerySchema.safeParse({
      postId: "123e4567-e89b-12d3-a456-426614174000",
      offset: "0",
      limit: "10",
    });
    expect(result.success).to.be.true;
    expect(result.data).to.deep.equal({
      postId: "123e4567-e89b-12d3-a456-426614174000",
      offset: 0,
      limit: 10,
    });
  });

  it("should accept valid GetCommentsQuery with default values", () => {
    const result = GetCommentsQuerySchema.safeParse({
      postId: "123e4567-e89b-12d3-a456-426614174000",
    });
    expect(result.success).to.be.true;
    expect(result.data).to.deep.equal({
      postId: "123e4567-e89b-12d3-a456-426614174000",
      offset: 0,
      limit: 10,
    });
  });

  it("should accept valid CreateOrUpdateCommentBody", () => {
    const result = CreateOrUpdateCommentBodySchema.safeParse({
      content: "This is a comment",
    });
    expect(result.success).to.be.true;
    expect(result.data).to.deep.equal({
      content: "This is a comment",
    });
  });

  it("should accept valid CommentIdParam", () => {
    const result = CommentIdParamSchema.safeParse({
      commentId: "123e4567-e89b-12d3-a456-426614174000",
    });
    expect(result.success).to.be.true;
    expect(result.data).to.deep.equal({
      commentId: "123e4567-e89b-12d3-a456-426614174000",
    });
  });

  it("should accept valid CommentResponse", () => {
    const result = CommentResponseSchema.safeParse({
      id: "123e4567-e89b-12d3-a456-426614174000",
      postId: "123e4567-e89b-12d3-a456-426614174000",
      authorId: "123e4567-e89b-12d3-a456-426614174000",
      authorName: "JohnDoe",
      authorAvatar: null,
      content: "This is a comment",
      createdAt: new Date("2023-10-01T00:00:00Z").toISOString(),
      updatedAt: new Date("2023-10-01T00:00:00Z").toISOString(),
    });
    expect(result.success).to.be.true;
    expect(result.data).to.deep.equal({
      id: "123e4567-e89b-12d3-a456-426614174000",
      postId: "123e4567-e89b-12d3-a456-426614174000",
      authorId: "123e4567-e89b-12d3-a456-426614174000",
      authorName: "JohnDoe",
      authorAvatar: null,
      content: "This is a comment",
      createdAt: new Date("2023-10-01T00:00:00Z").toISOString(),
      updatedAt: new Date("2023-10-01T00:00:00Z").toISOString(),
    });
  });

  it("should accept valid CommentsListResponse", () => {
    const result = CommentsListResponseSchema.safeParse({
      comments: [
        {
          id: "123e4567-e89b-12d3-a456-426614174000",
          postId: "123e4567-e89b-12d3-a456-426614174000",
          authorId: "123e4567-e89b-12d3-a456-426614174000",
          authorName: "JohnDoe",
          authorAvatar: null,
          content: "This is a comment",
          createdAt: new Date("2023-10-01T00:00:00Z").toISOString(),
          updatedAt: new Date("2023-10-01T00:00:00Z").toISOString(),
        },
      ],
      total: 1,
      offset: 0,
      limit: 10,
    });
    expect(result.success).to.be.true;
    expect(result.data).to.deep.equal({
      comments: [
        {
          id: "123e4567-e89b-12d3-a456-426614174000",
          postId: "123e4567-e89b-12d3-a456-426614174000",
          authorId: "123e4567-e89b-12d3-a456-426614174000",
          authorName: "JohnDoe",
          authorAvatar: null,
          content: "This is a comment",
          createdAt: new Date("2023-10-01T00:00:00Z").toISOString(),
          updatedAt: new Date("2023-10-01T00:00:00Z").toISOString(),
        },
      ],
      total: 1,
      offset: 0,
      limit: 10,
    });
  });

  it("should accept valid CommentsListResponse with empty comments", () => {
    const result = CommentsListResponseSchema.safeParse({
      comments: [],
      total: 0,
      offset: 0,
      limit: 10,
    });
    expect(result.success).to.be.true;
    expect(result.data).to.deep.equal({
      comments: [],
      total: 0,
      offset: 0,
      limit: 10,
    });
  });
});

describe("Comment Schemas - inValid Inputs", () => {
  it("should fail for invalid GetCommentsQuery", () => {
    expectFail(GetCommentsQuerySchema, {
      postId: "invalid-uuid",
    });
  });

  it("should fail for invalid Offset", () => {
    expectFail(GetCommentsQuerySchema, {
      postId: "123e4567-e89b-12d3-a456-426614174000",
      offset: "invalid-offset",
    });
  });

  it("should fail for invalid Limit", () => {
    expectFail(GetCommentsQuerySchema, {
      postId: "123e4567-e89b-12d3-a456-426614174000",
      limit: "invalid-limit",
    });
  });

  it("should fail for invalid CreateOrUpdateCommentBody", () => {
    expectFail(CreateOrUpdateCommentBodySchema, {
      content: "",
    });
  });

  it("should fail for a too long comment", () => {
    expectFail(CreateOrUpdateCommentBodySchema, {
      content: "a".repeat(1001),
    });
  });

  it("should fail for invalid CommentIdParam", () => {
    expectFail(CommentIdParamSchema, {
      commentId: "invalid-uuid",
    });
  });

  it("should fail for invalid CommentResponse", () => {
    expectFail(CommentResponseSchema, {
      id: "invalid-uuid",
      postId: "invalid-uuid",
      authorId: "invalid-uuid",
      authorName: "",
      authorAvatar: null,
      content: "",
      createdAt: "invalid-date",
      updatedAt: "invalid-date",
    });
  });

  it("should fail for invalid CommentsListResponse", () => {
    expectFail(CommentsListResponseSchema, {
      comments: "invalid-comments",
      total: 10,
      limit: -1,
    });
  });
});
