/**
 * @file error_handler.test.ts
 * @description Unit tests for the error handler middleware.
 * The test cases cover different scenarios:
 * - Specific error with status and message
 * - Un-specified error should be handled as a 500 error
 * - Development mode should show full error details
 * - Production mode should hide internal error details
 */
import { expect } from "chai";
import sinon from "sinon";
import { Request, Response, NextFunction } from "express";
import errorHandler from "../../src/middleware/error_handler";

describe("errorHandler middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonStub: sinon.SinonStub;
  let statusStub: sinon.SinonStub;
  let next: NextFunction;

  beforeEach(() => {
    req = {};
    jsonStub = sinon.stub();
    statusStub = sinon.stub().returns({ json: jsonStub });
    res = {
      status: statusStub,
    };
    next = sinon.spy();
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should send full error in development mode", () => {
    process.env.NODE_ENV = "development";

    const err = {
      status: 400,
      message: "Bad Request",
      errors: { field: "is required" },
      stack: "stack trace here",
    };

    errorHandler(err, req as Request, res as Response, next);

    expect(statusStub.calledWith(400)).to.be.true;
    expect(jsonStub.calledOnce).to.be.true;

    const jsonArg = jsonStub.firstCall.args[0];
    expect(jsonArg).to.include({
      message: "Bad Request",
      stack: "stack trace here",
    });
    expect(jsonArg.errors).to.deep.equal({ field: "is required" });
  });

  it("should hide internal error message in production", () => {
    process.env.NODE_ENV = "production";

    const err = {
      status: 500,
      message: "Database crashed",
      errors: { db: "fail" },
      stack: "stack trace here",
    };

    errorHandler(err, req as Request, res as Response, next);

    expect(statusStub.calledWith(500)).to.be.true;
    expect(jsonStub.calledOnce).to.be.true;

    const jsonArg = jsonStub.firstCall.args[0];
    expect(jsonArg.message).to.equal("Internal Server Error");
    expect(jsonArg.errors).to.be.undefined;
    expect(jsonArg.stack).to.be.undefined;
  });

  it("should return error message for 400 in production", () => {
    process.env.NODE_ENV = "production";

    const err = {
      status: 400,
      message: "Bad input",
      errors: { input: "invalid" },
      stack: "no stack",
    };

    errorHandler(err, req as Request, res as Response, next);

    expect(statusStub.calledWith(400)).to.be.true;
    const jsonArg = jsonStub.firstCall.args[0];
    expect(jsonArg.message).to.equal("Bad input");
    expect(jsonArg.errors).to.deep.equal({ input: "invalid" });
    expect(jsonArg.stack).to.be.undefined;
  });

  it("should default to status 500 if not provided", () => {
    process.env.NODE_ENV = "development";

    const err = new Error("Something went wrong");

    errorHandler(err, req as Request, res as Response, next);

    expect(statusStub.calledWith(500)).to.be.true;
    const jsonArg = jsonStub.firstCall.args[0];
    expect(jsonArg.message).to.equal("Something went wrong");
    expect(jsonArg.stack).to.be.a("string");
  });
});
