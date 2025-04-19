import { expect } from "chai";
import sinon from "sinon";
import { z } from "zod";
import { Request, Response } from "express";
import validate  from "../../src/middleware/validate";

// Mock a request/response object
const makeCtx = (data: Partial<{ body: any; query: any; params: any }> = {}) => {
  const req = {
    body: data.body || {},
    query: data.query || {},
    params: data.params || {},
  } as Request;

  const res = {
    status: sinon.stub().returnsThis(),
    json: sinon.stub(),
  } as unknown as Response;

  const next = sinon.spy() as sinon.SinonSpy;

  return { req, res, next };
};

describe("validate middleware", () => {
  it("should pass the validation with single schema and matched request", () => {
    const schema = {
      body: z.object({ name: z.string() }),
    };
    type SchemaType = z.infer<typeof schema.body>;

    const { req, res, next } = makeCtx({ body: { name: "Alice" } });

    validate(schema)(req, res, next);

    const typedReq = req as Request<{}, any, SchemaType>;

    expect(next.calledOnce).to.be.true;
    expect(typedReq.body.name).to.equal("Alice");
  });

  it("should pass the validation with multiple schemas and matched request", () => {
    const schema = {
      body: z.object({ count: z.number() }),
      query: z.object({ active: z.boolean() }),
      params: z.object({ date: z.string().refine(val => !isNaN(Date.parse(val)), {
        message: "Invalid date format",
      }) }),
    };
  
    type Body = z.infer<typeof schema.body>;
    type Query = z.infer<typeof schema.query>;
    type Params = z.infer<typeof schema.params>;
  
    const { req, res, next } = makeCtx({
      body: { count: 42 },
      query: { active: true },
      params: { date: "2024-12-31" },
    });
  
    validate(schema)(req, res, next);
  
    const typedReq = req as unknown as Request<Params, any, Body, Query>;
  
    expect(next.calledOnce).to.be.true;
    expect(typedReq.body.count).to.equal(42);
    expect(typedReq.query.active).to.equal(true);
    expect(typedReq.params.date).to.equal("2024-12-31");
  });
  
  it("should fail validation on single schema and throw 400 error", () => {
    const schema = {
      body: z.object({ age: z.number().min(18) }),
    };
  
    const { req, res, next } = makeCtx({ body: { age: 10 } });
  
    try {
      validate(schema)(req, res, next);
      throw new Error("Expected validation to fail but it passed.");
    } catch (err: any) {
      expect(err).to.have.property("status", 400);
      expect(err.message).to.include("Request validation failed");
      expect(err.errors).to.have.property("body");
      expect(err.errors["body"]).to.have.property("age");
    }
  });

  it("should fail validation on multiple schemas with single unmatched data and throw 400 error", () => {
    const schema = {
      body: z.object({ count: z.number() }),
      query: z.object({ active: z.boolean() }),
      params: z.object({ date: z.string().refine(val => !isNaN(Date.parse(val)), {
        message: "Invalid date format",
      }) }),
    };
  
    const { req, res, next } = makeCtx({
      body: { count: 42 },
      query: { active: "notBoolean" },
      params: { date: "2024-12-31" },
    });
  
    try {
      validate(schema)(req, res, next);
      throw new Error("Expected validation to fail but it passed.");
    } catch (err: any) {
      expect(err).to.have.property("status", 400);
      expect(err.message).to.include("Request validation failed");
  
      expect(err.errors).to.have.property("query");
      expect(err.errors["query"]).to.have.property("active");
  
      expect(err.errors).to.not.have.property("body");
      expect(err.errors).to.not.have.property("params");
    }
  });
  
  it("should fail validation on multiple schemas with multiple unmatched data and throw 400 error", () => {
    const schema = {
      body: z.object({
        count: z.number().min(10),
      }),
      query: z.object({
        active: z.boolean(),
      }),
      params: z.object({
        date: z.string().refine(val => !isNaN(Date.parse(val)), {
          message: "Invalid date format",
        }),
      }),
    };
  
    const { req, res, next } = makeCtx({
      body: { count: 2 },
      query: { active: "yes" },
      params: { date: "not-a-date" },
    });
  
    try {
      validate(schema)(req, res, next);
      throw new Error("Expected validation to fail but it passed.");
    } catch (err: any) {
      expect(err).to.have.property("status", 400);
      expect(err.message).to.include("Request validation failed");
  
      expect(err.errors).to.have.property("body");
      expect(err.errors["body"]).to.have.property("count");
  
      expect(err.errors).to.have.property("query");
      expect(err.errors["query"]).to.have.property("active");
  
      expect(err.errors).to.have.property("params");
      expect(err.errors["params"]).to.have.property("date");
    }
  });
});
