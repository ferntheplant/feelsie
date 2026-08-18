// The package's public surface: four capability services, each holding the operations one
// caller needs and no others.
//
// **This exists so that a violation is a type error rather than a test failure.** A002 and
// A003 both promise something a handler must be unable to do — the check-in form's GET must
// not write, the dashboard must not write at all — and both name a type witness. Handing every
// caller the `Database` service cannot carry that witness, and neither can narrowing
// `DatabaseShape`: `first` takes arbitrary statement text and executes it, so
// `INSERT … RETURNING` writes and returns its row through a handle that only has `first`. D1's
// own `.first()` behaves the same way.
//
// So the narrowing happens above the SQL. Each service names operations, the SQL is closed
// inside `core.ts`, and the Effect requirement channel does the rest: a handler annotated
// `Effect<Response, E, EntryRead | PromptRead>` cannot reach an operation requiring `CheckIn`
// without changing its own declared type, which is a compile error at the annotation.
//
// **The split is by caller, not by table.** `PromptRead` and `PromptWrite` are separate
// because the check-in form reads prompts and never writes them, while the scheduled handler
// does both; `EntryRead` and `CheckIn` are separate for the same reason across the GET/POST
// boundary. A service nobody would ever hold alone is a service that buys no witness.
import type { Option } from "effect";
import { Context, Effect, Layer } from "effect";

import {
  answerPrompt,
  markPromptSent,
  openPrompt,
  promptForDate,
  promptForToken,
  readEntry,
  recordSendFailure,
} from "./core.ts";
import { Database } from "./database.ts";
import type { DatabaseError, PromptExpiredError, PromptNotFoundError, TokenDateMismatchError } from "./errors.ts";
import type { EntryInput, LocalDate, Prompt, Timestamp, Token } from "./model.ts";

export interface PromptReadShape {
  readonly forDate: (date: LocalDate) => Effect.Effect<Option.Option<Prompt>, DatabaseError>;
  readonly forToken: (token: Token) => Effect.Effect<Option.Option<Prompt>, DatabaseError>;
}

export interface PromptWriteShape {
  /** The prompt for a local date, created if there is none. At most one exists per date. */
  readonly open: (date: LocalDate, at: Timestamp) => Effect.Effect<Prompt, DatabaseError | PromptNotFoundError>;
  /** Marks the prompt sent. Called only after a send has returned. */
  readonly markSent: (date: LocalDate, at: Timestamp) => Effect.Effect<void, DatabaseError>;
  /** Records a send that did not return, with its reason. */
  readonly recordFailure: (date: LocalDate, at: Timestamp, reason: string) => Effect.Effect<void, DatabaseError>;
}

export interface EntryReadShape {
  readonly forDate: (date: LocalDate) => Effect.Effect<Option.Option<EntryInput>, DatabaseError>;
}

export interface CheckInShape {
  readonly answer: (
    token: Token,
    entry: EntryInput,
  ) => Effect.Effect<EntryInput, DatabaseError | PromptExpiredError | PromptNotFoundError | TokenDateMismatchError>;
}

export class PromptRead extends Context.Service<PromptRead, PromptReadShape>()("@feelsie/core/PromptRead") {
  static readonly layer: Layer.Layer<PromptRead, never, Database> = Layer.effect(
    PromptRead,
    Effect.map(Database, (database) => ({
      forDate: (date: LocalDate) => Effect.provideService(promptForDate(date), Database, database),
      forToken: (token: Token) => Effect.provideService(promptForToken(token), Database, database),
    })),
  );
}

export class PromptWrite extends Context.Service<PromptWrite, PromptWriteShape>()("@feelsie/core/PromptWrite") {
  static readonly layer: Layer.Layer<PromptWrite, never, Database> = Layer.effect(
    PromptWrite,
    Effect.map(Database, (database) => ({
      open: (date: LocalDate, at: Timestamp) => Effect.provideService(openPrompt(date, at), Database, database),
      markSent: (date: LocalDate, at: Timestamp) => Effect.provideService(markPromptSent(date, at), Database, database),
      recordFailure: (date: LocalDate, at: Timestamp, reason: string) =>
        Effect.provideService(recordSendFailure(date, at, reason), Database, database),
    })),
  );
}

export class EntryRead extends Context.Service<EntryRead, EntryReadShape>()("@feelsie/core/EntryRead") {
  static readonly layer: Layer.Layer<EntryRead, never, Database> = Layer.effect(
    EntryRead,
    Effect.map(Database, (database) => ({
      forDate: (date: LocalDate) => Effect.provideService(readEntry(date), Database, database),
    })),
  );
}

export class CheckIn extends Context.Service<CheckIn, CheckInShape>()("@feelsie/core/CheckIn") {
  static readonly layer: Layer.Layer<CheckIn, never, Database> = Layer.effect(
    CheckIn,
    Effect.map(Database, (database) => ({
      answer: (token: Token, entry: EntryInput) =>
        Effect.provideService(answerPrompt(token, entry), Database, database),
    })),
  );
}

/**
 * Every capability, over one `Database`. A Worker builds this once in its init phase and hands
 * each handler only the slice its annotation admits — the layer is where the services meet,
 * and it is deliberately the only place they do.
 */
export const capabilitiesLayer: Layer.Layer<CheckIn | EntryRead | PromptRead | PromptWrite, never, Database> =
  Layer.mergeAll(CheckIn.layer, EntryRead.layer, PromptRead.layer, PromptWrite.layer);
