/**
 * @summary verifyJwt
 */
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import { User, VerifiedToken } from "../../types/type_auth";

const publicKey = fs.readFileSync(
  path.resolve(
    process.cwd(),
    process.env.JWT_PUBLIC_KEY_PATH || ".keys/public.key"
  ),
  "utf-8"
);

/**
 * @summary verifyJwt
 */
const verifyJwt = (token: string): VerifiedToken => {
  try {
    return {
      valid: jwt.verify(token, publicKey, { algorithms: ["RS256"] }) as {
        user?: User;
        state?: string;
        type: "access" | "refresh" | "state";
      },
    };
  } catch (err: any) {
    if (err.name === "TokenExpiredError") return { expired: undefined };
    return { invalid: undefined };
  }
};

export { verifyJwt };

export type { VerifiedToken };
