/**
 * @file type_auth.ts
 * @description The type definitions for authentication.
 */

import { Request } from "express";

type User = {
  id: string;
  isAdmin: boolean;
};

interface AuthRequest<P = unknown, B = unknown, Q = unknown>
  extends Request<any, any, any, any> {
  locals?: {
    user?: User;
    params?: P;
    body?: B;
    query?: Q;
  };
}

type VerifiedToken =
  | {
      valid: {
        user?: User;
        state?: string;
        type: "access" | "refresh" | "state";
      };
    }
  | { expired: undefined }
  | { invalid: undefined };

export type { AuthRequest, User, VerifiedToken };
