import { Data } from "effect";

export class ConfigValidationError extends Data.TaggedError("ConfigValidationError")<{
  readonly field: "SEND_HOUR" | "TZ";
  readonly value: string;
}> {}

export class DatabaseError extends Data.TaggedError("DatabaseError")<{
  readonly cause: unknown;
  readonly operation: string;
  readonly retryable?: boolean;
}> {}

export class PromptNotFoundError extends Data.TaggedError("PromptNotFoundError") {}

export class PromptExpiredError extends Data.TaggedError("PromptExpiredError")<{
  readonly expiresAt: number;
}> {}

export class TokenDateMismatchError extends Data.TaggedError("TokenDateMismatchError")<{
  readonly authorisedDate: string;
  readonly requestedDate: string;
}> {}
