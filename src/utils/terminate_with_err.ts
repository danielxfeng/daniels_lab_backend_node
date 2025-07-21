/**
 * @file terminate_with_err.ts
 * @description This file contains a function to terminate the pipeline with an error.
 */

/**
 * @summary Terminate the pipeline with an error.
 */
const terminateWithErr = (status: number, msg: string, errors?: any): never => {

  const err = new Error(msg) as Error & { status: number; errors?: any };
  err.status = status;
  err.errors = errors;

  throw err;
};

export { terminateWithErr };
