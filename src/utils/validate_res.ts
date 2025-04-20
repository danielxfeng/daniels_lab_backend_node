/**
 * @file validate_res.ts
 * @description The small helper function for controller to handle the response data validation.
 */
import { ZodType } from "zod";
import { terminateWithErr } from "./terminate_with_err";

/**
 * @summary Validates the response data.
 * @description This function checks the response data by Zod.
 *
 * @param schema the schema of the response data
 * @param data the response data
 * @returns the validated data
 * @throws 500 if the response data is not valid
 */
const validate_res = <T>(
  schema: ZodType<T, any, unknown>,
  data: unknown
): T => {
  const result = schema.safeParse(data);
  if (!result.success) {
    terminateWithErr(500, "Response data is not valid", result.error.format());
  }
  return result.data as T;
};

export { validate_res };
