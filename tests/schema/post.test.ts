/**
 * @file post.test.ts
 * @description This file contains unit tests for the post schemas.
 */

import { describe } from "mocha";
import { expect } from "chai";
import {
  GetPostListQuerySchema,
  CreateOrUpdatePostBodySchema,
  PostResponseSchema,
  PostListResponseSchema,
} from "../../src/schema/schema_post";

const expectFail = (schema: any, input: any) => {
  const result = schema.safeParse(input);
  expect(result.success).to.be.false;
};

describe("Post Schemas - Valid Inputs", () => {
  it("should accept valid GetPostListQuery", () => {
    const result = GetPostListQuerySchema.safeParse({
      offset: "0",
      limit: "10",
      tags: ["tag1", "tag2"],
    });
    expect(result.success).to.be.true;
    expect(result.data).to.deep.equal({
      offset: 0,
      limit: 10,
      tags: ["tag1", "tag2"],
    });
  });

  it("should accept valid GetPostListQuery with default values", () => {
    const result = GetPostListQuerySchema.safeParse({});
    expect(result.success).to.be.true;
    expect(result.data).to.deep.equal({
      offset: 0,
      limit: 10,
      tags: [],
    });
  });

  it("should accept valid GetPostListQuery with single tag1", () => {
    const result = GetPostListQuerySchema.safeParse({
      tags: "tag1",
    });
    expect(result.success).to.be.true;
    expect(result.data).to.deep.equal({
      offset: 0,
      limit: 10,
      tags: ["tag1"],
    });
  });

  it("should accept valid GetPostListQuery with uppercase tag1", () => {
    const result = GetPostListQuerySchema.safeParse({
      tags: "TAG1",
    });
    expect(result.success).to.be.true;
    expect(result.data).to.deep.equal({
      offset: 0,
      limit: 10,
      tags: ["tag1"],
    });
  });

  it("should accept valid CreateOrUpdatePostBody", () => {
    const result = CreateOrUpdatePostBodySchema.safeParse({
      title: "This is a post",
      markdown: "This is the content of the post",
      tags: ["tag1", "tag2"],
    });
    expect(result.success).to.be.true;
    expect(result.data).to.deep.equal({
      title: "This is a post",
      markdown: "This is the content of the post",
      tags: ["tag1", "tag2"],
    });
  });

  it("should accept valid CreateOrUpdatePostBody with empty tags", () => {
    const result = CreateOrUpdatePostBodySchema.safeParse({
      title: "This is a post",
      markdown: "This is the content of the post",
      tags: [],
    });
    expect(result.success).to.be.true;
    expect(result.data).to.deep.equal({
      title: "This is a post",
      markdown: "This is the content of the post",
      tags: [],
    });
  });

  it("should accept valid CreateOrUpdatePostBody with single tag1", () => {
    const result = CreateOrUpdatePostBodySchema.safeParse({
      title: "This is a post",
      markdown: "This is the content of the post",
      tags: "tag1",
    });
    expect(result.success).to.be.true;
    expect(result.data).to.deep.equal({
      title: "This is a post",
      markdown: "This is the content of the post",
      tags: ["tag1"],
    });
  });

  it("should accept valid CreateOrUpdatePostBody with uppercase tag1", () => {
    const result = CreateOrUpdatePostBodySchema.safeParse({
      title: "This is a post",
      markdown: "This is the content of the post",
      tags: "TAG1",
    });
    expect(result.success).to.be.true;
    expect(result.data).to.deep.equal({
      title: "This is a post",
      markdown: "This is the content of the post",
      tags: ["tag1"],
    });
  });

  it("should accept valid CreateOrUpdatePostBody with createdAt", () => {
    const result = CreateOrUpdatePostBodySchema.safeParse({
      title: "This is a post",
      markdown: "This is the content of the post",
      tags: ["tag1", "tag2"],
      createdAt: new Date("2023-10-01T00:00:00Z").toISOString(),
    });
    expect(result.success).to.be.true;
    expect(result.data).to.deep.equal({
      title: "This is a post",
      markdown: "This is the content of the post",
      tags: ["tag1", "tag2"],
      createdAt: new Date("2023-10-01T00:00:00Z").toISOString(),
    });
  });

  it("should accept valid CreateOrUpdatePostBody with updatedAt", () => {
    const result = CreateOrUpdatePostBodySchema.safeParse({
      title: "This is a post",
      markdown: "This is the content of the post",
      tags: ["tag1", "tag2"],
      updatedAt: new Date("2023-10-01T00:00:00Z").toISOString(),
    });
    expect(result.success).to.be.true;
    expect(result.data).to.deep.equal({
      title: "This is a post",
      markdown: "This is the content of the post",
      tags: ["tag1", "tag2"],
      updatedAt: new Date("2023-10-01T00:00:00Z").toISOString(),
    });
  });

  it("should accept valid PostResponse", () => {
    const result = PostResponseSchema.safeParse({
      id: "123e4567-e89b-12d3-a456-426614174000",
      authorId: "123e4567-e89b-12d3-a456-426614174000",
      authorName: "JohnDoe",
      authorAvatar: null,
      title: "This is a post",
      markdown: "This is the content of the post",
      tags: ["tag1", "tag2"],
      createdAt: new Date("2023-10-01T00:00:00Z").toISOString(),
      updatedAt: new Date("2023-10-01T00:00:00Z").toISOString(),
    });
    expect(result.success).to.be.true;
    expect(result.data).to.deep.equal({
      id: "123e4567-e89b-12d3-a456-426614174000",
      authorId: "123e4567-e89b-12d3-a456-426614174000",
      authorName: "JohnDoe",
      authorAvatar: null,
      title: "This is a post",
      markdown: "This is the content of the post",
      tags: ["tag1", "tag2"],
      createdAt: new Date("2023-10-01T00:00:00Z").toISOString(),
      updatedAt: new Date("2023-10-01T00:00:00Z").toISOString(),
    });
  });

  it("should accept valid PostListResponse", () => {
    const result = PostListResponseSchema.safeParse({
      posts: [
        {
          id: "123e4567-e89b-12d3-a456-426614174000",
          authorId: "123e4567-e89b-12d3-a456-426614174000",
          authorName: "JohnDoe",
          authorAvatar: null,
          title: "This is a post",
          markdown: "This is the content of the post",
          tags: ["tag1", "tag2"],
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
      posts: [
        {
          id: "123e4567-e89b-12d3-a456-426614174000",
          authorId: "123e4567-e89b-12d3-a456-426614174000",
          authorName: "JohnDoe",
          authorAvatar: null,
          title: "This is a post",
          markdown: "This is the content of the post",
          tags: ["tag1", "tag2"],
          createdAt: new Date("2023-10-01T00:00:00Z").toISOString(),
          updatedAt: new Date("2023-10-01T00:00:00Z").toISOString(),
        },
      ],
      total: 1,
      offset: 0,
      limit: 10,
    });
  });

  it("should accept valid PostListResponse with empty posts", () => {
    const result = PostListResponseSchema.safeParse({
      posts: [],
      total: 0,
      offset: 0,
      limit: 10,
    });
    expect(result.success).to.be.true;
    expect(result.data).to.deep.equal({
      posts: [],
      total: 0,
      offset: 0,
      limit: 10,
    });
  });
});

describe("Post Schemas - Invalid Inputs", () => {
  it("should fail for invalid GetPostListQuery with invalid offset", () => {
    expectFail(GetPostListQuerySchema, {
      offset: "invalid",
      limit: "10",
      tags: ["tag1", "tag2"],
    });
  });

  it("should fail for invalid GetPostListQuery with invalid limit", () => {
    expectFail(GetPostListQuerySchema, {
      offset: "0",
      limit: "invalid",
      tags: ["tag1", "tag2"],
    });
  });
  it("should fail for invalid GetPostListQuery with invalid tag", () => {
    expectFail(GetPostListQuerySchema, {
      offset: "0",
      limit: "10",
      tags: ["tag1", "$d^"],
    });
  });
  it("should fail for invalid GetPostListQuery with invalid tags type", () => {
    expectFail(GetPostListQuerySchema, {
      offset: "0",
      limit: "10",
      tags: 123,
    });
  });

  it("should fail for invalid GetPostListQuery with too long tag", () => {
    expectFail(GetPostListQuerySchema, {
      offset: "0",
      limit: "10",
      tags: ["a".repeat(256)],
    });
  });

  it("should fail for invalid GetPostListQuery with too many tags", () => {
    expectFail(GetPostListQuerySchema, {
      offset: "0",
      limit: "10",
      tags: [
        "tag1",
        "tag2",
        "tag3",
        "tag4",
        "tag5",
        "tag6",
        "tag7",
        "tag8",
        "tag9",
        "tag10",
        "tag11",
      ],
    });
  });

  it("should fail for invalid CreateOrUpdatePostBody with empty title", () => {
    expectFail(CreateOrUpdatePostBodySchema, {
      title: "",
      markdown: "This is the content of the post",
      tags: ["tag1", "tag2"],
    });
  });

  it("should fail for invalid CreateOrUpdatePostBody with empty markdown", () => {
    expectFail(CreateOrUpdatePostBodySchema, {
      title: "This is a post",
      markdown: "",
      tags: ["tag1", "tag2"],
    });
  });

  it("should fail for invalid PostListResponse with invalid posts", () => {
    expectFail(PostListResponseSchema, {
      posts: [
        {
          id: "",
          authorId: "123e4567-e89b-12d3-a456-426614174000",
          authorName: "JohnDoe",
          authorAvatar: null,
          title: "This is a post",
          markdown: "This is the content of the post",
          tags: ["tag1", "tag2"],
          createdAt: new Date("2023-10-01T00:00:00Z").toISOString(),
          updatedAt: new Date("2023-10-01T00:00:00Z").toISOString(),
        },
      ],
      total: 1,
      offset: 0,
      limit: 10,
    });
  });

  it("should fail for invalid PostListResponse with invalid total", () => {
    expectFail(PostListResponseSchema, {
      posts: [],
      total: "invalid",
      offset: 0,
      limit: 10,
    });
  });
});
