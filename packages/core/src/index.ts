// The package's public entrypoint. `Database` and the SQL types are **not** here — they are
// `@feelsie/core/database`, so that reaching arbitrary SQL is an import an app has to write and
// a lint rule can deny. See `capabilities.ts` for why the narrowing lives above the SQL.
export { capabilitiesLayer, CheckIn, EntryRead, PromptRead, PromptWrite } from "./capabilities.ts";
export type { CheckInShape, EntryReadShape, PromptReadShape, PromptWriteShape } from "./capabilities.ts";
export { configEnvironmentVariables, configLayer, CoreConfig, decodeConfig } from "./config.ts";
export { currentLocalTime, expiresAt, isSendHour, senderAddress } from "./core.ts";
export {
  ConfigValidationError,
  DatabaseError,
  PromptExpiredError,
  PromptNotFoundError,
  TokenDateMismatchError,
} from "./errors.ts";
export { LocalDate, Measure, Timestamp, Token } from "./model.ts";
export type { CoreConfigValue, EntryInput, LocalTime, Prompt } from "./model.ts";
