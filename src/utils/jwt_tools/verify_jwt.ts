/**
 * @summary verifyJwt
 * @description The utility function to verify JWT tokens.
 * @description It verifies the token with the public key using RS256 algorithm.
 */
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";

const publicKey = fs.readFileSync(
  path.resolve(process.cwd(), process.env.JWT_PUBLIC_KEY_PATH || ".keys/public.key"),
  "utf-8"
);

/**
 * @summary the type of the verified token
 * @description The verified token can be one of the following:
 * - valid: payload.
 * - expired: undefined.
 * - invalid: undefined.
 */
type VerifiedToken =
  | { valid: any }
  | { expired: undefined }
  | { invalid: undefined };

/**
 * @summary verifyJwt
 * @description Verifies a JWT token using RS256 public key.
 * It uses the public key and the RS256 algorithm to verify the token.
 * So it can be deployed independently on other servers.
 *
 * @param token The JWT token to verify.
 * @returns {valid: payload} | { expired: undefined } | { invalid: undefined}
 */
const verifyJwt = (token: string): VerifiedToken => {
  try {
    return { valid: jwt.verify(token, publicKey, { algorithms: ["RS256"] }) };
  } catch (err: any) {
    if (err.name === "TokenExpiredError") return { expired: undefined };
    return { invalid: undefined };
  }
};

export { verifyJwt };

export type { VerifiedToken };
