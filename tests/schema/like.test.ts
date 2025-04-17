/**
 * @file like.test.ts
 * @description Unit tests for the like-related schemas.
 */

import { describe, it } from "mocha";
import { expect } from "chai";
import { LikeStatusResponseSchema } from "../../src/schema/schema_like";

// Happy test
describe("LikeStatusResponseSchema", () => {
  it("should parse valid like status response", () => {
    const input = {
      count: 10,
      liked: true,
    };

    const result = LikeStatusResponseSchema.parse(input);
    expect(result).to.deep.equal(input);
  });
});

it("should throw if the count < 0", () => {
  const data = { count: -1, liked: true };
  expect(() => LikeStatusResponseSchema.parse(data)).to.throw();
});

it("should throw if count is a string", () => {
  const data = { count: "10", liked: true };
  expect(() => LikeStatusResponseSchema.parse(data)).to.throw();
});

it("should throw if liked is a string", () => {
  const data = { count: 5, liked: "true" };
  expect(() => LikeStatusResponseSchema.parse(data)).to.throw();
});
