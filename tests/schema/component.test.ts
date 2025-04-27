import { describe } from "mocha";
import { expect } from "chai";
import {
  DateTimeSchema,
  UUIDSchema,
  UsernameSchema,
  AvatarUrlSchema,
  ConsentSchema,
  OauthProvidersSchema,
  PostIdSchema,
  PostSlugSchema,
  OffsetSchema,
  OffsetOutputSchema,
  LimitSchema,
  LimitOutputSchema,
  CreateAtSchema,
  UpdateAtSchema,
  PostIdQuerySchema,
  TotalOutputSchema,
  AuthorIdSchema,
} from "../../src/schema/schema_components";

const expectFail = (schema: any, input: any) => {
  const result = schema.safeParse(input);
  expect(result.success).to.be.false;
};

describe("Component Schemas - Valid Inputs", () => {
  it("should accept valid ISO date", () => {
    const result = DateTimeSchema.safeParse("2025-01-01T01:00:00Z");
    expect(result.success).to.be.true;
    expect(result.data).to.equal("2025-01-01T01:00:00Z");
  });

  it("should accept valid UUID", () => {
    const result = UUIDSchema.safeParse("f4b44e61-8c6f-4534-b9bb-8dc8eab9f713");
    expect(result.success).to.be.true;
    expect(result.data).to.equal("f4b44e61-8c6f-4534-b9bb-8dc8eab9f713");
  });

  it("should accept valid UUID in uppercase", () => {
    const result = UUIDSchema.safeParse("F4B44E61-8C6F-4534-B9BB-8DC8EAB9F713");
    expect(result.success).to.be.true;
    expect(result.data).to.equal("f4b44e61-8c6f-4534-b9bb-8dc8eab9f713");
  });

  it("should accept valid username", () => {
    const result = UsernameSchema.safeParse("user_name99");
    expect(result.success).to.be.true;
    expect(result.data).to.equal("user_name99");
  });

  it ("should accept valid https avatar URL", () => {
    const result = AvatarUrlSchema.safeParse("https://example.com/avatar.png");
    expect(result.success).to.be.true;
    expect(result.data).to.equal("https://example.com/avatar.png");
  });

  it("should accept true consent", () => {
    const result = ConsentSchema.safeParse(true);
    expect(result.success).to.be.true;
    expect(result.data).to.equal(true);
  });

  it("should accept valid oauthProviders", () => {
    const result = OauthProvidersSchema.safeParse("google");
    expect(result.success).to.be.true;
    expect(result.data).to.deep.equal("google");
  });

  it("should accept valid offset", () => {
    const result = OffsetSchema.safeParse("10");
    expect(result.success).to.be.true;
    expect(result.data).to.equal(10);
  });

  it("should accept an undefined offset", () => {
    const result = OffsetSchema.safeParse(undefined);
    expect(result.success).to.be.true;
    expect(result.data).to.equal(0);
  });

  it("should accept empty offset", () => {
    const result = OffsetSchema.safeParse("");
    expect(result.success).to.be.true;
    expect(result.data).to.equal(0);
  });

  it("should accept valid offset with whitespace", () => {
    const result = OffsetSchema.safeParse("  20  ");
    expect(result.success).to.be.true;
    expect(result.data).to.equal(20);
  });

  it("should accept valid limit", () => {
    const result = LimitSchema.safeParse("50");
    expect(result.success).to.be.true;
    expect(result.data).to.equal(50);
  });

  it("should accept an undefined limit", () => {
    const result = LimitSchema.safeParse(undefined);
    expect(result.success).to.be.true;
    expect(result.data).to.equal(10);
  });

  it("should accept empty limit", () => {
    const result = LimitSchema.safeParse("");
    expect(result.success).to.be.true;
    expect(result.data).to.equal(10);
  });

  it("should accept valid limit with whitespace", () => {
    const result = LimitSchema.safeParse("  20  ");
    expect(result.success).to.be.true;
    expect(result.data).to.equal(20);
  });

  it("should accept valid postId", () => {
    const result = PostIdSchema.safeParse("f4b44e61-8c6f-4534-b9bb-8dc8eab9f713" );
    expect(result.success).to.be.true;
    expect(result.data).to.deep.equal("f4b44e61-8c6f-4534-b9bb-8dc8eab9f713");
  });

  it("should accept valid PostIdQuery", () => {
    const result = PostIdQuerySchema.safeParse({ postId: "f4b44e61-8c6f-4534-b9bb-8dc8eab9f713" });
    expect(result.success).to.be.true;
    expect(result.data).to.deep.equal({ postId: "f4b44e61-8c6f-4534-b9bb-8dc8eab9f713" });
  });

  it("should accept valid createdAt and updatedAt", () => {
    const result = CreateAtSchema.safeParse("2025-01-01T01:00:00Z");
    expect(result.success).to.be.true;
    expect(result.data).to.equal("2025-01-01T01:00:00Z");

    const result2 = UpdateAtSchema.safeParse("2025-01-01T01:00:00Z");
    expect(result2.success).to.be.true;
    expect(result2.data).to.equal("2025-01-01T01:00:00Z");
  });

  it("should accept valid AuthorId", () => {
    const result = AuthorIdSchema.safeParse("f4b44e61-8c6f-4534-b9bb-8dc8eab9f713");
    expect(result.success).to.be.true;
    expect(result.data).to.equal("f4b44e61-8c6f-4534-b9bb-8dc8eab9f713");
  });

  it("should accept valid TotalOutput", () => {
    const result = TotalOutputSchema.safeParse(100);
    expect(result.success).to.be.true;
    expect(result.data).to.equal(100);
  });

  it("should accept valid OffsetOutput", () => {
    const result = OffsetOutputSchema.safeParse(0);
    expect(result.success).to.be.true;
    expect(result.data).to.equal(0);
  });

  it("should accept valid LimitOutput", () => {
    const result = LimitOutputSchema.safeParse(10);
    expect(result.success).to.be.true;
    expect(result.data).to.equal(10);
  });

  it("should accept valid slugs", () => {
    const validSlugs = [
      "hello-world",
      "post123",
      "a-very-long-slug-with-numbers-123",
      "slug",
      "a1-b2-c3",
    ];

    for (const slug of validSlugs) {
      const result = PostSlugSchema.safeParse(slug);
      expect(result.success, `Expected "${slug}" to be valid`).to.be.true;
      expect(result.data).to.equal(slug);
    }
  });
});

