/**
 * @file terminate_with_err.ts
 * @description This file contains a function to terminate the pipeline with an error.
 */

/**
 * @summary Terminate the pipeline with an error.
 * @description This function is to help the middleware, controller, and service
 * to terminate the pipeline with an error.
 * It just throws an error with given information. Because in Express 5, all the errors
 * are passed to the error handler middleware which is defined in `app.ts`.
 *
 *
 * @param status The HTTP status code for error, e.g. 400, 401, 403, 404, 500.
 * @param msg The error message to be sent to the client. eg: "Invalid input"
 * @param errors The error object to be sent to the client. eg: { field: "email", message: "Invalid email" }
 * @throws {Error} Will throw an error with the given status and message.
 */
const terminateWithErr = (status: number, msg: string, errors?: any): never => {

  const err = new Error(msg) as Error & { status: number; errors?: any };
  err.status = status;
  err.errors = errors;

  throw err;
};

export { terminateWithErr };
