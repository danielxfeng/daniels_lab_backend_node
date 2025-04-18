/**
 * @file global_types.ts
 * @description The global types for the project.
 * This file is used to extend the Express Request type.
 * This is used to store the user information after authentication
 * and the validated query parameters after validation.
 */

export {}; // To suppress the "Cannot redeclare block-scoped variable" error

declare global {
  namespace Express {
    interface Request {
      /**
       * @description The user information after authentication.
       */
      user?: {
        id: string;
        isAdmin: boolean;
      };

      /**
       * @description The validated query parameters after validation.
       */
      validated?: unknown;
    }
  }
}
