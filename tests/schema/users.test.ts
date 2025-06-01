import { describe } from "mocha";
import { expect } from "chai";
import {
  UpdateUserBodySchema,
  UserIdParamSchema,
  UserResponseSchema,
  UsersResponseSchema,
} from "../../src/schema/schema_users";

const expectFail = (schema: any, input: any) => {
  const result = schema.safeParse(input);
  expect(result.success).to.be.false;
};

describe("Users Schemas - Valid Inputs", () => {
  it("should validate UpdateUserBodySchema with valid input", () => {
    const validInput = {
      username: "validUsername",
    };
    const result = UpdateUserBodySchema.safeParse(validInput);
    expect(result.success).to.be.true;
    expect(result.data).to.deep.equal(validInput);
  });

  it("should validate UserIdParamSchema with valid input", () => {
    const validInput = { userId: "123e4567-e89b-12d3-a456-426614174000" };
    const result = UserIdParamSchema.safeParse(validInput);
    expect(result.success).to.be.true;
    expect(result.data).to.deep.equal(validInput);
  });

  it("should validate UserResponseSchema with valid input", () => {
    const validInput = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      username: "validUsername",
      avatarUrl: "https://example.com/avatar.jpg",
      oauthProviders: ["google", "github"],
      isAdmin: false,
      hasPassword: true,
      createdAt: "2023-10-01T12:00:00Z",
      updatedAt: "2023-10-01T12:00:00Z",
      consentAt: "2023-10-01T12:00:00Z",
    };
    const result = UserResponseSchema.safeParse(validInput);
    expect(result.success).to.be.true;
    expect(result.data).to.deep.equal(validInput);
  });

  it("should validate UsersListResponseSchema with valid input", () => {
    const validInput = [
      {
        id: "123e4567-e89b-12d3-a456-426614174000",
        username: "validUsername",
        avatarUrl: "https://example.com/avatar.jpg",
        oauthProviders: ["google", "github"],
        isAdmin: false,
        hasPassword: true,
        createdAt: "2023-10-01T12:00:00Z",
        updatedAt: "2023-10-01T12:00:00Z",
        consentAt: "2023-10-01T12:00:00Z",
      },
    ];
    const result = UsersResponseSchema.safeParse(validInput);
    expect(result.success).to.be.true;
    expect(result.data).to.deep.equal(validInput);
  });

  it("should validate UsersResponseSchema with empty array", () => {
    const validInput: any[] = [];
    const result = UsersResponseSchema.safeParse(validInput);
    expect(result.success).to.be.true;
    expect(result.data).to.deep.equal(validInput);
  });
});

describe("Users Schemas - Invalid Inputs", () => {
  it("should fail UpdateUserBodySchema with invalid username", () => {
    const invalidInput = {
      username: "invalidUsername@123",
    };
    expectFail(UpdateUserBodySchema, invalidInput);
  });

  it("should fail UpdateUserBodySchema with too short username", () => {
    const invalidInput = {
      username: "ab",
    };
    expectFail(UpdateUserBodySchema, invalidInput);
  });

  it("should fail UpdateUserBodySchema with too long username", () => {
    const invalidInput = {
      username: "a".repeat(51),
    };
    expectFail(UpdateUserBodySchema, invalidInput);
  });

  it("should fail UserIdParamSchema with invalid userId format", () => {
    const invalidInput = { userId: "invalid-uuid" };
    expectFail(UserIdParamSchema, invalidInput);
  });

  it("should fail UserIdParamSchema with missing userId", () => {
    const invalidInput = {};
    expectFail(UserIdParamSchema, invalidInput);
  });

  it("should fail UserResponseSchema with invalid id format", () => {
    const invalidInput = {
      id: "invalid-uuid",
      username: "validUsername",
      avatarUrl: "https://example.com/avatar.jpg",
      oauthProviders: ["google", "github"],
      isAdmin: false,
      createdAt: "2023-10-01T12:00:00Z",
      updatedAt: "2023-10-01T12:00:00Z",
      hasPassword: true,
      consent: true,
      consentAt: "2023-10-01T12:00:00Z",
    };
    expectFail(UserResponseSchema, invalidInput);
  });

  it("should fail UsersResponseSchema with missing required fields", () => {
    const invalidInput = [
      {
        id: "123e4567-e89b-12d3-a456-426614174000",
        username: "validUsername",
        avatarUrl: "https://example.com/avatar.jpg",
        oauthProviders: ["google", "github"],
        isAdmin: false,
        hasPassword: true,
        createdAt: "2023-10-01T12:00:00Z",
        updatedAt: "2023-10-01T12:00:00Z",
        consent: true,
      },
    ];
    expectFail(UsersResponseSchema, invalidInput);
  });
});
