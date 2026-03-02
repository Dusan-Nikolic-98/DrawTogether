import { ZodIssue } from "zod";

export type ErrorCode =
  | "DUPLICATE_USERNAME"
  | "BAD_PICTURE_DATA"
  | "LOGGED_IN"
  | "INCORRECT_CREDENTIALS"
  | "INVALID_DATA"
  | "NO_SUCH_ENTITY"
  | "NOT_YOURS"
  | "NOT_AUTHENTICATED"
  | "INTERNAL_ERROR";

export type APIErrorCommon = {
  failed: true;
  code: ErrorCode;
  extra?: any;
};

// Helper za kreiranje error objekta
export function apiError(
  code: ErrorCode,
  extra?: ZodIssue[] | Record<string, any>
): APIErrorCommon {
  return { failed: true, code, ...(extra ? { extra } : {}) };
}