describe("Component Schemas - Invalid Inputs", () => {
  it("should reject invalid datetime", () => {
    expectFail(DateTimeSchema, ""); // empty string
    expectFail(DateTimeSchema, " "); // whitespace
    expectFail(DateTimeSchema, "2024-12-32"); // invalid date
    expectFail(DateTimeSchema, "aaa"); // invalid date format
    expectFail(DateTimeSchema, "2024-12-01T25:00:00Z"); // invalid time
    expectFail(DateTimeSchema, "2024-12-01T00:00:00"); // missing timezone
    expectFail(DateTimeSchema, "2024-12-01T00:00:00+00:00"); // invalid timezone

  });

  it("should reject invalid UUIDs", () => {
    expectFail(UUIDSchema, ""); // empty string
    expectFail(UUIDSchema, " "); // whitespace
    expectFail(UUIDSchema, "1234567890"); // invalid UUID
    expectFail(UUIDSchema, "not-a-uuid"); // invalid UUID
    expectFail(UUIDSchema, "123e4567-e89b-12d3-a456-4266141740000"); // too long
    expectFail(UUIDSchema, "123e4567-e89b-12d3-a456-42661417400"); // too short
    expectFail(UUIDSchema, "123e4567-e89b-12d3-a456-42661417400g"); // invalid character
  });

  it("should reject invalid username", () => {
    expectFail(UsernameSchema, ""); // empty string
    expectFail(UsernameSchema, " "); // whitespace
    expectFail(UsernameSchema, "ab"); // too short
    expectFail(UsernameSchema, "a".repeat(17)); // too long
    expectFail(UsernameSchema, "john<doe"); // invalid character
    expectFail(UsernameSchema, "😊"); // unicode
  });

  it("should reject invalid avatarUrl", () => {
    expectFail(AvatarUrlSchema, ""); // empty string
    expectFail(AvatarUrlSchema, " "); // whitespace
    expectFail(AvatarUrlSchema, "https://a"); // too short
    expectFail(AvatarUrlSchema, "http://example.com/avatar.jpg"); // no https
    expectFail(AvatarUrlSchema, "https://w".repeat(100)); // too long
    expectFail(AvatarUrlSchema, "www.example.com"); // no http

  });

  it("should reject any consent not true", () => {
    expectFail(ConsentSchema, false); // false
    expectFail(ConsentSchema, ""); // empty string
    expectFail(ConsentSchema, " "); // whitespace
    expectFail(ConsentSchema, "true"); // string "true"
    expectFail(ConsentSchema, null); // null
    expectFail(ConsentSchema, 1); // number
  });

  it("should reject invalid oauthProviders", () => {
    expectFail(OauthProvidersSchema, ""); // empty string
    expectFail(OauthProvidersSchema, " "); // whitespace
    expectFail(OauthProvidersSchema, "facebook"); // invalid provider
    expectFail(OauthProvidersSchema, 123); // number
    expectFail(OauthProvidersSchema, ["google", "invalid-provider"]); // invalid provider in array
  });

  it("should reject invalid offset", () => {
    expectFail(OffsetSchema, "-1"); // negative number
    expectFail(OffsetSchema, "abc"); // non-numeric string
    expectFail(OffsetSchema, "10.5"); // not an integer
  });

  it("should reject invalid limit", () => {
    expectFail(LimitSchema, "-1"); // negative number
    expectFail(LimitSchema, "0"); // zero
    expectFail(LimitSchema, "100"); // too large
    expectFail(LimitSchema, "abc"); // non-numeric string
    expectFail(LimitSchema, "10.5"); // not an integer
  });

  it("should reject invalid postId postId", () => {
    const result = PostIdSchema.safeParse({ postId: "not-a-uuid" });
    expect(result.success).to.be.false; // invalid UUID
  });

  it ("should reject invalid PostIdQuery", () => {
    const result = PostIdQuerySchema.safeParse({ postId: "not-a-uuid" });
    expect(result.success).to.be.false; // invalid UUID
  });

  it("should reject invalid createdAt and updatedAt", () => {
    expectFail(CreateAtSchema, "not-a-date");
    expectFail(UpdateAtSchema, "2024-13-01T00:00:00Z"); // invalid month
  });

  it("should reject invalid AuthorId", () => {
    expectFail(AuthorIdSchema, "not-a-uuid");
    expectFail(AuthorIdSchema, ""); // empty string
    expectFail(AuthorIdSchema, " "); // whitespace
  });

  it("should reject invalid TotalOutput", () => {
    expectFail(TotalOutputSchema, "not-a-number");
    expectFail(TotalOutputSchema, undefined); // undefined
  });

  it("should reject invalid OffsetOutput", () => {
    expectFail(OffsetOutputSchema, "not-a-number");
    expectFail(OffsetOutputSchema, undefined); // undefined
  });

  it("should reject invalid LimitOutput", () => {
    expectFail(LimitOutputSchema, "not-a-number");
    expectFail(LimitOutputSchema, undefined); // undefined
  });

  it("should reject invalid slugs", () => {
    expectFail(PostSlugSchema, ""); // empty
    expectFail(PostSlugSchema, "Hello-World"); // uppercase letters
    expectFail(PostSlugSchema, "hello_world"); // underscore
    expectFail(PostSlugSchema, "hello world"); // space
    expectFail(PostSlugSchema, "hello@world"); // symbol
    expectFail(PostSlugSchema, "-hello-world"); // starts with hyphen
    expectFail(PostSlugSchema, "hello-world-"); // ends with hyphen
    expectFail(PostSlugSchema, "hello--world"); // double hyphen
    expectFail(PostSlugSchema, "123_456"); // underscore again
  });
});
