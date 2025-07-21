/**
 * @file sign_jwt.ts
 * @description The utility function to sign JWT tokens.
 */

import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";

const privateKey = fs.readFileSync(
  path.resolve(
    process.cwd(),
    process.env.JWT_PRIVATE_KEY_PATH || ".keys/private.key"
  ),
  "utf-8"
);

/**
 * @summary signJwt
 */
const signJwt = (payload: object, period: string): string => {
  return jwt.sign({ ...payload, timestamp: Date.now() }, privateKey, {
    expiresIn: period as `${number}${"s" | "m" | "h" | "d"}`,
    algorithm: "RS256",
  });
};

export { signJwt };
