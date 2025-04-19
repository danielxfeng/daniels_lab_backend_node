/**
 * @file sign_jwt.ts
 * @description The utility function to sign JWT tokens.
 */

import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";

const privateKey = fs.readFileSync(
  path.resolve(process.cwd(), process.env.JWT_PRIVATE_KEY_PATH || ".keys/private.key"),
  "utf-8"
);

/**
 * @summary signJwt
 * @description Signs a JWT token with the given payload and expiration period.
 * It signs the token with the private key using RS256 algorithm,
 * then the decode function can be used on other server which has the public key.
 *
 * @param payload The payload to sign.
 * @param period The expiration period of the token, be sure to use e.g. "1h", "30m", "2d".
 * @returns The signed token.
 */
const signJwt = (
  payload: object,
  period: string,
): string => {
  return jwt.sign(payload, privateKey, {
    expiresIn: period as `${number}${"s" | "m" | "h" | "d"}`,
    algorithm: "RS256",
  });
};

export { signJwt };
