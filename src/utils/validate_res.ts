/**
 * @file validate_res.ts
 * @description The small helper function for controller to handle the response data validation.
 */
import { ZodType } from "zod";
import { terminateWithErr } from "./terminate_with_err";

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
