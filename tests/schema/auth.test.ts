import { describe } from "mocha";
import { expect } from "chai";
import {
  RegisterBodySchema,
  LoginBodySchema,
  ChangePasswordBodySchema,
  RefreshTokenBodySchema,
  OAuthProviderParamSchema,
  OAuthConsentQuerySchema,
  JoinAdminBodySchema,
  AuthResponseSchema,
  TokenRefreshResponseSchema,
} from "../../src/schema/schema_auth";

const expectFail = (schema: any, input: any) => {
  const result = schema.safeParse(input);
  expect(result.success).to.be.false;
};

describe("Auth Schemas - Valid Inputs", () => {
  it("should accept valid RegisterBody", () => {
    const result = RegisterBodySchema.safeParse({
      username: "testuser",
      password: "Password12$",
      confirmPassword: "Password12$",
      consent: true,
      consentAt: new Date("2023-01-01T00:00:00Z").toISOString(),
      deviceId: "0123456789abcdef",
    });
    expect(result.success).to.be.true;
    expect(result.data).to.deep.equal({
      username: "testuser",
      password: "Password12$",
      confirmPassword: "Password12$",
      consent: true,
      consentAt: new Date("2023-01-01T00:00:00Z").toISOString(),
      deviceId: "0123456789abcdef",
    });
  });

  it("should accept valid LoginBody", () => {
    const result = LoginBodySchema.safeParse({
      username: "testuser",
      password: "Password12$",
      deviceId: "0123456789abcdef",
    });
    expect(result.success).to.be.true;
    expect(result.data).to.deep.equal({
      username: "testuser",
      password: "Password12$",
      deviceId: "0123456789abcdef",
    });
  });

  it("should accept valid ChangePasswordBody", () => {
    const result = ChangePasswordBodySchema.safeParse({
      currentPassword: "Password12$",
      password: "Password123$",
      confirmPassword: "Password123$",
      deviceId: "0123456789abcdef",
    });
    expect(result.success).to.be.true;
    expect(result.data).to.deep.equal({
      currentPassword: "Password12$",
      password: "Password123$",
      confirmPassword: "Password123$",
      deviceId: "0123456789abcdef",
    });
  });

  it("should accept valid RefreshTokenBody", () => {
    const result = RefreshTokenBodySchema.safeParse({
      refreshToken: "123e4567-e89b-12d3-a456-426614174000",
      deviceId: "0123456789abcdef",
    });
    if (result.error) {
      console.dir(result.error, { depth: 10 });
    }
    expect(result.success).to.be.true;
    expect(result.data).to.deep.equal({
      refreshToken: "123e4567-e89b-12d3-a456-426614174000",
      deviceId: "0123456789abcdef",
    });
  });

  it("should accept valid OAuthProviderParam", () => {
    const result = OAuthProviderParamSchema.safeParse({
      provider: "google",
    });
    expect(result.success).to.be.true;
    expect(result.data).to.deep.equal({
      provider: "google",
    });
  });

  it("should accept valid OAuthConsentQuery", () => {
    const result = OAuthConsentQuerySchema.safeParse({
      consentAt: new Date("2023-01-01T00:00:00Z").toISOString(),
      deviceId: "0123456789abcdef",
    });
    expect(result.success).to.be.true;
    expect(result.data).to.deep.equal({
      consentAt: new Date("2023-01-01T00:00:00Z").toISOString(),
      deviceId: "0123456789abcdef",
    });
  });

  it("should accept valid JoinAdminBody", () => {
    const result = JoinAdminBodySchema.safeParse({
      referenceCode: "123e4567-e89b-12d3-a456-426614174000",
      deviceId: "0123456789abcdef",
    });
    expect(result.success).to.be.true;
    expect(result.data).to.deep.equal({
      referenceCode: "123e4567-e89b-12d3-a456-426614174000",
      deviceId: "0123456789abcdef",
    });
  });
  it("should accept valid AuthResponse", () => {
    const result = AuthResponseSchema.safeParse({
      accessToken: "123e4567-e89b-12d3-a456-426614174000",
      refreshToken: "123e4567-e89b-12d3-a456-426614174000",
      id: "123e4567-e89b-12d3-a456-426614174000",
      username: "testuser",
      avatarUrl: "https://example.com/avatar.png",
      isAdmin: false,
      oauthProviders: ["google"],
    });
    expect(result.success).to.be.true;
    expect(result.data).to.deep.equal({
      accessToken: "123e4567-e89b-12d3-a456-426614174000",
      refreshToken: "123e4567-e89b-12d3-a456-426614174000",
      id: "123e4567-e89b-12d3-a456-426614174000",
      username: "testuser",
      avatarUrl: "https://example.com/avatar.png",
      isAdmin: false,
      oauthProviders: ["google"],
    });
  });
  it("should accept valid TokenRefreshResponse", () => {
    const result = TokenRefreshResponseSchema.safeParse({
      accessToken: "123e4567-e89b-12d3-a456-426614174000",
      refreshToken: "123e4567-e89b-12d3-a456-426614174000",
    });
    expect(result.success).to.be.true;
    expect(result.data).to.deep.equal({
      accessToken: "123e4567-e89b-12d3-a456-426614174000",
      refreshToken: "123e4567-e89b-12d3-a456-426614174000",
    });
  });
});

describe("Auth Schemas - Invalid Inputs", () => {
  it("should fail on invalid RegisterBody", () => {
    expectFail(RegisterBodySchema, {
      username: "testuser",
      password: "Password12$",
      confirmPassword: "Password12$",
      consentAt: new Date("2023-01-01T00:00:00Z").toISOString(),
    });
  });
  it("should fail on invalid RegisterBody - invalid password", () => {
    expectFail(RegisterBodySchema, {
      username: "testuser",
      password: "Password12$",
      confirmPassword: "Password12$2",
      consentAt: new Date("2023-01-01T00:00:00Z").toISOString(),
    });
  });

  it("should fail on invalid RegisterBody - invalid consentAt", () => {
    expectFail(RegisterBodySchema, {
      username: "testuser",
      password: "Password12$",
      confirmPassword: "Password12$",
      consentAt: (new Date((new Date()).getTime() + 222222)).toISOString(),
    });
  });

  it("should fail on invalid LoginBody", () => {
    expectFail(LoginBodySchema, {
      username: "testuser",
    });
  });

  it("should fail on invalid ChangePasswordBody", () => {
    expectFail(ChangePasswordBodySchema, {
      currentPassword: "Password12$",
      password: "Password123$",
    });
  });

  it("should fail on invalid RefreshTokenBody", () => {
    expectFail(RefreshTokenBodySchema, {
      refreshToken: "123e4",
      deviceId: "0123456789abcdef",
    });
  });

  it("should fail on invalid OAuthProviderParam", () => {
    expectFail(OAuthProviderParamSchema, {});
  });

  it("should fail on invalid OAuthConsentQuery", () => {
    expectFail(OAuthConsentQuerySchema, {});
  });

  it("should fail on invalid JoinAdminBody", () => {
    expectFail(JoinAdminBodySchema, {});
  });
});
